"""Persistence helpers for cash-in-bank snapshots (live runway tracker)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import CashSnapshot


async def list_snapshots(db: AsyncSession, team_id: str, limit: int = 24) -> list[CashSnapshot]:
    """Most recent first."""
    rows = await db.scalars(
        select(CashSnapshot)
        .where(CashSnapshot.team_id == team_id)
        .order_by(CashSnapshot.recorded_at.desc())
        .limit(limit)
    )
    return list(rows)


async def get_snapshot(db: AsyncSession, team_id: str, snapshot_id: str) -> CashSnapshot | None:
    return await db.scalar(
        select(CashSnapshot).where(CashSnapshot.team_id == team_id, CashSnapshot.id == snapshot_id)
    )


async def create_snapshot(
    db: AsyncSession, team_id: str, created_by_user_id: str, data: dict
) -> CashSnapshot:
    snapshot = CashSnapshot(team_id=team_id, created_by_user_id=created_by_user_id, **data)
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def delete_snapshot(db: AsyncSession, snapshot: CashSnapshot) -> None:
    await db.delete(snapshot)
    await db.commit()
