"""
Startup profile router — persistent user-scoped profile + readiness score.

Endpoints:
  GET  /startup/profile     — fetch (or empty defaults)
  PUT  /startup/profile     — upsert partial fields
  GET  /startup/readiness   — progress / next action
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from db.base import get_db_session
from db.models import StartupProfile
from startup.schemas import (
    LIFECYCLE_STAGES,
    ReadinessMilestone,
    ReadinessResponse,
    StartupProfileResponse,
    StartupProfileUpdate,
)

logger = logging.getLogger("startup_router")
router = APIRouter(prefix="/startup", tags=["Startup"])

CORE_FIELDS = ("company_name", "problem", "solution", "lifecycle_stage")


def _is_filled(value: Optional[str]) -> bool:
    return bool(value and str(value).strip())


def profile_is_complete(profile: StartupProfile | None) -> bool:
    if profile is None:
        return False
    return all(_is_filled(getattr(profile, f, None)) for f in CORE_FIELDS)


def profile_to_markdown(profile: StartupProfile | None) -> str:
    """Compact summary injected into agent queries."""
    if profile is None or not any(
        _is_filled(getattr(profile, f, None))
        for f in (*CORE_FIELDS, "one_liner", "product_description", "industry")
    ):
        return ""

    lines = ["## Startup Profile"]
    if _is_filled(profile.company_name):
        lines.append(f"**Company:** {profile.company_name.strip()}")
    if _is_filled(profile.one_liner):
        lines.append(f"**One-liner:** {profile.one_liner.strip()}")
    if _is_filled(profile.lifecycle_stage):
        lines.append(f"**Stage:** {profile.lifecycle_stage.strip()}")
    if _is_filled(profile.industry):
        lines.append(f"**Industry:** {profile.industry.strip()}")
    if _is_filled(profile.problem):
        lines.append(f"**Problem:** {profile.problem.strip()}")
    if _is_filled(profile.solution):
        lines.append(f"**Solution:** {profile.solution.strip()}")
    if _is_filled(profile.product_description):
        lines.append(f"**Product / architecture:** {profile.product_description.strip()}")
    if profile.is_actively_raising:
        lines.append("**Actively raising:** yes")
    if _is_filled(profile.target_raise):
        lines.append(f"**Target raise:** {profile.target_raise.strip()}")
    if _is_filled(profile.amount_raised):
        lines.append(f"**Amount raised:** {profile.amount_raised.strip()}")
    if profile.investor_count is not None:
        lines.append(f"**Investors:** {profile.investor_count}")
    if _is_filled(profile.investor_notes):
        lines.append(f"**Investor notes:** {profile.investor_notes.strip()}")
    return "\n".join(lines)


def compute_readiness(
    profile: StartupProfile | None,
    completed_modules: set[str] | None = None,
) -> ReadinessResponse:
    """
    Lifecycle / setup progress plus dashboard-module completion.

    Weights (sum 100):
      core profile 30 · product narrative 15 · raising/funding detail 10
      deck upload 10 · architecture upload 5 · market 10 · investors 10 · deck drafted 10

    `completed_modules` is the set of dashboard modules the user has a saved
    analysis for (from analysis_results); market/investors/deck milestones flip
    to done once their module has been run at least once.
    """
    p = profile
    done_modules = completed_modules or set()
    core_done = profile_is_complete(p)
    product_done = bool(
        p
        and (
            _is_filled(p.product_description)
            or p.has_deck_upload
            or p.has_architecture_upload
            or _is_filled(p.architecture_image_name)
        )
    )
    funding_done = bool(
        p
        and (
            p.is_actively_raising
            or _is_filled(p.target_raise)
            or _is_filled(p.amount_raised)
            or (p.investor_count is not None and p.investor_count > 0)
            or (p.lifecycle_stage or "")
            in ("raising", "angel_backed", "seed_closed", "series_a_plus")
        )
    )
    deck_done = bool(p and p.has_deck_upload)
    arch_done = bool(p and (p.has_architecture_upload or _is_filled(p.architecture_image_name)))
    market_done = "market" in done_modules
    investors_done = "investors" in done_modules
    deck_drafted = "deck" in done_modules

    milestones = [
        ReadinessMilestone(id="profile", label="Startup profile", done=core_done, weight=30),
        ReadinessMilestone(id="product", label="Product / architecture", done=product_done, weight=15),
        ReadinessMilestone(id="funding", label="Funding progress", done=funding_done, weight=10),
        ReadinessMilestone(id="deck_doc", label="Deck uploaded", done=deck_done, weight=10),
        ReadinessMilestone(id="architecture", label="Architecture asset", done=arch_done, weight=5),
        ReadinessMilestone(id="market", label="Market validated", done=market_done, weight=10),
        ReadinessMilestone(id="investors", label="Investor targeting", done=investors_done, weight=10),
        ReadinessMilestone(id="deck_export", label="Deck drafted", done=deck_drafted, weight=10),
    ]
    for m in milestones:
        m.percent = m.weight if m.done else 0

    overall = sum(m.percent for m in milestones)

    if not core_done:
        next_action = "Complete your startup profile (name, problem, solution, stage)"
        next_path = "/onboarding"
    elif not product_done:
        next_action = "Describe your product or upload a deck / architecture doc"
        next_path = "/settings"
    elif not funding_done and (p and (p.lifecycle_stage or "") in ("raising", "angel_backed", "seed_closed")):
        next_action = "Update your funding progress (raise target, investors)"
        next_path = "/settings"
    elif not market_done:
        next_action = "Validate your market sizing (TAM / SAM / SOM)"
        next_path = "/market"
    elif not investors_done:
        next_action = "Map your investor targeting strategy"
        next_path = "/investors"
    elif not deck_drafted:
        next_action = "Draft your pitch deck sections"
        next_path = "/deck"
    else:
        next_action = "Refine your deck and rehearse with the AI co-pilot"
        next_path = "/deck"

    return ReadinessResponse(
        overall_percent=overall,
        profile_complete=core_done,
        milestones=milestones,
        next_action=next_action,
        next_action_path=next_path,
    )


def _to_response(profile: StartupProfile | None) -> StartupProfileResponse:
    if profile is None:
        return StartupProfileResponse()
    return StartupProfileResponse(
        id=profile.id,
        company_name=profile.company_name,
        one_liner=profile.one_liner,
        lifecycle_stage=profile.lifecycle_stage,
        industry=profile.industry,
        problem=profile.problem,
        solution=profile.solution,
        product_description=profile.product_description,
        is_actively_raising=bool(profile.is_actively_raising),
        target_raise=profile.target_raise,
        amount_raised=profile.amount_raised,
        investor_count=profile.investor_count,
        investor_notes=profile.investor_notes,
        has_deck_upload=bool(profile.has_deck_upload),
        has_architecture_upload=bool(profile.has_architecture_upload),
        architecture_image_name=profile.architecture_image_name,
        wizard_completed=bool(profile.wizard_completed),
        onboarding_dismissed=bool(profile.onboarding_dismissed),
        profile_complete=profile_is_complete(profile),
        updated_at=profile.updated_at.isoformat() if profile.updated_at else None,
    )


async def _get_or_none(db: AsyncSession, team_id: str) -> StartupProfile | None:
    """One profile per *team* — shared across cofounders (see db/models.py User.team_id)."""
    return await db.scalar(select(StartupProfile).where(StartupProfile.team_id == team_id))


async def get_profile_for_user(db: AsyncSession, team_id: str) -> StartupProfile | None:
    """Shared helper for other routers (e.g. agent context injection)."""
    return await _get_or_none(db, team_id)


@router.get("/profile", response_model=StartupProfileResponse)
async def get_profile(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    profile = await _get_or_none(db, current_user["team_id"])
    return _to_response(profile)


@router.put("/profile", response_model=StartupProfileResponse)
async def upsert_profile(
    body: StartupProfileUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    if body.lifecycle_stage is not None and body.lifecycle_stage.strip():
        stage = body.lifecycle_stage.strip().lower().replace(" ", "_").replace("-", "_")
        if stage not in LIFECYCLE_STAGES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid lifecycle_stage. Allowed: {', '.join(LIFECYCLE_STAGES)}",
            )
        body.lifecycle_stage = stage

    profile = await _get_or_none(db, current_user["team_id"])
    if profile is None:
        profile = StartupProfile(user_id=current_user["id"], team_id=current_user["team_id"])
        db.add(profile)

    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip() or None
        setattr(profile, key, value)

    if body.wizard_completed is True:
        profile.wizard_completed = True
    elif profile_is_complete(profile) and body.wizard_completed is not False:
        # Completing core fields during onboarding finishes the wizard
        if body.product_description is not None or body.has_deck_upload or body.has_architecture_upload:
            profile.wizard_completed = True

    profile.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(profile)
    logger.info(
        "Upserted startup profile for user %s (complete=%s)",
        current_user["id"],
        profile_is_complete(profile),
    )
    return _to_response(profile)


@router.get("/readiness", response_model=ReadinessResponse)
async def get_readiness(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    from dashboard.store import get_completed_modules

    profile = await _get_or_none(db, current_user["team_id"])
    completed = await get_completed_modules(db, current_user["id"])
    return compute_readiness(profile, completed)
