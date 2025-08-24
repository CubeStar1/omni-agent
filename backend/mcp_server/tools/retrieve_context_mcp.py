from typing import Union, List
from app.tools.retrieve_context_tool import RetrieveContextTool

_tool = RetrieveContextTool()

async def retrieve_context_mcp(questions: Union[str, List[str]], k: int = 10):
    """Retrieve relevant chunks from documents."""
    if isinstance(questions, str):
        questions = [questions]
    
    result = await _tool.execute(questions=questions, k=k)
    
    if result.success:
        return {
            "chunks": result.result.get("chunks", []),
            "summary": result.result.get("summary", ""),
            "success": True
        }
    else:
        return {
            "chunks": [],
            "summary": "",
            "success": False,
            "error": result.error
        }