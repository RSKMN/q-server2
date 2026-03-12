from datetime import datetime
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring systems and Docker health checks.
    
    Returns:
        dict: Status information including service name and timestamp
    """
    return {
        "status": "ok",
        "service": "research-lab-api",
        "timestamp": datetime.utcnow().isoformat()
    }
