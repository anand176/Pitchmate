"""
Team router — lightweight cofounder sharing via invite links.

Endpoints:
  GET  /team/members            — everyone sharing your team_id
  POST /team/invites            — create a shareable invite link
  GET  /team/invites/{token}    — preview an invite before accepting (who invited you, how many members)
  POST /team/invites/accept     — join the inviter's team (switches your workspace)
"""

from __future__ import annotations

import logging
import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from db.base import get_db_session
from db.models import User
from team import store
from team.schemas import (
    AcceptInviteRequest,
    AcceptInviteResponse,
    CreateInviteResponse,
    InvitePreviewResponse,
    TeamMember,
    TeamMembersResponse,
)

logger = logging.getLogger("team_router")
router = APIRouter(prefix="/team", tags=["Team"])


def _frontend_url() -> str:
    return os.environ.get("FRONTEND_URL", "http://localhost:5173")


async def _members_response(db: AsyncSession, team_id: str, current_user_id: str) -> TeamMembersResponse:
    members = await store.list_members(db, team_id)
    return TeamMembersResponse(
        team_id=team_id,
        members=[
            TeamMember(id=m.id, email=m.email, full_name=m.full_name, is_you=(m.id == current_user_id))
            for m in members
        ],
    )


@router.get("/members", response_model=TeamMembersResponse)
async def get_members(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    return await _members_response(db, current_user["team_id"], current_user["id"])


@router.post("/invites", response_model=CreateInviteResponse, status_code=status.HTTP_201_CREATED)
async def create_invite(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    invite = await store.create_invite(db, current_user["team_id"], current_user["id"])
    logger.info("Created team invite for team %s", current_user["team_id"])
    return CreateInviteResponse(
        token=invite.token,
        invite_url=f"{_frontend_url()}/join?token={invite.token}",
        expires_at=invite.expires_at.isoformat(),
    )


@router.get("/invites/{token}", response_model=InvitePreviewResponse)
async def preview_invite(
    token: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    invite = await store.get_invite_by_token(db, token)
    if invite is None:
        return InvitePreviewResponse(valid=False, reason="This invite link doesn't exist.")
    if invite.team_id == current_user["team_id"]:
        members = await store.list_members(db, invite.team_id)
        return InvitePreviewResponse(valid=True, already_on_team=True, member_count=len(members))
    if not store.invite_is_usable(invite):
        reason = "This invite has already been used." if invite.accepted_at else "This invite link has expired."
        return InvitePreviewResponse(valid=False, reason=reason)

    inviter = await db.scalar(select(User).where(User.id == invite.created_by_user_id))
    members = await store.list_members(db, invite.team_id)
    return InvitePreviewResponse(
        valid=True,
        invited_by_email=inviter.email if inviter else None,
        member_count=len(members),
    )


@router.post("/invites/accept", response_model=AcceptInviteResponse)
async def accept_invite(
    body: AcceptInviteRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    invite = await store.get_invite_by_token(db, body.token)
    if invite is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found.")
    if invite.team_id == current_user["team_id"]:
        return AcceptInviteResponse(
            joined=False,
            team=await _members_response(db, current_user["team_id"], current_user["id"]),
        )
    if not store.invite_is_usable(invite):
        detail = "This invite has already been used." if invite.accepted_at else "This invite link has expired."
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    user = await db.scalar(select(User).where(User.id == current_user["id"]))
    await store.accept_invite(db, invite, user)
    logger.info("User %s joined team %s via invite", user.id, invite.team_id)
    return AcceptInviteResponse(joined=True, team=await _members_response(db, invite.team_id, user.id))
