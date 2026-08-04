from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request, status
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

# ── Import all models FIRST so SQLAlchemy metadata is fully populated ──────────
import app.models as _models_init  # noqa: F401 — registers all ORM models with Base.metadata

# ── Core application imports ──────────────────────────────────────────────────
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.session import engine, AsyncSessionLocal
from app.db.base import Base
from app.db.seed import seed_database_if_empty


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application lifespan handler — runs on startup and shutdown."""
    setup_logging()
    logger.info("Initializing Ashmora CityMind AI Database Tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Auto-seed database if empty (ensures live Render deployments have demo accounts ready)
    async with AsyncSessionLocal() as session:
        await seed_database_if_empty(session)

    logger.info("Ashmora CityMind AI Engine started successfully.")
    yield
    logger.info("Shutting down Ashmora CityMind AI Engine.")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# ── CORS — allow all origins for Vercel & custom deployments ──────────────────
# NOTE: allow_credentials=True is incompatible with allow_origins=["*"].
# Using explicit wildcard list until production origin list is configured.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ───────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred.",
            "detail": str(exc),
            "error": str(exc),
        },
    )


# ── API Router ─────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)


# ── Root health-check endpoint ─────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "brand": "Ashmora",
        "product": "CityMind AI",
        "tagline": "One City. One Intelligence. Infinite Possibilities.",
        "docs": f"{settings.API_V1_STR}/docs",
    }
