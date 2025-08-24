import os
import hashlib
import json
import shutil
from pathlib import Path
from typing import Optional, Dict, Any
from app.config.settings import settings

class VectorStoreCache:
    """Manages caching of vector stores based on document URLs"""
    
    def __init__(self, cache_dir: str = "vector_store_cache"):
        """Initialize cache manager
        
        Args:
            cache_dir: Directory to store cached vector stores
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
        self.metadata_file = self.cache_dir / "cache_metadata.json"
        self.metadata = self._load_metadata()
        
        print(f"Vector store cache initialized at: {self.cache_dir}")
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Load cache metadata from file"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading cache metadata: {e}")
                return {}
        return {}
    
    def _save_metadata(self):
        """Save cache metadata to file"""
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(self.metadata, f, indent=2)
        except Exception as e:
            print(f"Error saving cache metadata: {e}")
    
    def _get_cache_key(self, document_url: str) -> str:
        """Generate cache key from document URL"""
        return hashlib.sha256(document_url.encode()).hexdigest()[:16]
    
    def _get_cache_path(self, cache_key: str) -> Path:
        """Get cache file path for a given cache key"""
        return self.cache_dir / f"{cache_key}.vs"
    
    def has_cached_store(self, document_url: str) -> bool:
        """Check if a cached vector store exists for the document URL"""
        cache_key = self._get_cache_key(document_url)
        cache_path = self._get_cache_path(cache_key)
        
        if cache_path.exists() and cache_key in self.metadata:
            return True
        
        return False
    
    def get_cache_path(self, document_url: str) -> Optional[str]:
        """Get cache file path for a document URL if it exists"""
        cache_key = self._get_cache_key(document_url)
        cache_path = self._get_cache_path(cache_key)
        
        if cache_path.exists() and cache_key in self.metadata:
            return str(cache_path)
        return None
    
    def cache_vector_store(self, document_url: str, vector_store_path: str) -> bool:
        """Cache a vector store for a document URL
        
        Args:
            document_url: The document URL
            vector_store_path: Path where the vector store was dumped
            
        Returns:
            bool: Success status
        """
        try:
            cache_key = self._get_cache_key(document_url)
            cache_path = self._get_cache_path(cache_key)
            
            if os.path.exists(vector_store_path):
                # Use shutil.move instead of os.rename to handle cross-device moves
                shutil.move(vector_store_path, cache_path)
                
                self.metadata[cache_key] = {
                    "document_url": document_url,
                    "cache_path": str(cache_path),
                    "created_at": json.dumps({"timestamp": "now"}),  
                }
                
                self._save_metadata()
                print(f"Cached vector store for URL: {document_url[:50]}...")
                return True
            else:
                print(f"Vector store file not found: {vector_store_path}")
                return False
                
        except Exception as e:
            print(f"Error caching vector store: {e}")
            return False
    
    def get_cache_info(self, document_url: str) -> Optional[Dict[str, Any]]:
        """Get cache information for a document URL"""
        cache_key = self._get_cache_key(document_url)
        return self.metadata.get(cache_key)
    
    def clear_cache(self, document_url: Optional[str] = None):
        """Clear cache for specific URL or all cache
        
        Args:
            document_url: Specific URL to clear, None to clear all
        """
        try:
            if document_url:
                cache_key = self._get_cache_key(document_url)
                cache_path = self._get_cache_path(cache_key)
                
                if cache_path.exists():
                    cache_path.unlink()
                
                if cache_key in self.metadata:
                    del self.metadata[cache_key]
                    
                print(f"Cleared cache for URL: {document_url[:50]}...")
            else:
                for cache_file in self.cache_dir.glob("*.vs"):
                    cache_file.unlink()
                
                self.metadata.clear()
                print("Cleared all vector store cache")
            
            self._save_metadata()
            
        except Exception as e:
            print(f"Error clearing cache: {e}")
    
    def list_cached_urls(self) -> list:
        """List all cached document URLs"""
        return [entry["document_url"] for entry in self.metadata.values()]
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        cache_files = list(self.cache_dir.glob("*.vs"))
        total_size = sum(f.stat().st_size for f in cache_files)
        
        return {
            "total_entries": len(self.metadata),
            "total_files": len(cache_files),
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "cache_dir": str(self.cache_dir)
        }
