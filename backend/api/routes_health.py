from fastapi import APIRouter
from backend.ai.gemini_service import ai_service

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "ProductIQ Intelligence API",
        "version": "1.0.0"
    }

@router.get("/ai/status")
def get_ai_status():
    return ai_service.get_status()
