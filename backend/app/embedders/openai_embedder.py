from typing import List, Union
from langchain_openai import OpenAIEmbeddings
from .base_embedder import BaseEmbedder
import os


class OpenAIEmbedder(BaseEmbedder):
    """OpenAI embedding model wrapper"""
    
    def __init__(self, model: str = "text-embedding-3-small", api_key: str = None):
        """
        Initialize OpenAI embedder
        
        Args:
            model: OpenAI embedding model name
            api_key: OpenAI API key (if None, will use OPENAI_API_KEY env var)
        """
        self.model = model
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass api_key parameter.")
        
        # Initialize the OpenAI embeddings
        self.embeddings = OpenAIEmbeddings(
            model=model,
            openai_api_key=self.api_key
        )
        
        # Set dimensions based on model
        self._dimensions = {
            "text-embedding-ada-002": 1536,
            "text-embedding-3-small": 1536,
            "text-embedding-3-large": 3072
        }
    
    def embed(self, texts: Union[str, List[str]]) -> List[List[float]]:
        """
        Generate embeddings for input texts
        
        Args:
            texts: Single text string or list of text strings
            
        Returns:
            List of embedding vectors
        """
        if isinstance(texts, str):
            texts = [texts]
        
        # Use LangChain's OpenAI embeddings
        embeddings = self.embeddings.embed_documents(texts)
        return embeddings
    
    @property
    def dimension(self) -> int:
        """Return the dimension of the embedding vectors"""
        return self._dimensions.get(self.model, 1536)
    
    @property
    def model_name(self) -> str:
        """Return the name/identifier of the embedding model"""
        return self.model
