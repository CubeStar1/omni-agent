import uuid
import asyncio
from typing import Any, Dict, List, Optional
from app.tools.base import BaseTool, ToolResult
from app.services.preprocessors.document_processor import DocumentProcessor
from app.services.retrievers.retrieval_service import RetrievalService
from app.services.vector_stores.vector_store_factory import VectorStoreFactory
from app.providers.factory import LLMProviderFactory
from app.prompts.context_summary_prompt import ContextSummaryPrompt
from app.config.settings import settings

class RAGTool(BaseTool):
    """
    RAG (Retrieval-Augmented Generation) Tool
    
    This tool abstracts document processing, vector storage, and retrieval of document content chunks.
    It can process documents from URLs and retrieve relevant context/chunks based on questions.
    """
    
    def __init__(self):
        super().__init__(
            name="rag_search",
            description="Process a document from URL and retrieve relevant context/chunks based on questions. Returns the actual document content chunks rather than generated answers, allowing you to see what information is available in the document."
        )
        
        self.vector_store = VectorStoreFactory.create_vector_store(settings)
        self.llm_provider = LLMProviderFactory.create_provider(
            settings.DEFAULT_LLM_PROVIDER, 
            settings
        )
        self.document_processor = DocumentProcessor(
            vector_store=self.vector_store,
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        self.retrieval_service = RetrievalService(
            vector_store=self.vector_store,
            llm_provider=self.llm_provider
        )
    
    async def _retrieve_context_with_summary(self, document_id: str, questions: List[str], k: int = 10) -> Dict:
        """Retrieve context chunks and generate summary"""
        all_docs_with_scores = []
        
        # Execute all searches in parallel
        search_tasks = []
        for question in questions:
            print(f"Retrieving context for: {question}")
            
            if hasattr(self.vector_store, 'asimilarity_search_with_score'):
                task = self.vector_store.asimilarity_search_with_score(
                    query=question,
                    k=k,
                    filter={"document_id": document_id}
                )
            else:
                task = asyncio.to_thread(
                    self.vector_store.similarity_search_with_score,
                    query=question,
                    k=k,
                    filter={"document_id": document_id}
                )
            search_tasks.append(task)
        
        try:
            search_results = await asyncio.gather(*search_tasks, return_exceptions=True)
            
            for i, result in enumerate(search_results):
                if isinstance(result, Exception):
                    print(f"Search failed for query '{questions[i]}': {result}")
                    continue
                all_docs_with_scores.extend(result)
                
        except Exception as e:
            print(f"Parallel search failed: {e}")
            return {"chunks": [], "summary": "", "error": str(e)}
        
        # Convert to chunks format
        chunks = [
            {"content": doc.page_content, "similarity_score": float(score)}
            for doc, score in all_docs_with_scores
        ]
        
        # Generate summary
        summary = ""
        try:
            if chunks:
                context_text = "\n\n".join([c["content"] for c in chunks])
                summary_prompt = ContextSummaryPrompt.get_context_summary_prompt().format(
                    question=" | ".join(questions), 
                    context=context_text
                )

                llm = self.llm_provider.get_langchain_llm()
                
                if hasattr(llm, 'ainvoke'):
                    summary_response = await llm.ainvoke(summary_prompt)
                    summary = summary_response.content if hasattr(summary_response, 'content') else str(summary_response)
                else:
                    summary = await asyncio.to_thread(lambda: llm.invoke(summary_prompt).content)
                    
        except Exception as e:
            print(f"Summary generation failed: {e}")
            summary = ""
        
        return {
            "chunks": chunks,
            "summary": summary.strip()
        }
    
    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "document_url": {
                    "type": "string",
                    "description": "URL of the document to process (PDF, DOCX, TXT, etc.)"
                },
                "questions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of questions/queries to search for in the document content"
                },
                "k": {
                    "type": "integer",
                    "default": 10,
                    "description": "Number of document chunks to retrieve for each question"
                },
                "use_ocr": {
                    "type": "boolean",
                    "default": False,
                    "description": "Use the richer but slower PyMuPDF4LLMLoader extraction pipeline"
                },
                "use_cache": {
                    "type": "boolean",
                    "default": True,
                    "description": "Whether to use cached vector store if available"
                }
            },
            "required": ["document_url", "questions"]
        }
    
    async def execute(self, **kwargs) -> ToolResult:
        """
        Execute RAG processing on a document
        
        Args:
            document_url: URL of the document to process
            questions: List of questions to answer
            k: Number of chunks to retrieve (default: 10)
            use_ocr: Use the richer but slower PyMuPDF4LLMLoader extraction pipeline (default: False)
            use_cache: Whether to use cache if available (default: True)
        
        Returns:
            ToolResult with answers to the questions
        """
        try:
            document_url = kwargs.get("document_url")
            questions = kwargs.get("questions", [])
            k = kwargs.get("k", 10)
            use_ocr = kwargs.get("use_ocr", False)
            use_cache = kwargs.get("use_cache", True)
            
            if not document_url:
                return ToolResult(
                    success=False,
                    error="document_url parameter is required"
                )
            
            if not questions:
                return ToolResult(
                    success=False,
                    error="questions parameter is required and must be a non-empty list"
                )
            
            document_id = str(uuid.uuid4())
            cached_used = False
            
            # Set the OCR/LLM loader preference
            self.document_processor.file_processor.use_llm_pdf_loader = use_ocr
            
            # Compose a cache key that differentiates between loader variants
            cache_key = f"{document_url}::{'ocr' if use_ocr else 'std'}"
            
            print(f"Cleaning vector store before RAG processing...")
            if hasattr(self.vector_store, 'adelete_all_documents'):
                await self.vector_store.adelete_all_documents()
            else:
                self.vector_store.delete_all_documents()
            
            # If requested, attempt to load existing cache for this URL (variant-sensitive)
            if (use_cache and 
                settings.ENABLE_CACHING and 
                self.vector_store.supports_caching() and 
                self.vector_store.has_cache(cache_key)):
                
                print(f"Found cached vector store for document: {document_url[:50]}... (variant: {'ocr' if use_ocr else 'std'})")
                
                if self.vector_store.load_from_cache(cache_key):
                    cached_used = True
                    print("Successfully loaded cached vector store")
                    
                    try:
                        if hasattr(self.vector_store, 'aget_document_count'):
                            chunks_processed = await self.vector_store.aget_document_count()
                        else:
                            chunks_processed = self.vector_store.get_document_count()
                    except:
                        chunks_processed = -1
                else:
                    print("Failed to load cached vector store, processing document...")
                    cached_used = False
            
            if not cached_used:
                print(f"Processing document: {document_url} (OCR: {use_ocr})")
                processing_result = await self.document_processor.process_document_url(
                    document_url=document_url,
                    document_id=document_id
                )
                
                if not processing_result["success"]:
                    return ToolResult(
                        success=False,
                        error=f"Failed to process document: {processing_result['error']}"
                    )
                
                chunks_processed = processing_result["chunks_processed"]
                
                if (settings.ENABLE_CACHING and 
                    self.vector_store.supports_caching() and 
                    chunks_processed >= settings.CACHE_MIN_CHUNKS):
                    print(f"Caching large document ({chunks_processed} chunks) with key: {cache_key}")
                    self.vector_store.save_to_cache(cache_key)
            
            print(f"Retrieving context for {len(questions)} questions...")
            context_results = await self._retrieve_context_with_summary(
                document_id=document_id,
                questions=questions,
                k=k
            )
            
            if "error" in context_results:
                return ToolResult(
                    success=False,
                    error=f"Context retrieval failed: {context_results['error']}"
                )
            
            return ToolResult(
                success=True,
                result={
                    "chunks": context_results["chunks"],
                    "summary": context_results["summary"],
                    "document_processed": True,
                    "chunks_processed": chunks_processed,
                    "cached_used": cached_used,
                    "use_ocr": use_ocr
                }
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                error=f"RAG tool execution failed: {str(e)}"
            )
