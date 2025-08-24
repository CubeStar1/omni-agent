from abc import ABC, abstractmethod
from typing import List, Union
import numpy as np


class BaseEmbedder(ABC):
    """Abstract base class for embedding models"""
    
    @abstractmethod
    def embed(self, texts: Union[str, List[str]]) -> List[List[float]]:
        """
        Generate embeddings for input texts
        
        Args:
            texts: Single text string or list of text strings
            
        Returns:
            List of embedding vectors (each vector is a list of floats)
        """
        pass
    
    @property
    @abstractmethod
    def dimension(self) -> int:
        """Return the dimension of the embedding vectors"""
        pass
    
    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return the name/identifier of the embedding model"""
        pass
    
    def embed_single(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Input text string
            
        Returns:
            Single embedding vector as list of floats
        """
        return self.embed([text])[0]
