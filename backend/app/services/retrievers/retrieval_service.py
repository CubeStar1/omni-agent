from app.services.vector_stores.base_vector_store import BaseVectorStore
from app.providers.base import BaseLLMProvider
from app.prompts.traditional_rag_prompt import TraditionalRagPrompt
from typing import List, Dict, Optional
import asyncio
import time

class RetrievalService:
    def __init__(self, vector_store: BaseVectorStore, llm_provider: BaseLLMProvider):
        self.vector_store = vector_store
        self.llm_provider = llm_provider
        
    async def process_document_queries(
        self, 
        document_id: str, 
        questions: List[str],
        namespace: Optional[str] = None,
        k: int = 10
    ) -> Dict:
        """Process multiple questions for a document with detailed debugging info (parallelized)"""
        
        async def process_single_question(i: int, question: str) -> Dict:
            """Process a single question and return the result"""
            
            try:
                if hasattr(self.vector_store, 'asimilarity_search_with_score'):
                    docs_with_scores = await self.vector_store.asimilarity_search_with_score(
                        query=question,
                        k=k,
                        filter={"document_id": document_id},
                        namespace=namespace
                    )
                else:
                    docs_with_scores = self.vector_store.similarity_search_with_score(
                        query=question,
                        k=k,
                        filter={"document_id": document_id},
                        namespace=namespace
                    )
                
                if not docs_with_scores:
                    result = {
                        "answer": "No relevant information found in the document.",
                        "debug_info": {
                            "question": question,
                            "answer": "No relevant information found in the document.",
                            "context_with_scores": [],
                            "chunks_count": 0
                        }
                    }
                    return result
                
                llm = self.llm_provider.get_langchain_llm()
                traditional_rag_prompt = TraditionalRagPrompt.get_traditional_rag_prompt()

                context = "\n\n".join([doc.page_content for doc, _ in docs_with_scores])

                prompt = traditional_rag_prompt.format(context=context)

                answer = await asyncio.to_thread(
                    lambda: llm.invoke([{"role": "system", "content": prompt}, {"role": "user", "content": question}]).content
                )
                
                context_with_scores = []
                for doc, score in docs_with_scores:
                    context_with_scores.append({
                        "content": doc.page_content,
                        "metadata": doc.metadata,
                        "similarity_score": float(score)
                    })
                
                result = {
                    "answer": answer,
                    "debug_info": {
                        "question": question,
                        "answer": answer,
                        "context_documents": [doc.page_content for doc, _ in docs_with_scores],
                        "context_with_scores": context_with_scores,
                        "chunks_count": len(docs_with_scores)
                    }
                }
                
                # print(f"✅ Answer: {answer}")
                return result
                
            except Exception as e:
                error_msg = f"Error processing question: {str(e)}"
                result = {
                    "answer": error_msg,
                    "debug_info": {
                        "question": question,
                        "answer": error_msg,
                        "chunks_count": 0,
                        "error": str(e)
                    }
                }
                print(f"Error: {error_msg}")
                return result
        
        print(f"Processing {len(questions)} questions in parallel...")
        start_time = time.time()
        
        tasks = [process_single_question(i, question) for i, question in enumerate(questions)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        end_time = time.time()
        print(f"Total processing time: {end_time - start_time:.2f} seconds")
        
        answers = []
        debug_info = []
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                error_msg = f"Error processing question {i+1}: {str(result)}"
                answers.append(error_msg)
                debug_info.append({
                    "question": questions[i],
                    "answer": error_msg,
                    "chunks_count": 0,
                    "error": str(result)
                })
            else:
                answers.append(result["answer"])
                debug_info.append(result["debug_info"])
        
        return {
            "answers": answers,
            "debug_info": debug_info
        }
    
    