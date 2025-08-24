from fastapi import APIRouter
from app.api.v1.endpoints.hackrx import router as hackrx_router

api_router = APIRouter()

api_router.include_router(hackrx_router, prefix="/hackrx", tags=["HackRX"])
