from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.schemas.common import ResponseEnvelope
from app.core.config import settings

router = APIRouter()


@router.get("/health", response_model=ResponseEnvelope[dict])
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    return ResponseEnvelope(
        success=True,
        message="Ashmora CityMind AI API System Healthy",
        data={
            "status": "online",
            "project": settings.PROJECT_NAME,
            "version": "1.0.0",
            "database": db_status,
        }
    )
