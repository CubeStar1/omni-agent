from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv
import os
load_dotenv("../../.env")

class Settings(BaseSettings):
    # API Configuration (Required)
    API_V1_PREFIX: str = ""
    PROJECT_NAME: str = "HackRX Intelligence System"
    
    # Environment Configuration (Required)
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")  # production, development
    
    # Authentication (Required)
    BEARER_TOKEN: str
    
    # Vector Store Configuration (Required)
    DEFAULT_VECTOR_STORE: str = os.getenv("DEFAULT_VECTOR_STORE", "inmemory")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    
    # Pinecone Configuration (Optional)
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str = "hackrx-documents"
    PINECONE_ENVIRONMENT: str = "us-east-1"
    
    # Qdrant Configuration (Optional)
    QDRANT_URL: Optional[str] = os.getenv("QDRANT_URL")
    QDRANT_API_KEY: Optional[str] = os.getenv("QDRANT_API_KEY")
    QDRANT_COLLECTION_NAME: str = os.getenv("QDRANT_COLLECTION_NAME", "hackrx-documents")
    QDRANT_PATH: Optional[str] = os.getenv("QDRANT_PATH")  # For local on-disk storage
    QDRANT_PREFER_GRPC: bool = os.getenv("QDRANT_PREFER_GRPC", "true").lower() == "true"
    
    # LLM Providers
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "openai")
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Gemini Configuration
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # Groq Configuration
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
    
    # Cerebras Configuration
    CEREBRAS_API_KEY: Optional[str] = os.getenv("CEREBRAS_API_KEY")
    CEREBRAS_MODEL: str = os.getenv("CEREBRAS_MODEL", "openai/gpt-oss-20b")
    
    # OpenRouter Configuration
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4.1-mini")
    
    # LM Studio Configuration
    LMSTUDIO_API_KEY: str = os.getenv("LMSTUDIO_API_KEY", "lm-studio")
    LMSTUDIO_MODEL: str = os.getenv("LMSTUDIO_MODEL", "qwen/qwen3-4b")
    LMSTUDIO_BASE_URL: str = os.getenv("LMSTUDIO_BASE_URL", "http://localhost:1234/v1")

    # Supabase Configuration (Required)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY")
    SUPABASE_TABLE_NAME: str = os.getenv("SUPABASE_TABLE_NAME", "documents")
    SUPABASE_QUERY_NAME: str = os.getenv("SUPABASE_QUERY_NAME", "match_documents")
    ENABLE_REQUEST_LOGGING: bool = os.getenv("ENABLE_REQUEST_LOGGING", "true").lower() == "true"

    # Processing Configuration (Required)
    CHUNK_SIZE: int = os.getenv("CHUNK_SIZE", 1000)
    CHUNK_OVERLAP: int = os.getenv("CHUNK_OVERLAP", 200)
    
    # Caching Configuration (Required)
    ENABLE_CACHING: bool = os.getenv("ENABLE_CACHING", "true").lower() == "true"  # Enable/disable caching
    CACHE_MIN_CHUNKS: int = int(os.getenv("CACHE_MIN_CHUNKS", "0"))  # Only cache docs with >0 chunks
    
    # Agent Configuration (Required)
    AGENT_ENABLED: bool = os.getenv("AGENT_ENABLED", "true").lower() == "true"  # Enable/disable agent


    class Config:
        env_file = ".env"

settings = Settings()
