import uuid
from typing import Any, Dict

from app.tools.base import BaseTool, ToolResult
from app.services.preprocessors.document_processor import DocumentProcessor
from app.services.vector_stores.vector_store_factory import VectorStoreFactory
from app.config.settings import settings


class ProcessDocumentTool(BaseTool):
    """One-time document processing / vectorisation tool.

    Given a document URL, download, chunk and embed the content into the shared
    `vector_store`. It returns a `document_id` that can be used later for
    retrieval. If caching is enabled and the document is large enough, the
    vector store is persisted so later calls can load it quickly.
    """

    def __init__(self):
        super().__init__(
            name="process_document",
            description="Download & vectorise a document once and return a document_id for later retrieval"
        )
        self.vector_store = VectorStoreFactory.create_vector_store(settings)
        self.document_processor = DocumentProcessor(
            vector_store=self.vector_store,
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        )

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "document_url": {
                    "type": "string",
                    "description": "URL of the document (PDF, DOCX, TXT, etc.) to process"
                },
                "llm_friendly": {
                    "type": "boolean",
                    "default": False,
                    "description": "Use the richer but slower PyMuPDF4LLMLoader extraction pipeline"
                },
                "use_cache": {
                    "type": "boolean",
                    "default": True,
                    "description": "Whether to load/save a cached vector store if available"
                },
            },
            "required": ["document_url"],
        }

    async def execute(self, **kwargs):  # type: ignore[override]
        try:
            document_url: str = kwargs.get("document_url")
            llm_friendly: bool = kwargs.get("llm_friendly", False)
            use_cache: bool = kwargs.get("use_cache", True)

            if not document_url:
                return ToolResult(success=False, error="'document_url' is required")

            document_id = str(uuid.uuid4())

            # Ensure processor uses the requested loader type
            self.document_processor.file_processor.use_llm_pdf_loader = llm_friendly

            # Compose a cache key that differentiates between loader variants
            cache_key = f"{document_url}::{'llm' if llm_friendly else 'std'}"

            # If requested, attempt to load existing cache for this URL (variant-sensitive)
            cached_loaded = False
            if (
                use_cache
                and settings.ENABLE_CACHING
                and self.vector_store.supports_caching()
                and self.vector_store.has_cache(cache_key)
            ):
                if self.vector_store.load_from_cache(cache_key):
                    cached_loaded = True
                    try:
                        chunks_processed = (
                            await self.vector_store.aget_document_count()
                            if hasattr(self.vector_store, "aget_document_count")
                            else self.vector_store.get_document_count()
                        )
                    except Exception:
                        chunks_processed = -1
                else:
                    cached_loaded = False

            if not cached_loaded:
                processing_result = await self.document_processor.process_document_url(
                    document_url=document_url,
                    document_id=document_id
                )

                if not processing_result["success"]:
                    return ToolResult(success=False, error=processing_result["error"])

                chunks_processed = processing_result["chunks_processed"]

                if (
                    settings.ENABLE_CACHING
                    and self.vector_store.supports_caching()
                    and chunks_processed >= settings.CACHE_MIN_CHUNKS
                ):
                    self.vector_store.save_to_cache(cache_key)

            return ToolResult(
                success=True,
                result={
                    "document_id": document_id,
                    "chunks_processed": chunks_processed,
                    "cached_used": cached_loaded,
                },
            )
        except Exception as exc:
            return ToolResult(success=False, error=str(exc))
