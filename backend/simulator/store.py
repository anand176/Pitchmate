"""Persistence helpers for PracticeSession (call-practice history)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import PracticeSession


async def create_session(
    db: AsyncSession,
    team_id: str,
    created_by_user_id: str,
    *,
    scenario_id: str,
    scenario_label: str,
    overall_score: int | None,
    summary: str | None,
    transcript: list[dict],
) -> PracticeSession:
    row = PracticeSession(
        team_id=team_id,
        created_by_user_id=created_by_user_id,
        scenario_id=scenario_id,
        scenario_label=scenario_label,
        overall_score=overall_score,
        summary=summary,
        transcript=transcript,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def list_sessions(db: AsyncSession, team_id: str, limit: int = 20) -> list[PracticeSession]:
    rows = await db.scalars(
        select(PracticeSession)
        .where(PracticeSession.team_id == team_id)
        .order_by(PracticeSession.created_at.desc())
        .limit(limit)
    )
    return list(rows)
