from typing import Union, List
from app.tools.rag_tool import RAGTool

_tool = RAGTool()

async def rag_mcp(document_url: str, questions: Union[str, List[str]], k: int = 10, use_ocr: bool = False, use_cache: bool = True):
    """Process a document from URL and retrieve relevant context/chunks based on questions."""
    if isinstance(questions, str):
        questions = [questions]
    
    result = await _tool.execute(
        document_url=document_url,
        questions=questions,
        k=k,
        use_ocr=use_ocr,
        use_cache=use_cache
    )
    
    if result.success:
        return {
            "chunks": result.result.get("chunks", []),
            "summary": result.result.get("summary", ""),
            "document_processed": result.result.get("document_processed", False),
            "chunks_processed": result.result.get("chunks_processed", 0),
            "cached_used": result.result.get("cached_used", False),
            "use_ocr": result.result.get("use_ocr", False),
            "success": True
        }
    else:
        return {
            "chunks": [],
            "summary": "",
            "document_processed": False,
            "chunks_processed": 0,
            "cached_used": False,
            "use_ocr": False,
            "success": False,
            "error": result.error
        }