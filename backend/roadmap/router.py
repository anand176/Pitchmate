"""
Roadmap router — team-shared kanban board of feature cards, columns are
dynamically computed quarters (see roadmap/schemas.py).

Endpoints:
  GET    /roadmap/columns         — column keys/labels + valid statuses/categories
  GET    /roadmap/items           — list all cards for the team
  POST   /roadmap/items           — create a card
  PUT    /roadmap/items/{id}      — edit title/description/category/status
  PUT    /roadmap/items/{id}/move — drag-and-drop: change quarter + position
  DELETE /roadmap/items/{id}      — remove a card
"""

from __future__ import annotations

import json
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from db.base import get_db_session
from db.models import RoadmapItem
from roadmap import store
from roadmap.schemas import (
    ROADMAP_CATEGORIES,
    ROADMAP_STATUSES,
    RoadmapColumnsResponse,
    RoadmapGenerateRequest,
    RoadmapGenerateResponse,
    RoadmapItemCreate,
    RoadmapItemResponse,
    RoadmapItemUpdate,
    RoadmapMoveRequest,
    RoadmapSuggestedItem,
    compute_roadmap_columns,
    valid_quarter_keys,
)

logger = logging.getLogger("roadmap_router")
router = APIRouter(prefix="/roadmap", tags=["Roadmap"])


def _to_response(item: RoadmapItem) -> RoadmapItemResponse:
    return RoadmapItemResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        category=item.category,
        quarter=item.quarter,
        status=item.status,
        position=item.position,
        created_by_user_id=item.created_by_user_id,
        created_at=item.created_at.isoformat() if item.created_at else None,
        updated_at=item.updated_at.isoformat() if item.updated_at else None,
    )


def _validate_quarter(quarter: str) -> None:
    if quarter not in valid_quarter_keys():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid quarter column.")


def _validate_status(item_status: str | None) -> None:
    if item_status is not None and item_status not in ROADMAP_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {', '.join(ROADMAP_STATUSES)}",
        )


@router.get("/columns", response_model=RoadmapColumnsResponse)
async def get_columns(current_user: Annotated[dict, Depends(get_current_user)]):
    return RoadmapColumnsResponse(columns=compute_roadmap_columns())


@router.post("/generate", response_model=RoadmapGenerateResponse)
async def generate_items(
    body: RoadmapGenerateRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """
    AI-suggest roadmap cards from the team's startup profile + saved analyses
    (GTM plan, market validation) + what's already on the board, so suggestions
    don't duplicate existing cards. Returns suggestions only — nothing is
    persisted until the founder picks which ones to add via POST /roadmap/items.
    """
    from dashboard.router import _structured_completion
    from dashboard.store import get_analyses
    from startup.router import get_profile_for_user, profile_to_markdown

    try:
        profile = await get_profile_for_user(db, current_user["team_id"])
        profile_md = profile_to_markdown(profile) or "No startup profile filled in yet."

        analyses = {row.module: row.result for row in await get_analyses(db, current_user["id"])}
        context_bits = []
        if analyses.get("gtm"):
            context_bits.append(f"## Existing GTM plan\n{json.dumps(analyses['gtm'])[:1500]}")
        if analyses.get("market"):
            context_bits.append(f"## Market validation notes\n{json.dumps(analyses['market'])[:1000]}")

        existing = await store.list_items(db, current_user["team_id"])
        if existing:
            titles = "; ".join(i.title for i in existing[:40])
            context_bits.append(f"## Already on the roadmap (do NOT repeat these)\n{titles}")

        count = max(3, min(body.count or 6, 10))
        quarters = [c["key"] for c in compute_roadmap_columns()]
        instructions = (
            "You are a product/startup advisor building a roadmap for a founder. Given the startup profile "
            f"and context below, propose exactly {count} concrete, actionable roadmap cards (features, GTM "
            "motions, fundraising milestones, hiring, or infra work) that make sense as *next steps* for this "
            "specific startup at its current stage — not generic advice.\n\n"
            f"{profile_md}\n\n" + "\n\n".join(context_bits) + "\n\n"
            f"Each card needs: a short punchy title (<=8 words), a 1-2 sentence description, a category "
            f"(one of {ROADMAP_CATEGORIES}), and a quarter column key (one of {quarters} — 'backlog' for "
            "not-yet-scheduled ideas, a 'YYYY-Qn' key to commit to a specific quarter, 'later' for longer-term "
            "bets). Spread cards sensibly across quarters rather than dumping them all in one column."
        )
        if body.focus:
            instructions += f"\n\nFounder's steer: {body.focus.strip()}"

        class _Suggestions(BaseModel):
            items: list[RoadmapSuggestedItem]

        result = await _structured_completion(
            instructions, _Suggestions, "roadmap_generate_agent", endpoint="roadmap_generate"
        )
        valid_quarters = set(quarters)
        cleaned = []
        for item in result.items[:count]:
            if not item.title.strip():
                continue
            if item.quarter not in valid_quarters:
                item.quarter = "backlog"
            if item.category not in ROADMAP_CATEGORIES:
                item.category = "Feature"
            cleaned.append(item)
        return RoadmapGenerateResponse(items=cleaned)
    except Exception as exc:
        logger.error("Roadmap AI generation failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not generate roadmap suggestions: {exc}",
        )


@router.get("/items", response_model=list[RoadmapItemResponse])
async def list_items(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    rows = await store.list_items(db, current_user["team_id"])
    return [_to_response(r) for r in rows]


@router.post("/items", response_model=RoadmapItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    body: RoadmapItemCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    if not body.title.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required.")
    _validate_quarter(body.quarter)
    _validate_status(body.status)
    data = body.model_dump()
    data["title"] = data["title"].strip()
    item = await store.create_item(db, current_user["team_id"], current_user["id"], data)
    logger.info("Created roadmap item %s for team %s", item.id, current_user["team_id"])
    return _to_response(item)


@router.put("/items/{item_id}", response_model=RoadmapItemResponse)
async def update_item(
    item_id: str,
    body: RoadmapItemUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    item = await store.get_item(db, current_user["team_id"], item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found.")
    _validate_status(body.status)
    data = body.model_dump(exclude_unset=True)
    if "title" in data and not (data["title"] or "").strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title cannot be empty.")
    item = await store.update_item(db, item, data)
    return _to_response(item)


@router.put("/items/{item_id}/move", response_model=RoadmapItemResponse)
async def move_item(
    item_id: str,
    body: RoadmapMoveRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    item = await store.get_item(db, current_user["team_id"], item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found.")
    _validate_quarter(body.quarter)
    item = await store.move_item(db, item, body.quarter, body.position)
    return _to_response(item)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    item = await store.get_item(db, current_user["team_id"], item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found.")
    await store.delete_item(db, item)
