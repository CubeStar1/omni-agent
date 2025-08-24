from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any
from langchain.schema import Document

class BaseVectorStore(ABC):
    """Abstract base class for vector store implementations"""
    
    @abstractmethod
    def add_documents(
        self, 
        texts: List[str], 
        metadatas: List[Dict],
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """Add documents to vector store"""
        pass
    
    @abstractmethod
    def similarity_search_with_score(
        self, 
        query: str, 
        k: int = 10,
        filter: Optional[Dict] = None,
        namespace: Optional[str] = None
    ) -> List[tuple]:
        """Search with relevance scores"""
        pass
    
    @abstractmethod
    def as_retriever(self, **kwargs) -> Any:
        """Get retriever for RAG chains"""
        pass
    
    @abstractmethod
    def delete_documents(
        self, 
        ids: List[str],
        namespace: Optional[str] = None
    ) -> bool:
        """Delete documents by IDs"""
        pass
    
    @abstractmethod
    def get_document_count(self, namespace: Optional[str] = None) -> int:
        """Get total document count"""
        pass
    
    @abstractmethod
    def delete_all_documents(self, namespace: Optional[str] = None) -> bool:
        """Delete all documents from vector store"""
        pass
    
    # Optional caching methods (can be overridden by implementations that support caching)
    def supports_caching(self) -> bool:
        """Check if this vector store supports caching"""
        return False
    
    def load_from_cache(self, document_url: str) -> bool:
        """Load cached vector store for document URL. Returns True if successful."""
        return False
    
    def save_to_cache(self, document_url: str) -> bool:
        """Save current vector store to cache for document URL. Returns True if successful."""
        return False
    
    def has_cache(self, document_url: str) -> bool:
        """Check if cache exists for document URL"""
        return False
    
    def clear_cache(self, document_url: Optional[str] = None) -> bool:
        """Clear cache for specific URL or all cache"""
        return False
