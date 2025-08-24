from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.config.settings import settings
import asyncio
import platform

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="LLM-Powered Intelligent Query-Retrieval and Agentic System for Document and Query Processing"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    """Handle startup events"""
    print("Starting HackRX API Server...")

@app.on_event("shutdown")
async def shutdown_event():
    """Handle shutdown events and cleanup"""
    print("Shutting down HackRX API Server...")
    
    try:
        from app.tools.url_request_tool import URLRequestTool
        await URLRequestTool.cleanup_session()
    except Exception as e:
        print(f"Error cleaning up HTTP session: {e}")
    
    await asyncio.sleep(0.1)
    print("Cleanup completed")

@app.get("/")
async def root():
    return {
        "message": "HackRX Intelligence System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    
    if platform.system() == "Windows":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        access_log=True,
        log_level="info"
    )
