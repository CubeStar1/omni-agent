from typing import List, Union, Optional
from .base_embedder import BaseEmbedder
import os
import torch


class BGEM3Embedder(BaseEmbedder):
    """BGE-M3 embedding model wrapper using FlagEmbedding"""
    
    def __init__(
        self, 
        batch_size: int = 8, 
        max_length: int = 8192,
        device: Optional[str] = None,
        use_fp16: Optional[bool] = None
    ):
        """
        Initialize BGE-M3 embedder
        
        Args:
            batch_size: Batch size for processing (default: 8)
            max_length: Maximum sequence length (default: 8192)
            device: Device to use ('cuda', 'cpu', or None for auto-detection)
            use_fp16: Whether to use fp16 precision (None for auto-detection based on device)
        """
        self.batch_size = batch_size
        self.max_length = max_length
        
        # Handle device selection
        if device is None:
            # Check CUDA_VISIBLE_DEVICES environment variable
            cuda_visible = os.getenv("CUDA_VISIBLE_DEVICES")
            if cuda_visible is not None and torch.cuda.is_available():
                # If CUDA_VISIBLE_DEVICES is set and CUDA is available, use GPU
                if cuda_visible == "1":
                    device = "cuda:1"
                else:
                    device = "cuda"
            elif torch.cuda.is_available():
                device = "cuda"
            else:
                device = "cpu"
        
        self.device = device
        
        # Handle fp16 precision
        if use_fp16 is None:
            # Use fp16 only on GPU for better speed
            use_fp16 = device.startswith("cuda")
        
        self.use_fp16 = use_fp16
        
        # Initialize the model
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the BGE-M3 model"""
        try:
            from FlagEmbedding import BGEM3FlagModel
        except ImportError:
            raise ImportError(
                "FlagEmbedding is required for BGE-M3 embeddings. "
                "Install it with: pip install -U FlagEmbedding"
            )
        
        # Initialize the model with specified parameters
        self.model = BGEM3FlagModel(
            model_name_or_path='BAAI/bge-m3',
            use_fp16=self.use_fp16,
            device=self.device,
            batch_size=self.batch_size,
            max_length=self.max_length
        )
        
        print(f"Initialized BGE-M3 model on device: {self.device}, fp16: {self.use_fp16}")
    
    def embed(self, texts: Union[str, List[str]]) -> List[List[float]]:
        """
        Generate embeddings for input texts
        
        Args:
            texts: Single text string or list of text strings
            
        Returns:
            List of embedding vectors (dense embeddings)
        """
        if isinstance(texts, str):
            texts = [texts]
        
        # Generate dense embeddings using BGE-M3
        embeddings = self.model.encode(
            texts,
            batch_size=self.batch_size,
            max_length=self.max_length,
            return_dense=True,
            return_sparse=False,
            return_colbert_vecs=False
        )
        
        # Check if embeddings are a dictionary (newer versions of FlagEmbedding)
        if isinstance(embeddings, dict) and 'dense_vecs' in embeddings:
            embeddings = embeddings['dense_vecs']
            
        # Check if embeddings are a dictionary (newer versions of FlagEmbedding)
        if isinstance(embeddings, dict) and 'dense_vecs' in embeddings:
            embeddings = embeddings['dense_vecs']
            
        # BGE-M3 returns dense embeddings as numpy arrays
        # Convert to list of lists for consistency
        if hasattr(embeddings, 'tolist'):
            return embeddings.tolist()
        elif isinstance(embeddings, list) and all(hasattr(emb, 'tolist') for emb in embeddings):
            return [emb.tolist() for emb in embeddings]
        else:
            # Fallback conversion for other formats
            return [list(emb) if not isinstance(emb, list) else emb for emb in embeddings]
    
    @property
    def dimension(self) -> int:
        """Return the dimension of the embedding vectors"""
        return 1024  # BGE-M3 produces 1024-dimensional embeddings
    
    @property
    def model_name(self) -> str:
        """Return the name/identifier of the embedding model"""
        return "bge-m3"
