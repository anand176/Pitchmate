"""Persistence helpers for team invites and membership."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import TeamInvite, User
from team.schemas import INVITE_EXPIRE_HOURS


async def list_members(db: AsyncSession, team_id: str) -> list[User]:
    rows = await db.scalars(select(User).where(User.team_id == team_id).order_by(User.created_at.asc()))
    return list(rows)


async def create_invite(db: AsyncSession, team_id: str, created_by_user_id: str) -> TeamInvite:
    invite = TeamInvite(
        team_id=team_id,
        token=secrets.token_urlsafe(24),
        created_by_user_id=created_by_user_id,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=INVITE_EXPIRE_HOURS),
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite


async def get_invite_by_token(db: AsyncSession, token: str) -> TeamInvite | None:
    return await db.scalar(select(TeamInvite).where(TeamInvite.token == token))


def invite_is_usable(invite: TeamInvite) -> bool:
    if invite.accepted_at is not None:
        return False
    expires_at = invite.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at > datetime.now(timezone.utc)


async def accept_invite(db: AsyncSession, invite: TeamInvite, user: User) -> None:
    """Move `user` onto the inviter's team and mark the invite consumed."""
    user.team_id = invite.team_id
    invite.accepted_at = datetime.now(timezone.utc)
    invite.accepted_by_user_id = user.id
    await db.commit()
