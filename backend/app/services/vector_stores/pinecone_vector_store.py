from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone, ServerlessSpec
from app.services.vector_stores.base_vector_store import BaseVectorStore
from typing import List, Dict, Optional, Any
from langchain.schema import Document
from app.config.settings import settings
import uuid
import time
import os

class PineconeVectorStoreService(BaseVectorStore):
    def __init__(
        self, 
        api_key: str, 
        index_name: str,
        embedding_model: str = "text-embedding-3-small",
        environment: str = "us-east-1"
    ):
        # Set Pinecone API key in environment for compatibility
        os.environ["PINECONE_API_KEY"] = api_key
        
        self.pc = Pinecone(api_key=api_key)
        self.index_name = index_name
        self.embedding_model = embedding_model
        

        
        # Use OpenAI embeddings for OpenAI models, otherwise use Pinecone embeddings
        if embedding_model.startswith("text-embedding"):
            openai_api_key = os.getenv("OPENAI_API_KEY")

            # Use OpenAI embeddings for OpenAI models
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required for OpenAI embedding models")
            
            self.embeddings = OpenAIEmbeddings(
                model=embedding_model,
                openai_api_key=openai_api_key
            )
        else:
            # Use Pinecone embeddings for other models
            from langchain_pinecone import PineconeEmbeddings
            self.embeddings = PineconeEmbeddings(
                model=embedding_model
            )
        
        # Create or get index with proper error handling
        self.index = self._get_or_create_index()
        
        self.vector_store = PineconeVectorStore(
            index=self.index,
            embedding=self.embeddings
        )
        self.store_type = "pinecone"
    
    def _get_or_create_index(self):
        """Get existing index or create new one"""
        try:
            # Check if index exists
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                print(f"Creating Pinecone index: {self.index_name}")
                
                # Get dimension from embedding model
                dimension = self._get_embedding_dimension()
                
                self.pc.create_index(
                    name=self.index_name,
                    dimension=dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
                
                # Wait for index to be ready
                print("Waiting for index to be ready...")
                time.sleep(10)
            
            return self.pc.Index(self.index_name)
            
        except Exception as e:
            print(f"Error setting up Pinecone index: {e}")
            # Try to get existing index anyway
            return self.pc.Index(self.index_name)
    
    def _get_embedding_dimension(self):
        """Get dimension based on embedding model"""
        model_dimensions = {
            "multilingual-e5-large": 1024,
            "text-embedding-ada-002": 1536,
            "text-embedding-3-small": 1536,
            "text-embedding-3-large": 3072
        }
        return model_dimensions.get(self.embedding_model, 1536)  # Default to 1536 for text-embedding-3-small

    def add_documents(
        self, 
        texts: List[str], 
        metadatas: List[Dict],
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """Add documents to Pinecone vector store and wait for indexing to complete"""
        if not ids:
            ids = [str(uuid.uuid4()) for _ in texts]
        
        # Pinecone requires string values for metadata
        enhanced_metadatas = []
        for metadata in metadatas:
            enhanced_metadata = metadata.copy()
            # Convert all values to strings for Pinecone compatibility
            enhanced_metadata = {k: str(v) for k, v in enhanced_metadata.items()}
            enhanced_metadatas.append(enhanced_metadata)
        
        print(f"📝 Adding {len(texts)} documents to Pinecone...")
        
        # Add documents synchronously (blocking)
        self.vector_store.add_texts(
            texts=texts,
            metadatas=enhanced_metadatas,
            ids=ids,
        )

        print(f"⏳ Waiting for Pinecone indexing to complete...")
        
        # More robust indexing verification with exponential backoff
        max_attempts = 15
        base_delay = 1
        document_id = enhanced_metadatas[0]["document_id"]
        
        for attempt in range(max_attempts):
            try:
                # Use a more reliable verification strategy
                # 1. Try to search with document_id filter
                test_filter = {"document_id": document_id}
                test_results = self.vector_store.similarity_search(
                    query="document content test search",
                    k=3,
                    filter=test_filter
                )
                
                # 2. Also try searching for actual content from the first text
                if not test_results and texts:
                    # Use a snippet from the actual content for more reliable search
                    search_snippet = texts[0][:50] if len(texts[0]) > 50 else texts[0]
                    test_results = self.vector_store.similarity_search(
                        query=search_snippet,
                        k=2,
                        filter=test_filter
                    )
                
                if test_results and len(test_results) > 0:
                    print(f"✅ Documents indexed and searchable after {attempt + 1} attempts")
                    print(f"🔍 Found {len(test_results)} searchable documents")
                    return ids
                else:
                    # Exponential backoff with jitter
                    delay = min(base_delay * (2 ** min(attempt, 4)), 8)  # Cap at 8 seconds
                    print(f"⏳ Waiting for indexing... (attempt {attempt + 1}/{max_attempts}, next check in {delay}s)")
                    time.sleep(delay)
                    
            except Exception as e:
                delay = min(base_delay * (2 ** min(attempt, 3)), 6)
                print(f"⚠️ Error verifying indexing (attempt {attempt + 1}): {e}")
                print(f"⏳ Retrying in {delay} seconds...")
                time.sleep(delay)
        
        # Final verification attempt
        try:
            final_test = self.vector_store.similarity_search(
                query="final verification test",
                k=1,
                filter={"document_id": document_id}
            )
            if final_test:
                print("✅ Final verification successful!")
                return ids
        except:
            pass
            
        print("⚠️ Warning: Could not fully verify document indexing, but proceeding...")
        print(f"📊 Added {len(ids)} document IDs to index")
        return ids
    
    def similarity_search(
        self, 
        query: str, 
        k: int = 10,
        filter: Optional[Dict] = None,
        namespace: Optional[str] = None
    ) -> List[Document]:
        """Perform similarity search in Pinecone"""
        search_kwargs = {"k": k}
        if filter:
            # Convert filter values to strings for Pinecone
            search_kwargs["filter"] = {k: str(v) for k, v in filter.items()}
        if namespace:
            search_kwargs["namespace"] = namespace
        
        # Direct synchronous call
        return self.vector_store.similarity_search(query, **search_kwargs)
    
    def similarity_search_with_score(
        self, 
        query: str, 
        k: int = 10,
        filter: Optional[Dict] = None,
        namespace: Optional[str] = None
    ) -> List[tuple]:
        """Search with relevance scores in Pinecone"""
        search_kwargs = {"k": k}
        if filter:
            search_kwargs["filter"] = {k: str(v) for k, v in filter.items()}
        if namespace:
            search_kwargs["namespace"] = namespace
        
        # Direct synchronous call
        return self.vector_store.similarity_search_with_score(query, **search_kwargs)
    
    def as_retriever(self, **kwargs) -> Any:
        """Get Pinecone retriever for RAG chains"""
        return self.vector_store.as_retriever(**kwargs)
    
    def delete_documents(
        self, 
        ids: List[str],
        namespace: Optional[str] = None
    ) -> bool:
        """Delete documents from Pinecone"""
        try:
            if namespace:
                self.index.delete(ids=ids, namespace=namespace)
            else:
                self.index.delete(ids=ids)
            return True
        except Exception:
            return False
    
    def get_document_count(self, namespace: Optional[str] = None) -> int:
        """Get document count from Pinecone"""
        try:
            stats = self.index.describe_index_stats()
            if namespace and namespace in stats.namespaces:
                return stats.namespaces[namespace].vector_count
            return stats.total_vector_count
        except Exception:
            return 0
    
    def delete_all_documents(self, namespace: Optional[str] = None) -> bool:
        """Delete all documents from Pinecone index and wait for deletion to propagate"""
        try:
            print(f"🗑️ Deleting all documents from Pinecone index: {self.index_name}")
            
            if namespace:
                self.index.delete(delete_all=True, namespace=namespace)
            else:
                self.index.delete(delete_all=True)
            
            # Wait for deletion to propagate to avoid conflicts with subsequent requests
            print("⏳ Waiting for deletion to propagate...")
            time.sleep(3)
            
            # Verify deletion by checking document count
            max_attempts = 8
            for attempt in range(max_attempts):
                try:
                    stats = self.index.describe_index_stats()
                    total_count = stats.total_vector_count
                    
                    if namespace and namespace in stats.namespaces:
                        namespace_count = stats.namespaces[namespace].vector_count
                        if namespace_count == 0:
                            print(f"✅ All documents deleted from namespace '{namespace}'")
                            return True
                    elif total_count == 0:
                        print(f"✅ All documents deleted from Pinecone index")
                        return True
                    else:
                        print(f"⏳ Waiting for deletion to complete... ({total_count} docs remaining, attempt {attempt + 1})")
                        time.sleep(1)
                        
                except Exception as e:
                    print(f"⚠️ Error checking deletion status (attempt {attempt + 1}): {e}")
                    time.sleep(1)
            
            print(f"✅ Deletion command sent successfully (may still be propagating)")
            return True
            
        except Exception as e:
            print(f"❌ Error deleting documents: {e}")
            return False
