"""
SQLAlchemy async engine/session setup for Pitchmate's self-hosted Postgres database.

Shares the same DATABASE_URL as the LangGraph checkpointer (agents/langgraph_runner.py),
which needs the plain `postgresql://` form for psycopg_pool. SQLAlchemy's async engine
needs the `postgresql+psycopg://` dialect form, so we adapt the URL here rather than
requiring a second environment variable — both point at the same Postgres instance.
"""

import logging
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from core.config import config

logger = logging.getLogger("db")


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def _to_async_url(database_url: str) -> str:
    """Adapt a plain `postgresql://`/`postgres://` conninfo string to SQLAlchemy's async psycopg dialect."""
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgres://"):  # some providers use this shorthand
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    return database_url


_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """Return (and lazily create) the singleton async SQLAlchemy engine."""
    global _engine
    if _engine is None:
        database_url = config.get_database_url()
        if not database_url:
            raise RuntimeError(
                "DATABASE_URL is not set. User accounts require Postgres — "
                "run `docker compose up` (which provides a `db` service) or set "
                "DATABASE_URL to point at your own Postgres instance."
            )
        _engine = create_async_engine(_to_async_url(database_url), pool_pre_ping=True)
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    """Return (and lazily create) the singleton async session factory."""
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(get_engine(), expire_on_commit=False)
    return _sessionmaker


async def get_db_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency yielding a request-scoped AsyncSession."""
    async with get_sessionmaker()() as session:
        yield session


async def init_db() -> None:
    """Create all ORM tables that don't exist yet. Called once at app startup."""
    from db import models  # noqa: F401 - ensure models are registered on Base.metadata

    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ensured (users, startup_profiles, ...)")


async def close_db() -> None:
    """Dispose of the engine's connection pool. Called on app shutdown."""
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessionmaker = None
