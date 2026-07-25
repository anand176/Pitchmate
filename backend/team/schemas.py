"""Pydantic schemas for lightweight team-sharing (invites + members)."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

INVITE_EXPIRE_HOURS = 72


class TeamMember(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    is_you: bool = False


class TeamMembersResponse(BaseModel):
    team_id: str
    members: list[TeamMember]


class CreateInviteResponse(BaseModel):
    token: str
    invite_url: str
    expires_at: str


class InvitePreviewResponse(BaseModel):
    valid: bool
    invited_by_email: Optional[str] = None
    member_count: int = 0
    already_on_team: bool = False
    reason: Optional[str] = None


class AcceptInviteRequest(BaseModel):
    token: str


class AcceptInviteResponse(BaseModel):
    joined: bool
    team: TeamMembersResponse
