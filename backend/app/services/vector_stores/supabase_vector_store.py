from langchain_community.vectorstores import SupabaseVectorStore
from langchain_openai import OpenAIEmbeddings
from supabase import create_client, Client
from app.services.vector_stores.base_vector_store import BaseVectorStore
from typing import List, Dict, Optional, Any
from langchain.schema import Document
from app.config.settings import settings
import uuid
import time
import os
import asyncio

class SupabaseVectorStoreService(BaseVectorStore):
    def __init__(
        self, 
        supabase_url: str,
        supabase_key: str,
        embedding_model: str = "text-embedding-3-large",
        table_name: str = "documents",
        query_name: str = "match_documents"
    ):
    
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is required for OpenAI embeddings")
        
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.embedding_model = embedding_model
        self.table_name = table_name
        self.query_name = query_name
        
        self.supabase_client: Client = create_client(supabase_url, supabase_key)
        

        self.embeddings = OpenAIEmbeddings(
            model=embedding_model,
            openai_api_key=settings.OPENAI_API_KEY,
            dimensions=1536 
        )
        
        self.vector_store = SupabaseVectorStore(
            client=self.supabase_client,
            embedding=self.embeddings,
            table_name=table_name,
            query_name=query_name,
            chunk_size=settings.CHUNK_SIZE,
        )
        
        self.store_type = "supabase"
        
        self._verify_database_setup()
    
    def _verify_database_setup(self):
        """Verify that the database has the required table and function"""
        try:
            result = self.supabase_client.table(self.table_name).select("id").limit(1).execute()
            print(f"✅ Supabase table '{self.table_name}' is accessible")
        except Exception as e:
            print(f"⚠️ Warning: Could not verify Supabase table '{self.table_name}': {e}")
            print("💡 Make sure you have created the documents table with the pgvector extension")
    
    def _get_embedding_dimension(self):
        """Get dimension based on embedding model"""
        model_dimensions = {
            "text-embedding-ada-002": 1536,
            "text-embedding-3-small": 1536,
            "text-embedding-3-large": 1536 
        }
        return model_dimensions.get(self.embedding_model, 1536)
    
    def add_documents(
        self, 
        texts: List[str], 
        metadatas: List[Dict],
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """Add documents to Supabase vector store"""
        if not ids:
            ids = [str(uuid.uuid4()) for _ in texts]
        
        print(f"📝 Adding {len(texts)} documents to Supabase...")
        
        try:
            documents = [
                Document(page_content=text, metadata=metadata)
                for text, metadata in zip(texts, metadatas)
            ]
            
            added_ids = self.vector_store.add_documents(documents, ids=ids)
            
            print(f"✅ Successfully added {len(added_ids)} documents to Supabase")
            return added_ids
            
        except Exception as e:
            print(f"❌ Error adding documents to Supabase: {e}")
            raise e
    
    def similarity_search_with_score(
        self, 
        query: str, 
        k: int = 10,
        filter: Optional[Dict] = None,
        namespace: Optional[str] = None
    ) -> List[tuple]:
        """Search with relevance scores in Supabase"""
        search_kwargs = {"k": k}
        
        if filter:
            search_kwargs["filter"] = filter
        
        if namespace:
            if filter:
                filter["namespace"] = namespace
            else:
                search_kwargs["filter"] = {"namespace": namespace}
        
        return self.vector_store.similarity_search_with_relevance_scores(query, **search_kwargs)
    
    def as_retriever(self, **kwargs) -> Any:
        """Get Supabase retriever for RAG chains"""
        return self.vector_store.as_retriever(**kwargs)
    
    def delete_documents(
        self, 
        ids: List[str],
        namespace: Optional[str] = None
    ) -> bool:
        """Delete documents from Supabase by IDs"""
        try:
            delete_filter = {"id": {"in": ids}}
            if namespace:
                delete_filter["namespace"] = namespace
            
            result = self.supabase_client.table(self.table_name).delete().in_("id", ids).execute()
            
            if result.data:
                print(f"✅ Deleted {len(result.data)} documents from Supabase")
                return True
            else:
                print("⚠️ No documents were deleted (they may not exist)")
                return False
                
        except Exception as e:
            print(f"❌ Error deleting documents from Supabase: {e}")
            return False
    
    def get_document_count(self, namespace: Optional[str] = None) -> int:
        """Get document count from Supabase"""
        try:
            query = self.supabase_client.table(self.table_name).select("id", count="exact")
            
            if namespace:
                query = query.eq("metadata->namespace", namespace)
            
            result = query.execute()
            return result.count if result.count is not None else 0
            
        except Exception as e:
            print(f"❌ Error getting document count from Supabase: {e}")
            return 0
    
    def delete_all_documents(self, namespace: Optional[str] = None) -> bool:
        """Delete all documents from Supabase"""
        try:
            print(f"🗑️ Deleting all documents from Supabase table: {self.table_name}")
            
            if namespace:
                result = self.supabase_client.table(self.table_name).delete().eq("metadata->namespace", namespace).execute()
                deleted_count = len(result.data) if result.data else 0
                print(f"✅ Deleted {deleted_count} documents from namespace '{namespace}' in Supabase")
            else:
                result = self.supabase_client.table(self.table_name).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
                deleted_count = len(result.data) if result.data else 0
                print(f"✅ Deleted all {deleted_count} documents from Supabase")
            
            return True
            
        except Exception as e:
            print(f"❌ Error deleting all documents from Supabase: {e}")
            return False
