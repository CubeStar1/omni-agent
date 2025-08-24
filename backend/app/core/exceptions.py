from fastapi import HTTPException

class DocumentProcessingError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=422, detail=f"Document processing failed: {detail}")

class VectorStoreError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=500, detail=f"Vector store error: {detail}")

class LLMProviderError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=500, detail=f"LLM provider error: {detail}")

class DocumentNotFoundError(HTTPException):
    def __init__(self, document_id: str):
        super().__init__(status_code=404, detail=f"Document not found: {document_id}")

class InvalidQueryError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=f"Invalid query: {detail}")
