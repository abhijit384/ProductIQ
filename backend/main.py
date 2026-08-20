import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from backend.database.database import engine, Base
import backend.database.models  # Ensure all models are registered

# Initialize tables immediately
Base.metadata.create_all(bind=engine)

from backend.api import (
    routes_health,
    routes_upload,
    routes_dashboard,
    routes_products,
    routes_quality,
    routes_conflicts,
    routes_duplicates,
    routes_enrichment,
    routes_sources,
    routes_export
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("[ProductIQ Engine] Relational database schema ready.")
    yield
    print("[ProductIQ Engine] Shutting down.")

app = FastAPI(
    title="ProductIQ — AI Product Intelligence Platform",
    description="Enterprise AI platform converting messy industrial catalogs into structured, validated, commerce-ready intelligence.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for Local Development & Deployed Vercel / Production Frontends
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5200",
    "http://127.0.0.1:5200",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

env_origins = os.getenv("ALLOWED_ORIGINS") or os.getenv("FRONTEND_URL", "")
if env_origins:
    for orig in env_origins.split(","):
        cleaned = orig.strip()
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[ProductIQ API Error] Exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing your request. ProductIQ resilience safeguards are active.",
            "path": request.url.path
        }
    )

# Include API Routers
app.include_router(routes_health.router, prefix="/api")
app.include_router(routes_upload.router, prefix="/api")
app.include_router(routes_dashboard.router, prefix="/api")
app.include_router(routes_products.router, prefix="/api")
app.include_router(routes_quality.router, prefix="/api")
app.include_router(routes_conflicts.router, prefix="/api")
app.include_router(routes_duplicates.router, prefix="/api")
app.include_router(routes_enrichment.router, prefix="/api")
app.include_router(routes_sources.router, prefix="/api")
app.include_router(routes_export.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
