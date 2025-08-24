from app.services.vector_stores.pinecone_vector_store import PineconeVectorStoreService
from app.services.vector_stores.supabase_vector_store import SupabaseVectorStoreService
from app.services.vector_stores.qdrant_vector_store import QdrantVectorStoreService
from app.services.vector_stores.inmemory_vector_store import InMemoryVectorStoreService
from app.services.vector_stores.base_vector_store import BaseVectorStore
from app.config.settings import Settings

class VectorStoreFactory:
    """Factory class for creating vector store instances"""
    
    _instances = {}
    
    @staticmethod
    def create_vector_store(settings: Settings) -> BaseVectorStore:
        """Create a vector store instance based on configuration"""
        
        vector_store_type = settings.DEFAULT_VECTOR_STORE.lower()
        
        if vector_store_type in VectorStoreFactory._instances:
            return VectorStoreFactory._instances[vector_store_type]
        
        if vector_store_type == "pinecone":
            instance = VectorStoreFactory._create_pinecone_store(settings)
        elif vector_store_type == "supabase":
            instance = VectorStoreFactory._create_supabase_store(settings)
        elif vector_store_type == "qdrant":
            instance = VectorStoreFactory._create_qdrant_store(settings)
        elif vector_store_type == "inmemory":
            instance = VectorStoreFactory._create_inmemory_store(settings)
        else:
            raise ValueError(f"Unsupported vector store type: {vector_store_type}. Supported types: 'pinecone', 'supabase', 'qdrant', 'inmemory'")
        
        VectorStoreFactory._instances[vector_store_type] = instance
        return instance
    
    @staticmethod
    def _create_pinecone_store(settings: Settings) -> PineconeVectorStoreService:
        """Create Pinecone vector store instance"""
        if not settings.PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY is required for Pinecone vector store")
        
        return PineconeVectorStoreService(
            api_key=settings.PINECONE_API_KEY,
            index_name=settings.PINECONE_INDEX_NAME,
            embedding_model=settings.EMBEDDING_MODEL,
            environment=settings.PINECONE_ENVIRONMENT
        )
    
    @staticmethod
    def _create_supabase_store(settings: Settings) -> SupabaseVectorStoreService:
        """Create Supabase vector store instance"""
        if not settings.SUPABASE_URL:
            raise ValueError("SUPABASE_URL is required for Supabase vector store")
        
        supabase_key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_ANON_KEY
        if not supabase_key:
            raise ValueError("Either SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY is required for Supabase vector store")
        
        return SupabaseVectorStoreService(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=supabase_key,
            embedding_model=settings.EMBEDDING_MODEL,
            table_name=settings.SUPABASE_TABLE_NAME,
            query_name=settings.SUPABASE_QUERY_NAME
        )
    
    @staticmethod
    def _create_qdrant_store(settings: Settings) -> QdrantVectorStoreService:
        """Create Qdrant vector store instance"""
        return QdrantVectorStoreService(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            embedding_model=settings.EMBEDDING_MODEL,
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
            path=settings.QDRANT_PATH,
            prefer_grpc=settings.QDRANT_PREFER_GRPC
        )
    
    @staticmethod
    def _create_inmemory_store(settings: Settings) -> InMemoryVectorStoreService:
        """Create InMemory vector store instance"""
        return InMemoryVectorStoreService(
            embedding_model=settings.EMBEDDING_MODEL
        )
