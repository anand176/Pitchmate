"""Pydantic schemas for the fundraise pipeline (investor CRM) feature."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

# Ordered pipeline stages — order matters for the funnel diagram (widest → narrowest).
PIPELINE_STAGES: list[str] = [
    "research",
    "outreach",
    "meeting_scheduled",
    "pitched",
    "due_diligence",
    "term_sheet",
    "closed_won",
    "closed_lost",
]

STAGE_LABELS: dict[str, str] = {
    "research": "Research",
    "outreach": "Outreach",
    "meeting_scheduled": "Meeting scheduled",
    "pitched": "Pitched",
    "due_diligence": "Due diligence",
    "term_sheet": "Term sheet",
    "closed_won": "Closed (won)",
    "closed_lost": "Closed (lost)",
}

# Stages counted in the "active" funnel (excludes terminal closed states).
FUNNEL_STAGES: list[str] = [s for s in PIPELINE_STAGES if not s.startswith("closed_")]

WARMTH_LEVELS: list[str] = ["cold", "warm", "hot"]


# ─── Fundraise round ──────────────────────────────────────────────────────────

class FundraiseRoundUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[str] = None
    amount_committed: Optional[str] = None
    stage: Optional[str] = None
    status: Optional[str] = None


class FundraiseRoundResponse(BaseModel):
    id: str
    name: str
    target_amount: Optional[str] = None
    amount_committed: Optional[str] = None
    stage: str
    status: str
    updated_at: Optional[str] = None


# ─── Investor contacts ────────────────────────────────────────────────────────

class InvestorContactCreate(BaseModel):
    name: str = Field(..., description="Investor or firm name.")
    firm: Optional[str] = None
    investor_type: Optional[str] = Field(None, description='e.g. "angel", "seed VC", "Series A VC".')
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    pipeline_stage: str = Field("research", description=f"One of {PIPELINE_STAGES}.")
    warmth: str = Field("cold", description=f"One of {WARMTH_LEVELS}.")
    ask_amount: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None
    notes: Optional[str] = None


class InvestorContactUpdate(BaseModel):
    name: Optional[str] = None
    firm: Optional[str] = None
    investor_type: Optional[str] = None
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    pipeline_stage: Optional[str] = None
    warmth: Optional[str] = None
    ask_amount: Optional[str] = None
    last_contact_at: Optional[datetime] = None
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None
    notes: Optional[str] = None


class InvestorContactResponse(BaseModel):
    id: str
    round_id: Optional[str] = None
    name: str
    firm: Optional[str] = None
    investor_type: Optional[str] = None
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    pipeline_stage: str
    warmth: str
    ask_amount: Optional[str] = None
    last_contact_at: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ─── Summary / funnel ─────────────────────────────────────────────────────────

class FunnelStageCount(BaseModel):
    stage: str
    label: str
    count: int


class PipelineSummaryResponse(BaseModel):
    round: FundraiseRoundResponse
    investors: list[InvestorContactResponse] = Field(default_factory=list)
    funnel: list[FunnelStageCount] = Field(default_factory=list)
    total_active: int = 0
    hot_count: int = 0
    closed_won_count: int = 0
    closed_lost_count: int = 0
