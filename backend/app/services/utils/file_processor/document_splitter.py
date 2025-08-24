from langchain.text_splitter import RecursiveCharacterTextSplitter, MarkdownTextSplitter
from typing import List, Dict

class DocumentSplitter:
    """Handles document splitting into chunks"""

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200, type: str = "markdown"):
        self.type = type
        if type == "markdown":
            self.text_splitter = MarkdownTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
        else:
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
    
    def split_documents(self, documents: List, preserve_metadata: Dict = None) -> List:
        """Split documents into chunks and preserve metadata"""
        
        chunks = self.text_splitter.split_documents(documents)
        
        if preserve_metadata:
            for chunk in chunks:
                chunk.metadata.update(preserve_metadata)
        
        return chunks
