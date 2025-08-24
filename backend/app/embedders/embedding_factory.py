from typing import Optional, Dict, Any
from .base_embedder import BaseEmbedder
from .openai_embedder import OpenAIEmbedder
from .bge_m3_embedder import BGEM3Embedder


def get_embedding_model(
    name: str, 
    api_key: Optional[str] = None,
    **kwargs
) -> BaseEmbedder:
    """
    Factory function to create embedding model instances
    
    Args:
        name: Name of the embedding model
        api_key: API key for models that require it (e.g., OpenAI)
        **kwargs: Additional arguments specific to each model
        
    Returns:
        BaseEmbedder instance
        
    Raises:
        ValueError: If the model name is not supported
        
    Supported models:
        - "text-embedding-3-small": OpenAI text-embedding-3-small
        - "text-embedding-3-large": OpenAI text-embedding-3-large  
        - "text-embedding-ada-002": OpenAI text-embedding-ada-002
        - "bge-m3": BGE-M3 model
    """
    name = name.lower().strip()
    
    # OpenAI models
    if name in ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"]:
        return OpenAIEmbedder(model=name, api_key=api_key)
    
    # BGE-M3 model
    elif name == "bge-m3":
        # Extract BGE-M3 specific parameters
        bge_params = {}
        if "batch_size" in kwargs:
            bge_params["batch_size"] = kwargs["batch_size"]
        if "max_length" in kwargs:
            bge_params["max_length"] = kwargs["max_length"]
        if "device" in kwargs:
            bge_params["device"] = kwargs["device"]
        if "use_fp16" in kwargs:
            bge_params["use_fp16"] = kwargs["use_fp16"]
            
        return BGEM3Embedder(**bge_params)
    
    else:
        supported_models = [
            "text-embedding-3-small",
            "text-embedding-3-large", 
            "text-embedding-ada-002",
            "bge-m3"
        ]
        raise ValueError(
            f"Unsupported embedding model: {name}. "
            f"Supported models: {', '.join(supported_models)}"
        )
