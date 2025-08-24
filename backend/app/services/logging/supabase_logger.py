from supabase import create_client, Client
from app.config.settings import settings
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class SupabaseLogger:
    def __init__(self):
        self.client: Optional[Client] = None
        self.enabled = settings.ENABLE_REQUEST_LOGGING
        
        if self.enabled and settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            try:
                if not settings.SUPABASE_URL.startswith('https://'):
                    raise ValueError(f"Invalid Supabase URL format: {settings.SUPABASE_URL}")
                
                self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
                logger.info(f"Supabase logger initialized successfully for {settings.SUPABASE_URL}")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {str(e)}")
                logger.error(f"   URL: {settings.SUPABASE_URL[:50]}...")
                self.enabled = False
        else:
            missing_config = []
            if not settings.SUPABASE_URL:
                missing_config.append("SUPABASE_URL")
            if not settings.SUPABASE_ANON_KEY:
                missing_config.append("SUPABASE_ANON_KEY")
            if not settings.ENABLE_REQUEST_LOGGING:
                missing_config.append("ENABLE_REQUEST_LOGGING is False")
            
            logger.warning(f"Supabase logging disabled - missing: {', '.join(missing_config)}")
            self.enabled = False
    
    def test_connection(self) -> Dict[str, Any]:
        """Test the Supabase connection and return diagnostic info"""
        result = {
            "enabled": self.enabled,
            "has_client": self.client is not None,
            "supabase_url": settings.SUPABASE_URL if settings.SUPABASE_URL else "NOT_SET",
            "has_anon_key": bool(settings.SUPABASE_ANON_KEY),
            "connection_test": "not_attempted"
        }
        
        if not self.enabled:
            result["connection_test"] = "disabled"
            return result
        
        if not self.client:
            result["connection_test"] = "no_client"
            return result
        
        try:
            test_result = self.client.table("hackrx_requests").select("id").limit(1).execute()
            result["connection_test"] = "success"
            result["table_accessible"] = True
        except Exception as e:
            result["connection_test"] = f"failed: {str(e)}"
            result["table_accessible"] = False
            
            if "getaddrinfo failed" in str(e) or "11001" in str(e):
                result["diagnosis"] = "DNS/Network issue - check internet connection and Supabase URL"
            elif "401" in str(e) or "unauthorized" in str(e).lower():
                result["diagnosis"] = "Authentication issue - check SUPABASE_ANON_KEY"
            elif "404" in str(e) or "not found" in str(e).lower():
                result["diagnosis"] = "Table not found - run database_setup.sql in Supabase"
            else:
                result["diagnosis"] = "Unknown error - check logs"
        
        return result
    
    async def log_hackrx_request(
        self,
        document_url: str,
        questions: List[str],
        answers: List[str],
        processing_time: float,
        document_metadata: Dict[str, Any],
        raw_response: Dict[str, Any],
        success: bool = True,
        error_message: Optional[str] = None
    ) -> Optional[str]:
        """Log a HackRX API request to Supabase"""
        
        if not self.enabled or not self.client:
            logger.debug("Supabase logging disabled - skipping log entry")
            return None
        
        try:
            request_id = str(uuid.uuid4())
            
            log_entry = {
                "id": request_id,
                "timestamp": datetime.utcnow().isoformat(),
                "document_url": document_url,
                "questions": questions,  # JSON array
                "answers": answers,  # JSONB array
                "processing_time": processing_time,
                "document_metadata": document_metadata,  # JSONB
                "raw_response": raw_response,  # JSONB
                "success": success,
                "error_message": error_message,
                "questions_count": len(questions),
                "chunks_processed": document_metadata.get("chunks_processed", 0),
                "vector_store": document_metadata.get("vector_store", "unknown")
            }
            
            result = self.client.table("hackrx_requests").insert(log_entry).execute()
            
            if result.data:
                logger.info(f"Logged HackRX request: {request_id}")
                return request_id
            else:
                logger.error(f"Failed to log request: {result}")
                return None
                
        except Exception as e:
            error_type = type(e).__name__
            if "getaddrinfo failed" in str(e) or "11001" in str(e):
                logger.error(f"DNS/Network error logging HackRX request: {str(e)}")
                logger.error(f"   Check your internet connection and Supabase URL: {settings.SUPABASE_URL}")
            else:
                logger.error(f"Error logging HackRX request ({error_type}): {str(e)}")
            return None
    

supabase_logger = SupabaseLogger()
