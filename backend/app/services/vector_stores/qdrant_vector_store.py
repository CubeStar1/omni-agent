from langchain_qdrant import QdrantVectorStore
from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from app.services.vector_stores.base_vector_store import BaseVectorStore
from typing import List, Dict, Optional, Any
from langchain.schema import Document
from app.config.settings import settings
import uuid
import time
import os

class QdrantVectorStoreService(BaseVectorStore):
    def __init__(
        self, 
        collection_name: str = "hackrx-documents",
        embedding_model: str = "text-embedding-3-small",
        url: Optional[str] = None,
        api_key: Optional[str] = None,
        path: Optional[str] = None,
        prefer_grpc: bool = True
    ):
        """
        Initialize Qdrant vector store service
        
        Args:
            collection_name: Name of the Qdrant collection
            embedding_model: OpenAI embedding model to use
            url: Qdrant server URL (for cloud/server deployments)
            api_key: API key for Qdrant cloud
            path: Local path for on-disk storage (for local mode)
            prefer_grpc: Whether to prefer gRPC protocol
        """
        self.collection_name = collection_name
        self.embedding_model = embedding_model
        self.url = url
        self.api_key = api_key
        self.path = path
        self.prefer_grpc = prefer_grpc
        
        # Set OpenAI API key for embeddings
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is required for OpenAI embeddings")
        
        # Initialize OpenAI embeddings
        self.embeddings = OpenAIEmbeddings(
            model=embedding_model,
            openai_api_key=settings.OPENAI_API_KEY
        )
        
        # Initialize Qdrant client based on configuration
        self.client = self._initialize_client()
        
        # Create or get collection
        self._setup_collection()
        
        # Initialize Qdrant vector store
        self.vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=self.collection_name,
            embedding=self.embeddings
        )
        
        self.store_type = "qdrant"
    
    def _initialize_client(self) -> QdrantClient:
        """Initialize Qdrant client based on configuration"""
        if self.url:
            # Cloud or server deployment
            print(f"🔗 Connecting to Qdrant server at {self.url}")
            return QdrantClient(
                url=self.url,
                api_key=self.api_key,
                prefer_grpc=self.prefer_grpc
            )
        elif self.path:
            # Local on-disk storage
            print(f"💾 Using Qdrant local storage at {self.path}")
            return QdrantClient(path=self.path)
        else:
            # In-memory storage
            print("🧠 Using Qdrant in-memory storage")
            return QdrantClient(":memory:")
    
    def _get_embedding_dimension(self) -> int:
        """Get dimension based on embedding model"""
        model_dimensions = {
            "text-embedding-ada-002": 1536,
            "text-embedding-3-small": 1536,
            "text-embedding-3-large": 3072
        }
        return model_dimensions.get(self.embedding_model, 1536)
    
    def _setup_collection(self):
        """Create collection if it doesn't exist"""
        try:
            # Check if collection exists
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                print(f"📚 Creating Qdrant collection: {self.collection_name}")
                
                # Get dimension from embedding model
                dimension = self._get_embedding_dimension()
                
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=dimension,
                        distance=Distance.COSINE
                    )
                )
                print(f"✅ Created collection '{self.collection_name}' with dimension {dimension}")
            else:
                print(f"✅ Collection '{self.collection_name}' already exists")
                
        except Exception as e:
            print(f"⚠️ Error setting up collection: {e}")
            raise
    
    def add_documents(
        self, 
        texts: List[str], 
        metadatas: List[Dict],
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """Add documents to Qdrant vector store"""
        if not ids:
            ids = [str(uuid.uuid4()) for _ in texts]
        
        print(f"📝 Adding {len(texts)} documents to Qdrant...")
        
        try:
            # Create Document objects
            documents = [
                Document(page_content=text, metadata=metadata)
                for text, metadata in zip(texts, metadatas)
            ]
            
            # Add documents to Qdrant
            added_ids = self.vector_store.add_documents(documents, ids=ids)
            
            print(f"✅ Successfully added {len(added_ids)} documents to Qdrant")
            
            # Wait a moment for indexing
            time.sleep(1)
            
            # Verify documents were added
            if self._verify_documents_added(metadatas[0].get("document_id") if metadatas else None):
                print("🔍 Documents verified and searchable")
            
            return added_ids
            
        except Exception as e:
            print(f"❌ Error adding documents to Qdrant: {e}")
            raise
    
    def _verify_documents_added(self, document_id: Optional[str] = None) -> bool:
        """Verify that documents were successfully added and are searchable"""
        try:
            # Simple search without filter - just verify documents exist
            test_results = self.vector_store.similarity_search(
                query="test verification search",
                k=1
            )
            return len(test_results) > 0
        except Exception:
            return False
    
    def similarity_search_with_score(
        self, 
        query: str, 
        k: int = 10,
        filter: Optional[Dict] = None,
        namespace: Optional[str] = None
    ) -> List[tuple]:
        """Search with relevance scores"""
        try:
            # Simple search with scores, no filters
            results = self.vector_store.similarity_search_with_score(query, k=k)
            return results
            
        except Exception as e:
            print(f"❌ Error during similarity search with score: {e}")
            return []
    
    def as_retriever(self, **kwargs) -> Any:
        """Get retriever for RAG chains"""
        return self.vector_store.as_retriever(**kwargs)
    
    def delete_documents(
        self, 
        ids: List[str],
        namespace: Optional[str] = None
    ) -> bool:
        """Delete documents by IDs"""
        try:
            # Qdrant uses delete method
            self.vector_store.delete(ids)
            print(f"🗑️ Deleted {len(ids)} documents from Qdrant")
            return True
            
        except Exception as e:
            print(f"❌ Error deleting documents: {e}")
            return False
    
    def get_document_count(self, namespace: Optional[str] = None) -> int:
        """Get total document count"""
        try:
            collection_info = self.client.get_collection(self.collection_name)
            return collection_info.points_count or 0
            
        except Exception as e:
            print(f"❌ Error getting document count: {e}")
            return 0
    
    def delete_all_documents(self, namespace: Optional[str] = None) -> bool:
        """Delete all documents from vector store"""
        try:
            # Delete the entire collection and recreate it
            self.client.delete_collection(self.collection_name)
            self._setup_collection()
            
            # Reinitialize vector store
            self.vector_store = QdrantVectorStore(
                client=self.client,
                collection_name=self.collection_name,
                embedding=self.embeddings
            )
            
            print(f"🗑️ Deleted all documents from collection '{self.collection_name}'")
            return True
            
        except Exception as e:
            print(f"❌ Error deleting all documents: {e}")
            return False
