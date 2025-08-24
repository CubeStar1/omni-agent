from typing import List
from langchain_core.embeddings import Embeddings
from .base_embedder import BaseEmbedder


class LangChainEmbeddingWrapper(Embeddings):
    """
    LangChain-compatible wrapper for our embedding models
    """
    
    def __init__(self, embedder: BaseEmbedder):
        """
        Initialize wrapper with an embedder instance
        
        Args:
            embedder: BaseEmbedder instance
        """
        self.embedder = embedder
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embed search docs.
        
        Args:
            texts: List of text to embed.
            
        Returns:
            List of embeddings.
        """
        return self.embedder.embed(texts)
    
    def embed_query(self, text: str) -> List[float]:
        """
        Embed query text.
        
        Args:
            text: Text to embed.
            
        Returns:
            Embedding.
        """
        return self.embedder.embed_single(text)
