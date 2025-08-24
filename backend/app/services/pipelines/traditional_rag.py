import time
from typing import List, Tuple, Dict, Any


async def traditional_rag(
    *,
    document_id: str,
    document_url: str,
    questions: List[str],
    k: int,
    vector_store,
    document_processor,
    retrieval_service,
    settings,
) -> Tuple[List[str], Dict[str, Any], Dict[str, Any]]:
    """Run the traditional RAG flow used by the `/run` endpoint.

    Parameters
    ----------
    document_id : str
        Unique identifier for this document processing run.
    document_url : str
        URL of the document to process.
    questions : List[str]
        List of user questions to answer.
    k : int
        Top-k chunks to retrieve per question.
    vector_store : BaseVectorStore
        Concrete vector store instance (already initialised).
    document_processor : DocumentProcessor
        Responsible for loading & chunking the document and adding chunks to the vector store.
    retrieval_service : RetrievalService
        Service that runs similarity search + LLM QA over stored vectors.
    settings : Settings
        Global settings object (``app.config.settings.settings``).

    Returns
    -------
    Tuple containing `(answers, document_metadata, raw_response)` where:
        answers : List[str]
            Final answers for each question.
        document_metadata : Dict[str, Any]
            Metadata about the processed document run – used for logging.
        raw_response : Dict[str, Any]
            Additional debug information for non-production environments.
    """

    start_time = time.time()
    answers: List[str] = []
    document_metadata: Dict[str, Any] = {}
    raw_response: Dict[str, Any] = {}
    document_processor.file_processor.use_llm_pdf_loader = False


    # ----------------------------------------------------------------------------------
    # 1. Ensure a clean vector store
    # ----------------------------------------------------------------------------------
    if hasattr(vector_store, "adelete_all_documents"):
        await vector_store.adelete_all_documents()
    else:
        vector_store.delete_all_documents()

    # ----------------------------------------------------------------------------------
    # 2. Try loading a cached store for the exact document URL
    # ----------------------------------------------------------------------------------
    cache_used = False
    if (
        settings.ENABLE_CACHING
        and vector_store.supports_caching()
        and vector_store.has_cache(document_url)
    ):
        if vector_store.load_from_cache(document_url):
            cache_used = True
            try:
                cached_chunks = (
                    await vector_store.aget_document_count()
                    if hasattr(vector_store, "aget_document_count")
                    else vector_store.get_document_count()
                )
            except Exception:
                cached_chunks = -1

            document_metadata = {
                "document_id": document_id,
                "chunks_processed": cached_chunks,
                "vector_store": vector_store.store_type,
                "cache_used": True,
                "processing_mode": "traditional",
            }

            query_results = await retrieval_service.process_document_queries(
                document_id=document_id,
                questions=questions,
                k=k,
            )

            answers = query_results["answers"]
            debug_info = query_results["debug_info"]

            raw_response = {
                "chunks_per_question": k,
                "total_questions": len(questions),
                "retrieval_method": "LangChain RetrievalQA",
                "cache_used": True,
                "processing_mode": "traditional",
                "debug_info": debug_info,
            }

    # ----------------------------------------------------------------------------------
    # 3. If no cache, process the document from scratch
    # ----------------------------------------------------------------------------------
    if not cache_used:
        processing_result = await document_processor.process_document_url(
            document_url=document_url,
            document_id=document_id,
        )

        if not processing_result["success"]:
            raise RuntimeError(processing_result["error"])

        query_results = await retrieval_service.process_document_queries(
            document_id=document_id,
            questions=questions,
            k=k,
        )

        answers = query_results["answers"]
        debug_info = query_results["debug_info"]

        raw_response = {
            "chunks_per_question": k,
            "total_questions": len(questions),
            "retrieval_method": "LangChain RetrievalQA",
            "cache_used": False,
            "processing_mode": "traditional",
            "debug_info": debug_info,
        }

        document_metadata = {
            "document_id": document_id,
            "chunks_processed": processing_result["chunks_processed"],
            "vector_store": processing_result["vector_store"],
            "cache_used": False,
            "processing_mode": "traditional",
        }

        chunks_count = processing_result["chunks_processed"]
        if (
            settings.ENABLE_CACHING
            and vector_store.supports_caching()
            and chunks_count > settings.CACHE_MIN_CHUNKS
        ):
            vector_store.save_to_cache(document_url)

    # ----------------------------------------------------------------------------------
    # 4. Done – return consolidated result
    # ----------------------------------------------------------------------------------
    duration = time.time() - start_time
    return answers, document_metadata, raw_response