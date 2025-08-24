import re
from typing import List
from collections import Counter
import unicodedata

class ChunkCleaner:
    """Handles chunk cleaning and processing for different file types"""
    
    def __init__(self, min_chunk_length: int = 100):
        self.min_chunk_length = min_chunk_length
    
    def _detect_script_type(self, text: str) -> str:
        """Detect the primary script type of the text"""
        if not text:
            return "latin"
        
        script_counts = {}
        for char in text:
            if char.isspace() or char.isdigit() or char in ".,!?-()[]{}":
                continue
            
            script = unicodedata.name(char, "").split()[0] if unicodedata.name(char, "") else "UNKNOWN"
            
            if script.startswith("LATIN"):
                script_type = "latin"
            elif script.startswith("DEVANAGARI"):
                script_type = "indic"
            elif script.startswith("MALAYALAM"):
                script_type = "indic"
            elif script.startswith("TAMIL"):
                script_type = "indic"
            elif script.startswith("BENGALI"):
                script_type = "indic"
            elif script.startswith("GUJARATI"):
                script_type = "indic"
            elif script.startswith("GURMUKHI"):
                script_type = "indic"
            elif script.startswith("KANNADA"):
                script_type = "indic"
            elif script.startswith("TELUGU"):
                script_type = "indic"
            elif script.startswith("ORIYA"):
                script_type = "indic"
            elif script.startswith("ARABIC"):
                script_type = "arabic"
            elif script.startswith("CJK") or script.startswith("HIRAGANA") or script.startswith("KATAKANA"):
                script_type = "cjk"
            else:
                script_type = "other"
            
            script_counts[script_type] = script_counts.get(script_type, 0) + 1
        
        if not script_counts:
            return "latin"
        
        return max(script_counts, key=script_counts.get)
    
    def clean_chunks_by_type(self, chunks: List, file_type: str, extraction_method: str = None) -> List:
        """Clean chunks based on file type and extraction method"""
        
        if extraction_method == 'OCR':
            return self._minimal_clean_chunks(chunks)
        elif file_type == 'application/pdf':
            return self._aggressive_clean_chunks(chunks)
        else:
            return self._basic_clean_chunks(chunks, extraction_method)
    
    def _minimal_clean_chunks(self, chunks: List) -> List:
        """Minimal cleaning for OCR content"""
        processed_chunks = []
        
        for chunk in chunks:
            content = chunk.page_content.strip()
            
            if len(content) < 5: 
                continue
                
            if not content or content.isspace():
                continue
                
            processed_chunks.append(chunk)
        
        print(f"Minimal cleaning (OCR): {len(chunks)} chunks → {len(processed_chunks)} clean chunks")
        return processed_chunks
    
    def _basic_clean_chunks(self, chunks: List, extraction_method: str = None) -> List:
        """Basic cleaning for non-PDF documents (less aggressive)"""
        processed_chunks = []
        
        for chunk in chunks:
            content = chunk.page_content.strip()
            
            script_type = self._detect_script_type(content)
            
            if extraction_method == 'OCR':
                if script_type == "indic":
                    min_length = 10
                elif script_type == "cjk":
                    min_length = 6
                elif script_type == "arabic":
                    min_length = 12
                else:
                    min_length = 20
            else:
                if script_type == "indic":
                    min_length = max(30, self.min_chunk_length // 3)
                elif script_type == "cjk":
                    min_length = max(20, self.min_chunk_length // 5)
                elif script_type == "arabic":
                    min_length = max(40, int(self.min_chunk_length * 0.4))
                else:
                    min_length = self.min_chunk_length
            
            if len(content) < min_length:
                continue
                
            if not content or content.isspace():
                continue
                
            processed_chunks.append(chunk)
        
        print(f"Basic cleaning ({script_type} script): {len(chunks)} chunks → {len(processed_chunks)} clean chunks")
        return processed_chunks
    
    def _aggressive_clean_chunks(self, chunks: List, repetitive_patterns: List[str] = None) -> List:
        """Aggressive cleaning for PDF documents with pattern removal"""
        
        if repetitive_patterns is None:
            repetitive_patterns = []
        
        processed_chunks = []
        
        for chunk in chunks:
            cleaned_content = self._clean_document_content(chunk.page_content, repetitive_patterns)
            
            script_type = self._detect_script_type(cleaned_content)
            
            if script_type == "indic":
                min_length = max(50, self.min_chunk_length // 2)
            elif script_type == "cjk":
                min_length = max(30, self.min_chunk_length // 3)
            elif script_type == "arabic":
                min_length = max(70, int(self.min_chunk_length * 0.7))
            else:
                min_length = self.min_chunk_length
            
            if len(cleaned_content) < min_length:
                continue
            
            chunk.page_content = cleaned_content
            processed_chunks.append(chunk)
        
        print(f"Aggressive cleaning (PDF): {len(chunks)} chunks → {len(processed_chunks)} clean chunks")
        return processed_chunks
    
    def detect_repetitive_patterns(self, documents: List) -> List[str]:
        """Detect repetitive patterns across document pages that are likely headers/footers"""
        
        total_content = ' '.join([doc.page_content for doc in documents])
        total_length = len(total_content)
        
        script_type = self._detect_script_type(total_content)
        
        if script_type in ["indic", "cjk", "arabic"] or total_length < 400:
            print(f"Skipping repetitive pattern detection for {script_type} script or short document ({total_length} chars)")
            return []
        
        if total_length < 200:
            print(f"Document too short ({total_length} chars) - skipping pattern detection")
            return []
        
        all_lines = []
        for doc in documents:
            lines = [line.strip() for line in doc.page_content.split('\n') if line.strip()]
            all_lines.extend(lines)
        
        line_counter = Counter(all_lines)
        
        total_pages = len(documents)
        repetitive_patterns = []
        
        for line, count in line_counter.items():
            if count > total_pages * 0.3:
                if (
                    len(line) < 100 and 
                    (
                        re.search(r'page \d+', line.lower()) or  # Page numbers
                        re.search(r'\d+ of \d+', line) or  # Page X of Y
                        re.search(r'ltd\.?$|inc\.?$|corp\.?$', line.lower()) or  # Company suffixes
                        re.search(r'uin:|policy|premises|plot', line.lower()) or  # Policy/document identifiers
                        re.search(r'\d{6,}', line) or  # Long numbers (IDs, postal codes)
                        line.count('-') > 2 or  # Dashes (addresses, IDs)
                        len(line.split()) <= 3  # Very short lines
                    )
                ):
                    repetitive_patterns.append(line)
        
        print(f"Detected {len(repetitive_patterns)} repetitive patterns to remove")
        return repetitive_patterns
    
    def _clean_document_content(self, content: str, repetitive_patterns: List[str]) -> str:
        """Clean document content by removing repetitive patterns and noise"""
        
        lines = content.split('\n')
        cleaned_lines = []
        
        script_type = self._detect_script_type(content)
        
        for line in lines:
            line = line.strip()
            
            if not line:
                continue
            
            if line in repetitive_patterns:
                continue
            
            if script_type == "indic":
                min_line_length = 5
            elif script_type == "cjk":
                min_line_length = 3
            elif script_type == "arabic":
                min_line_length = 7
            else:
                min_line_length = 10
            
            if len(line) < min_line_length:
                continue
            
            if script_type == "indic" or script_type == "cjk" or script_type == "arabic":

                non_numeric_chars = re.sub(r'[0-9\-\.\,\s\/\(\)]+', '', line)
                if len(non_numeric_chars) < 2: 
                    continue
            else:
                if len(re.sub(r'[0-9\-\.\,\s\/]', '', line)) < 5:
                    continue
            
            cleaned_lines.append(line)
        
        cleaned_content = ' '.join(cleaned_lines)
        cleaned_content = re.sub(r'\s+', ' ', cleaned_content)
        
        return cleaned_content.strip()
