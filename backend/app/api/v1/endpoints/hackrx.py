from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.models.request import HackRXRequest
from app.models.response import HackRXResponse, HackRXProductionResponse, HealthResponse
from app.core.auth import verify_token
from app.services.preprocessors.document_processor import DocumentProcessor
from app.services.retrievers.retrieval_service import RetrievalService
from app.services.vector_stores.vector_store_factory import VectorStoreFactory
from app.services.logging.supabase_logger import supabase_logger
from app.services.agents.master_hackrx_agent import MasterHackRXAgent
from app.providers.factory import LLMProviderFactory
from app.config.settings import settings
from app.services.pipelines.traditional_rag import traditional_rag
import time
import uuid
from typing import Union, Optional

router = APIRouter()

vector_store = VectorStoreFactory.create_vector_store(settings)

llm_provider = LLMProviderFactory.create_provider(
    settings.DEFAULT_LLM_PROVIDER, 
    settings
)

hackrx_agent = MasterHackRXAgent()

document_processor = DocumentProcessor(
    vector_store=vector_store,
    chunk_size=settings.CHUNK_SIZE,
    chunk_overlap=settings.CHUNK_OVERLAP
)

retrieval_service = RetrievalService(
    vector_store=vector_store,
    llm_provider=llm_provider
)

async def log_request_background(
    document_url: str,
    questions: list,
    answers: list,
    processing_time: float,
    document_metadata: dict,
    raw_response: dict,
    success: bool,
    error_message: Optional[str] = None
):
    """Background task for logging requests to Supabase"""
    try:
        await supabase_logger.log_hackrx_request(
            document_url=document_url,
            questions=questions,
            answers=answers,
            processing_time=processing_time,
            document_metadata=document_metadata,
            raw_response=raw_response,
            success=success,
            error_message=error_message
        )
    except Exception as e:
        print(f"Background logging failed: {e}")

@router.post("/run", response_model=Union[HackRXResponse, HackRXProductionResponse])
async def run_hackrx(
    request: HackRXRequest,
    background_tasks: BackgroundTasks,
    _: bool = Depends(verify_token)
):
    """Main HackRX endpoint - process document and answer questions
    
    Supports both traditional RAG processing and agentic processing with tools.
    
    - Traditional mode: Document is processed once, stored in vector store, questions answered via RAG
    - Agentic mode: AI agent uses tools (RAG, URL requests, etc.) to handle complex multi-step instructions
    
    Note: Each request starts with a clean vector store to prevent document mixing.
    If caching is enabled and a cache exists for the requested document URL,
    the cached vector store is loaded. Otherwise, the document is processed fresh.
    """
    start_time = time.time()
    
    document_id = str(uuid.uuid4())
    answers = []
    document_metadata = {}
    raw_response = {}
    success = True
    error_message = None
    
    try:
        if settings.AGENT_ENABLED:
            print("Using agentic processing with tools.")
            
            agent_result = await hackrx_agent.process_request(
                document_url=request.documents,
                questions=request.questions,
                k=request.k
            )
            
            answers = agent_result["answers"]
            execution_log = agent_result.get("execution_log", [])
            
            document_metadata = {
                "document_id": document_id,
                "processing_mode": "agentic",
                "agent_used": True,
                "execution_log_length": len(execution_log)
            }
            
            raw_response = {
                "processing_mode": "agentic",
                "agent_execution_log": execution_log,
                "total_questions": len(request.questions),
                "k_value": request.k
            }
            
        else:
            print("Using traditional RAG processing")
            
            answers, document_metadata, raw_response = await traditional_rag(
                document_id=document_id,
                document_url=request.documents,
                questions=request.questions,
                k=request.k,
                vector_store=vector_store,
                document_processor=document_processor,
                retrieval_service=retrieval_service,
                settings=settings
            )

        processing_time = time.time() - start_time

        background_tasks.add_task(
            log_request_background,
            document_url=request.documents,
            questions=request.questions,
            answers=answers,
            processing_time=processing_time,
            document_metadata=document_metadata,
            raw_response=raw_response,
            success=success
        )

        if settings.ENVIRONMENT.lower() == "production":
            return HackRXProductionResponse(
                success=True,
                answers=answers
            )
        else:
            return HackRXResponse(
                success=True,
                answers=answers,
                processing_time=processing_time,
                document_metadata=document_metadata,
                raw_response=raw_response,
                deleted_documents=True
            )
        
    except HTTPException:
        processing_time = time.time() - start_time
        
        background_tasks.add_task(
            log_request_background,
            document_url=request.documents,
            questions=request.questions,
            answers=answers,
            processing_time=processing_time,
            document_metadata=document_metadata,
            raw_response=raw_response,
            success=False,
            error_message=error_message
        )
        
        raise
        
    except Exception as e:
        processing_time = time.time() - start_time
        error_message = str(e)
        
        background_tasks.add_task(
            log_request_background,
            document_url=request.documents,
            questions=request.questions,
            answers=answers,
            processing_time=processing_time,
            document_metadata=document_metadata,
            raw_response=raw_response,
            success=False,
            error_message=error_message
        )
        
        raise HTTPException(status_code=500, detail=error_message)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    
    try:
        if hasattr(vector_store, 'aget_document_count'):
            doc_count = await vector_store.aget_document_count()
        else:
            doc_count = vector_store.get_document_count()
        
        return HealthResponse(
            status="healthy",
            vector_store=vector_store.store_type,
            llm_provider=llm_provider.provider_name,
            document_count=doc_count
        )
        
    except Exception as e:
        return HealthResponse(
            status=f"unhealthy: {str(e)}",
            vector_store=vector_store.store_type,
            llm_provider=llm_provider.provider_name
        )
