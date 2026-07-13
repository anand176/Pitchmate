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
    get_supabase_client()  # initialise singleton on startup (still used by the knowledge base)

    # Ensure the self-hosted auth database (users table) exists.
    from db.base import init_db
    await init_db()

    # Optional MLflow tracking for agents, dashboard LLM calls, and KB ops.
    from core.mlflow_tracking import init_mlflow
    init_mlflow()

    # MCP-backed agents need async init (cannot use asyncio.run under uvicorn).
    from agents.sub_agents.drawio.agent import init_drawio_agent
    from agents.sub_agents.figma_mcp.agent import init_figma_agent
    await init_drawio_agent()
    await init_figma_agent()

    # Build the orchestrator with a real checkpointer (Postgres if DATABASE_URL
    # is set, else in-memory) so multi-turn chat sessions actually persist.
    # This must happen here (not at module import time) because checkpointer
    # setup is async — and AFTER MCP agents so drawio/figma tools are included.
    from agents.langgraph_runner import get_checkpointer, cache_agent
    from agents.agent import build_pitchmate_agent

    checkpointer = await get_checkpointer()
    cache_agent("pitchmate_agent", build_pitchmate_agent(checkpointer=checkpointer))

    yield

    # Shutdown
    from agents.langgraph_runner import cleanup_checkpointer
    await cleanup_checkpointer()

    from db.base import close_db
    await close_db()


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
from agents.context_router import router as context_router      # noqa: E402
from knowledge_base.router import router as kb_router           # noqa: E402
from dashboard.router import router as dashboard_router         # noqa: E402
from startup.router import router as startup_router            # noqa: E402

app.include_router(auth_router)
app.include_router(agents_router)
app.include_router(context_router)
app.include_router(kb_router)
app.include_router(dashboard_router)
app.include_router(startup_router)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
