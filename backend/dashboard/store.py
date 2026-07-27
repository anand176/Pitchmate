"""
Persistence helpers for dashboard analysis results.

Each dashboard module (market, competition, gtm, investors, valuation, deck)
saves its latest run per user so the frontend can restore prior work, pre-fill
forms, and let readiness reflect which modules are done. One row per
(user, module) — re-running a module upserts in place.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import AnalysisResult

# Dashboard modules that persist a result. Kept here so readiness and the
# results endpoint agree on the canonical set.
ANALYSIS_MODULES = (
    "market", "competition", "gtm", "investors", "valuation", "deck",
    "debrief", "finance", "traction",
)


async def save_analysis(
    db: AsyncSession,
    user_id: str,
    module: str,
    inputs: dict,
    result: dict,
) -> AnalysisResult:
    """Upsert the latest inputs+result for (user, module)."""
    row = await db.scalar(
        select(AnalysisResult).where(
            AnalysisResult.user_id == user_id,
            AnalysisResult.module == module,
        )
    )
    if row is None:
        row = AnalysisResult(user_id=user_id, module=module)
        db.add(row)
    row.inputs = inputs
    row.result = result
    row.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(row)
    return row


async def delete_analysis(db: AsyncSession, user_id: str, module: str) -> bool:
    """Delete the saved result for (user, module). Returns True if a row was removed."""
    row = await db.scalar(
        select(AnalysisResult).where(
            AnalysisResult.user_id == user_id,
            AnalysisResult.module == module,
        )
    )
    if row is None:
        return False
    await db.delete(row)
    await db.commit()
    return True


async def get_analyses(db: AsyncSession, user_id: str) -> list[AnalysisResult]:
    """All saved analyses for a user, newest first."""
    rows = await db.scalars(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == user_id)
        .order_by(AnalysisResult.updated_at.desc())
    )
    return list(rows)


async def get_completed_modules(db: AsyncSession, user_id: str) -> set[str]:
    """Set of module names the user has a saved result for."""
    rows = await db.scalars(
        select(AnalysisResult.module).where(AnalysisResult.user_id == user_id)
    )
    return set(rows)
