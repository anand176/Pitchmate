"""Persistence helpers for the team roadmap board."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import RoadmapItem


async def list_items(db: AsyncSession, team_id: str) -> list[RoadmapItem]:
    rows = await db.scalars(
        select(RoadmapItem).where(RoadmapItem.team_id == team_id).order_by(RoadmapItem.position.asc())
    )
    return list(rows)


async def get_item(db: AsyncSession, team_id: str, item_id: str) -> RoadmapItem | None:
    return await db.scalar(
        select(RoadmapItem).where(RoadmapItem.team_id == team_id, RoadmapItem.id == item_id)
    )


async def _next_position(db: AsyncSession, team_id: str, quarter: str) -> int:
    max_pos = await db.scalar(
        select(func.max(RoadmapItem.position)).where(
            RoadmapItem.team_id == team_id, RoadmapItem.quarter == quarter
        )
    )
    return (max_pos or 0) + 1


async def create_item(db: AsyncSession, team_id: str, created_by_user_id: str, data: dict) -> RoadmapItem:
    quarter = data.get("quarter", "backlog")
    position = await _next_position(db, team_id, quarter)
    item = RoadmapItem(team_id=team_id, created_by_user_id=created_by_user_id, position=position, **data)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def update_item(db: AsyncSession, item: RoadmapItem, data: dict) -> RoadmapItem:
    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip() or None
        setattr(item, key, value)
    item.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(item)
    return item


async def move_item(db: AsyncSession, item: RoadmapItem, quarter: str, position: int) -> RoadmapItem:
    item.quarter = quarter
    item.position = position
    item.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(item)
    return item


async def delete_item(db: AsyncSession, item: RoadmapItem) -> None:
    await db.delete(item)
    await db.commit()
