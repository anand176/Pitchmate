"""
Pitchmate FastAPI application entry point.
"""
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()  # loads backend/.env automatically

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown hooks."""
    # Startup
    from core.supabase_client import get_supabase_client
    get_supabase_client()  # initialise singleton on startup
    yield
    # Shutdown (nothing to clean up for now)


app = FastAPI(
    title="Pitchmate API",
    description="AI-powered pitch deck assistant backend.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from auth.router import router as auth_router                    # noqa: E402
from agents.backend import router as agents_router              # noqa: E402
from knowledge_base.router import router as kb_router           # noqa: E402

app.include_router(auth_router)
app.include_router(agents_router)
app.include_router(kb_router)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
