"""
Fundraise pipeline router — investor CRM tracking with stages, warmth, and a
funnel summary for the dashboard "Pipeline" tab.

Endpoints:
  GET  /pipeline/round             — get (or create) the active fundraise round
  PUT  /pipeline/round             — update round fields (name, target, stage, status)
  GET  /pipeline/investors         — list all investor contacts for the user
  POST /pipeline/investors         — add an investor contact
  PUT  /pipeline/investors/{id}    — update an investor contact (e.g. move stage)
  DELETE /pipeline/investors/{id}  — remove an investor contact
  GET  /pipeline/summary           — round + investors + funnel counts (one call for the tab)
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from db.base import get_db_session
from db.models import FundraiseRound, InvestorContact
from pipeline import store
from pipeline.schemas import (
    FUNNEL_STAGES,
    PIPELINE_STAGES,
    STAGE_LABELS,
    WARMTH_LEVELS,
    FundraiseRoundResponse,
    FundraiseRoundUpdate,
    FunnelStageCount,
    InvestorContactCreate,
    InvestorContactResponse,
    InvestorContactUpdate,
    PipelineSummaryResponse,
)

logger = logging.getLogger("pipeline_router")
router = APIRouter(prefix="/pipeline", tags=["Pipeline"])


def _round_to_response(round_: FundraiseRound) -> FundraiseRoundResponse:
    return FundraiseRoundResponse(
        id=round_.id,
        name=round_.name,
        target_amount=round_.target_amount,
        amount_committed=round_.amount_committed,
        stage=round_.stage,
        status=round_.status,
        updated_at=round_.updated_at.isoformat() if round_.updated_at else None,
    )


def _investor_to_response(contact: InvestorContact) -> InvestorContactResponse:
    return InvestorContactResponse(
        id=contact.id,
        round_id=contact.round_id,
        name=contact.name,
        firm=contact.firm,
        investor_type=contact.investor_type,
        email=contact.email,
        linkedin_url=contact.linkedin_url,
        pipeline_stage=contact.pipeline_stage,
        warmth=contact.warmth,
        ask_amount=contact.ask_amount,
        last_contact_at=contact.last_contact_at.isoformat() if contact.last_contact_at else None,
        next_action=contact.next_action,
        next_action_date=contact.next_action_date.isoformat() if contact.next_action_date else None,
        notes=contact.notes,
        created_at=contact.created_at.isoformat() if contact.created_at else None,
        updated_at=contact.updated_at.isoformat() if contact.updated_at else None,
    )


def _validate_stage(stage: str | None) -> None:
    if stage is not None and stage not in PIPELINE_STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid pipeline_stage. Allowed: {', '.join(PIPELINE_STAGES)}",
        )


def _validate_warmth(warmth: str | None) -> None:
    if warmth is not None and warmth not in WARMTH_LEVELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid warmth. Allowed: {', '.join(WARMTH_LEVELS)}",
        )


def _build_funnel(investors: list[InvestorContact]) -> list[FunnelStageCount]:
    counts = {s: 0 for s in PIPELINE_STAGES}
    for c in investors:
        if c.pipeline_stage in counts:
            counts[c.pipeline_stage] += 1
    return [
        FunnelStageCount(stage=s, label=STAGE_LABELS[s], count=counts[s])
        for s in FUNNEL_STAGES
    ]


# ─── Round ────────────────────────────────────────────────────────────────────

@router.get("/round", response_model=FundraiseRoundResponse)
async def get_round(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    round_ = await store.get_or_create_active_round(db, current_user["team_id"], current_user["id"])
    return _round_to_response(round_)


@router.put("/round", response_model=FundraiseRoundResponse)
async def update_round(
    body: FundraiseRoundUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    round_ = await store.get_or_create_active_round(db, current_user["team_id"], current_user["id"])
    data = body.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in ("active", "closed"):
        raise HTTPException(status_code=400, detail="status must be 'active' or 'closed'.")
    round_ = await store.update_round(db, round_, data)
    return _round_to_response(round_)


# ─── Investors ────────────────────────────────────────────────────────────────

@router.get("/investors", response_model=list[InvestorContactResponse])
async def list_investors(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    rows = await store.list_investors(db, current_user["team_id"])
    return [_investor_to_response(r) for r in rows]


@router.post("/investors", response_model=InvestorContactResponse, status_code=status.HTTP_201_CREATED)
async def create_investor(
    body: InvestorContactCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    _validate_stage(body.pipeline_stage)
    _validate_warmth(body.warmth)
    round_ = await store.get_or_create_active_round(db, current_user["team_id"], current_user["id"])
    data = body.model_dump(exclude_unset=True)
    contact = await store.create_investor(db, current_user["team_id"], current_user["id"], round_.id, data)
    logger.info("Created investor contact %s for team %s", contact.id, current_user["team_id"])
    return _investor_to_response(contact)


@router.put("/investors/{investor_id}", response_model=InvestorContactResponse)
async def update_investor(
    investor_id: str,
    body: InvestorContactUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    contact = await store.get_investor(db, current_user["team_id"], investor_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor not found.")
    _validate_stage(body.pipeline_stage)
    _validate_warmth(body.warmth)
    data = body.model_dump(exclude_unset=True)
    contact = await store.update_investor(db, contact, data)
    return _investor_to_response(contact)


@router.delete("/investors/{investor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_investor(
    investor_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    contact = await store.get_investor(db, current_user["team_id"], investor_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor not found.")
    await store.delete_investor(db, contact)


# ─── Summary ──────────────────────────────────────────────────────────────────

@router.get("/summary", response_model=PipelineSummaryResponse)
async def get_summary(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    round_ = await store.get_or_create_active_round(db, current_user["team_id"], current_user["id"])
    investors = await store.list_investors(db, current_user["team_id"])
    return PipelineSummaryResponse(
        round=_round_to_response(round_),
        investors=[_investor_to_response(c) for c in investors],
        funnel=_build_funnel(investors),
        total_active=sum(1 for c in investors if not c.pipeline_stage.startswith("closed_")),
        hot_count=sum(1 for c in investors if c.warmth == "hot"),
        closed_won_count=sum(1 for c in investors if c.pipeline_stage == "closed_won"),
        closed_lost_count=sum(1 for c in investors if c.pipeline_stage == "closed_lost"),
    )
