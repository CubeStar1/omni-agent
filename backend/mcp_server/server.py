from typing import Union, List
from fastmcp import FastMCP
from mcp_server.config.mcp_settings import MCP_SERVER_PORT
from mcp_server.tools.retrieve_context_mcp import retrieve_context_mcp
from mcp_server.tools.rag_mcp import rag_mcp

mcp = FastMCP("hackrx-rag-server")

@mcp.tool(description="Retrieve relevant chunks from documents using natural language queries")
async def retrieve_context(questions: Union[str, List[str]], k: int = 10):
    return await retrieve_context_mcp(questions, k)

@mcp.tool(description="Process a document from URL and retrieve relevant context/chunks based on questions. Returns document content chunks with summary.")
async def rag_search(document_url: str, questions: Union[str, List[str]], k: int = 10, use_ocr: bool = False, use_cache: bool = True):
    return await rag_mcp(document_url, questions, k, use_ocr, use_cache)

def run_server(port: int = None):
    mcp.run(transport="streamable-http", port=port or MCP_SERVER_PORT)