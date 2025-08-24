from langchain_markitdown import DocxLoader, XlsxLoader, PdfLoader
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_pymupdf4llm import PyMuPDF4LLMLoader
from langchain_core.documents import Document
from app.services.utils.file_processor.chunk_cleaner import ChunkCleaner
from app.services.utils.file_processor.document_splitter import DocumentSplitter
from app.services.utils.file_processor.custom_pptx_loader import CustomPptxLoader
import uuid
import os
import tempfile
import requests
import mimetypes
from typing import Dict, Optional, List
from urllib.parse import urlparse
import pytesseract
from PIL import Image

class FileProcessor:
    DEFAULT_ERROR_MSG = "Sorry, I cannot answer this question. If you have any other queries, feel free to ask."
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200, 
                 clean_content: bool = True, min_chunk_length: int = 100,
                 use_pptx_ocr: bool = True,
                 use_llm_pdf_loader: bool = True):
        self.supported_extensions = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        }

        self.max_file_size = 500 * 1024 * 1024  # 500MB
        self.clean_content = clean_content
        self.use_pptx_ocr = use_pptx_ocr
        self.use_llm_pdf_loader = use_llm_pdf_loader
        
        self.chunk_cleaner = ChunkCleaner(min_chunk_length)
        self.document_splitter = DocumentSplitter(chunk_size, chunk_overlap)

    def _invalid(self):
        return {"valid": False, "error": self.DEFAULT_ERROR_MSG}

    def _fail(self, msg: str | None = None):
        return {"success": False, "error": msg or self.DEFAULT_ERROR_MSG}


    def validate_file_url(self, url: str) -> Dict:
        """Validate file URL and check if file type is supported"""
        try:
            response = requests.head(url, allow_redirects=True, timeout=10)
            response.raise_for_status()
            
            content_length = response.headers.get('content-length')
            
            if content_length and int(content_length) > self.max_file_size:
                return self._invalid()
            
            parsed_url = urlparse(url)
            filename = os.path.basename(parsed_url.path.split('?')[0])
            file_extension = os.path.splitext(filename)[1].lower()
            
            if not file_extension or file_extension not in self.supported_extensions:
                return self._invalid()
            
            return {
                "valid": True,
                "file_extension": file_extension,
                "filename": filename
            }
            
        except requests.RequestException as e:
            parsed_url = urlparse(url)
            filename = os.path.basename(parsed_url.path.split('?') [0])
            file_extension = os.path.splitext(filename)[1].lower()
            
            return self._invalid()

    def _bytes_to_tempfile(self, content: bytes, suffix: str = '.tmp') -> str:
        """Write bytes to a temporary file and return its path."""
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        try:
            tmp.write(content)
            tmp.close()
            return tmp.name
        except Exception:
            if os.path.exists(tmp.name):
                os.unlink(tmp.name)
            raise

    def download_and_validate_file(self, url: str) -> Dict:
        """Download file and perform validation with in-memory buffer."""
        try:
            # Download content to memory first
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            content = response.content
            
            if len(content) > self.max_file_size:
                return self._fail()
            
            # Parse URL and filename
            parsed_url = urlparse(url)
            filename = os.path.basename(parsed_url.path.split('?')[0]) or "document"
            file_extension = os.path.splitext(filename)[1].lower()
            
            # Detect MIME type using filename and content analysis
            detected_type = None
            
            # First try mimetypes based on URL/filename
            detected_type = mimetypes.guess_type(url)[0]
            
            # If mimetypes fails, use file extension mapping
            if not detected_type:
                detected_type = self.supported_extensions.get(file_extension, 'application/octet-stream')
            
            # Basic content-based detection for common formats
            if not detected_type or detected_type == 'application/octet-stream':
                # Check for PDF signature
                if content.startswith(b'%PDF'):
                    detected_type = 'application/pdf'
                # Check for ZIP-based formats (Office documents)
                elif content.startswith(b'PK\x03\x04') or content.startswith(b'PK\x05\x06'):
                    if file_extension == '.docx':
                        detected_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    elif file_extension == '.pptx':
                        detected_type = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                    elif file_extension == '.xlsx':
                        detected_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                # Check for image formats
                elif content.startswith(b'\xFF\xD8\xFF'):  # JPEG
                    detected_type = 'image/jpeg'
                elif content.startswith(b'\x89PNG\r\n\x1a\n'):  # PNG
                    detected_type = 'image/png'
            
            # Handle Office document MIME types
            if detected_type in ['application/zip', 'application/x-zip-compressed'] and file_extension in ['.docx', '.pptx', '.xlsx']:
                if file_extension == '.docx':
                    detected_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                elif file_extension == '.pptx':
                    detected_type = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                elif file_extension == '.xlsx':
                    detected_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            
            # Validate file extension
            if file_extension not in self.supported_extensions:
                return self._fail()
            
            # Write to temp file only if validation passes
            temp_path = self._bytes_to_tempfile(content, file_extension)
            
            return {
                "success": True,
                "file_path": temp_path,
                "detected_type": detected_type,
                "filename": filename
            }
            
        except Exception as e:
            return self._fail()

    def _extract_text_from_image(self, file_path: str) -> Dict:
        """Extract text from image using OCR"""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            
            if not text.strip():
                return self._fail()
            
            doc = Document(
                page_content=text.strip(),
                metadata={
                    "source": file_path,
                    "file_type": "image",
                    "extraction_method": "OCR"
                }
            )
            
            return {
                "success": True,
                "documents": [doc]
            }
            
        except Exception as e:
            return self._fail()

    def load_document(self, file_path: str, detected_type: str) -> Dict:
        """Load document using appropriate loader based on file type"""
        try:
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if detected_type == 'application/pdf' or file_extension == '.pdf':
                # Choose loader implementation based on initialization flag
                if self.use_llm_pdf_loader:
                    loader = PyMuPDF4LLMLoader(file_path, mode='single')
                else:
                    loader = PyMuPDFLoader(file_path)
            elif 'word' in detected_type or file_extension in ['.docx', '.doc']:
                loader = DocxLoader(file_path)
            elif 'presentation' in detected_type or file_extension in ['.pptx', '.ppt']:
                loader = CustomPptxLoader(file_path, use_ocr=self.use_pptx_ocr)
            elif 'spreadsheet' in detected_type or file_extension in ['.xlsx', '.xls']:
                loader = XlsxLoader(file_path)
            elif 'image' in detected_type or file_extension in ['.jpg', '.jpeg', '.png']:
                return self._extract_text_from_image(file_path)
            else:
                return self._fail()
            
            documents = loader.load()
            
            if not documents or not any(doc.page_content.strip() for doc in documents):
                return self._fail()
            
            return {
                "success": True,
                "documents": documents
            }
            
        except Exception as e:
            return self._fail()
    
    def process_to_chunks(self, documents: List, detected_type: str) -> Dict:
        """Process documents into cleaned chunks"""
        try:
            print(f"📖 Processing {len(documents)} pages into chunks...")
            
            is_ocr_content = any(doc.metadata.get('extraction_method') == 'OCR' for doc in documents)
            extraction_method = 'OCR' if is_ocr_content else None
            
            repetitive_patterns = []
            if self.clean_content and detected_type == 'application/pdf':
                repetitive_patterns = self.chunk_cleaner.detect_repetitive_patterns(documents)
            
            chunks = self.document_splitter.split_documents(documents)
            
            if self.clean_content and not self.use_llm_pdf_loader:
                if detected_type == 'application/pdf' and repetitive_patterns:
                    chunks = self.chunk_cleaner._aggressive_clean_chunks(chunks, repetitive_patterns)
                else:
                    chunks = self.chunk_cleaner.clean_chunks_by_type(chunks, detected_type, extraction_method)
            elif is_ocr_content:
                chunks = self.chunk_cleaner._minimal_clean_chunks(chunks)
            
            return {
                "success": True,
                "chunks": chunks,
                "extraction_method": extraction_method,
                "patterns_detected": len(repetitive_patterns)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to process chunks: {str(e)}"
            }

    def cleanup_file(self, file_path: str):
        """Clean up temporary file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass
