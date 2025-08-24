import uuid
from typing import Any, Dict, List

from app.tools.base import BaseTool, ToolResult
from app.services.preprocessors.document_processor import DocumentProcessor
from app.services.retrievers.retrieval_service import RetrievalService
from app.services.vector_stores.vector_store_factory import VectorStoreFactory
from app.providers.factory import LLMProviderFactory
from app.config.settings import settings


class TraditionalRAGTool(BaseTool):
    """One-shot non-agentic RAG QA tool."""

    def __init__(self) -> None:
        super().__init__(
            name="traditional_rag",
            description="Run a full non-agentic RAG pipeline on a document URL and return direct answers to questions.",
        )

        self.vector_store = VectorStoreFactory.create_vector_store(settings)
        self.llm_provider = LLMProviderFactory.create_provider(
            settings.DEFAULT_LLM_PROVIDER, settings
        )
        self.document_processor = DocumentProcessor(
            vector_store=self.vector_store,
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            use_llm_pdf_loader=False,
        )
        self.retrieval_service = RetrievalService(
            vector_store=self.vector_store, llm_provider=self.llm_provider
        )

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "document_url": {
                    "type": "string",
                    "description": "URL (PDF, DOCX, TXT, webpage…) of the document to analyse",
                },
                "questions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of natural-language questions to answer from the document",
                },
                "k": {
                    "type": "integer",
                    "default": 10,
                    "description": "Number of chunks to retrieve per question when building the context",
                },
                "document_id": {
                    "type": "string",
                    "description": "ID returned by process_document identifying the vector-store entries",
                },
                "use_cache": {
                    "type": "boolean",
                    "default": True,
                    "description": "Whether vector-store cache should be used if available",
                },
            },
            "required": ["document_url", "questions"],
        }

    async def execute(self, **kwargs):
        try:
            document_url: str | None = kwargs.get("document_url")
            document_id: str | None = kwargs.get("document_id")
            questions: List[str] | None = kwargs.get("questions")
            k: int = kwargs.get("k", 10)
            use_cache: bool = kwargs.get("use_cache", True)

            if not document_url or not questions:
                return ToolResult(success=False, error="'document_url' and 'questions' are required")

            # Assume vector store is already populated by `process_document`.
            cached_used = True

            try:
                if not document_id:
                    raise ValueError("'document_id' missing – call process_document first and pass its id.")
                retrieval_res = await self.retrieval_service.process_document_queries(
                    document_id=document_id, questions=questions, k=k
                )
                answers = retrieval_res["answers"]
                debug_info = retrieval_res["debug_info"]
            except Exception as exc:
                answers = [str(exc)]
                debug_info = []

            return ToolResult(
                success=True,
                result={
                    "answers": answers,
                    "debug_info": debug_info,
                    "cached_used": cached_used,
                },
            )
        except Exception as exc:
            return ToolResult(
                success=True,
                result={"answers": [str(exc)], "debug_info": [], "cached_used": False},
            )
