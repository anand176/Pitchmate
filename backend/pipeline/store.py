"""Persistence helpers for the fundraise pipeline (round + investor contacts).

Scoped by team_id (not user_id) so cofounders share one pipeline — see
db/models.py User.team_id. `user_id`/`created_by_user_id` params are still
recorded on rows for attribution, but never used to filter queries.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import FundraiseRound, InvestorContact


async def get_or_create_active_round(db: AsyncSession, team_id: str, created_by_user_id: str) -> FundraiseRound:
    """Most teams have exactly one active round — create a default one on first use."""
    round_ = await db.scalar(
        select(FundraiseRound)
        .where(FundraiseRound.team_id == team_id, FundraiseRound.status == "active")
        .order_by(FundraiseRound.created_at.desc())
    )
    if round_ is None:
        round_ = FundraiseRound(
            user_id=created_by_user_id, team_id=team_id, name="Fundraise", stage="seed", status="active"
        )
        db.add(round_)
        await db.commit()
        await db.refresh(round_)
    return round_


async def update_round(db: AsyncSession, round_: FundraiseRound, data: dict) -> FundraiseRound:
    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip() or None
        setattr(round_, key, value)
    round_.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(round_)
    return round_


async def list_investors(db: AsyncSession, team_id: str) -> list[InvestorContact]:
    rows = await db.scalars(
        select(InvestorContact)
        .where(InvestorContact.team_id == team_id)
        .order_by(InvestorContact.updated_at.desc())
    )
    return list(rows)


async def get_investor(db: AsyncSession, team_id: str, investor_id: str) -> InvestorContact | None:
    return await db.scalar(
        select(InvestorContact).where(
            InvestorContact.team_id == team_id, InvestorContact.id == investor_id
        )
    )


async def create_investor(
    db: AsyncSession, team_id: str, created_by_user_id: str, round_id: str | None, data: dict
) -> InvestorContact:
    contact = InvestorContact(user_id=created_by_user_id, team_id=team_id, round_id=round_id, **data)
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


async def update_investor(
    db: AsyncSession, contact: InvestorContact, data: dict
) -> InvestorContact:
    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip() or None
        setattr(contact, key, value)
    contact.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(contact)
    return contact


async def delete_investor(db: AsyncSession, contact: InvestorContact) -> None:
    await db.delete(contact)
    await db.commit()
