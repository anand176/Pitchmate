"""
Runway router — team-shared cash-in-bank history with a live-computed burn
rate and runway, so the number updates automatically as the team logs new
balances instead of requiring a fresh manual form submission every time.

Endpoints:
  GET    /runway/snapshots  — cash-in-bank history, most recent first
  POST   /runway/snapshots  — log a new balance reading
  DELETE /runway/snapshots/{id}
  GET    /runway/summary    — latest cash, derived monthly burn, runway (months)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from db.base import get_db_session
from db.models import AnalysisResult, CashSnapshot
from runway import store
from runway.schemas import (
    CashSnapshotCreate,
    CashSnapshotResponse,
    RunwaySummaryResponse,
    format_money,
    parse_money,
)

logger = logging.getLogger("runway_router")
router = APIRouter(prefix="/runway", tags=["Runway"])

# Below this many days between two snapshots, treat the burn calc as too noisy
# to trust (e.g. two entries logged minutes apart) and fall back gracefully.
MIN_DAYS_BETWEEN_SNAPSHOTS = 3
DAYS_PER_MONTH = 30.44


def _parse_recorded_at(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid recorded_at date.")
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _to_response(snap: CashSnapshot) -> CashSnapshotResponse:
    return CashSnapshotResponse(
        id=snap.id,
        cash_in_bank=snap.cash_in_bank,
        cash_in_bank_formatted=format_money(snap.cash_in_bank),
        recorded_at=snap.recorded_at.isoformat(),
        note=snap.note,
        created_by_user_id=snap.created_by_user_id,
        created_at=snap.created_at.isoformat() if snap.created_at else None,
    )


@router.get("/snapshots", response_model=list[CashSnapshotResponse])
async def list_snapshots(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    rows = await store.list_snapshots(db, current_user["team_id"])
    return [_to_response(r) for r in rows]


@router.post("/snapshots", response_model=CashSnapshotResponse, status_code=status.HTTP_201_CREATED)
async def create_snapshot(
    body: CashSnapshotCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    cash = parse_money(body.cash_in_bank)
    if cash is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not parse cash_in_bank amount.")
    data = {
        "cash_in_bank": cash,
        "recorded_at": _parse_recorded_at(body.recorded_at),
        "note": (body.note or "").strip() or None,
    }
    snapshot = await store.create_snapshot(db, current_user["team_id"], current_user["id"], data)
    logger.info("Logged cash snapshot for team %s: %s", current_user["team_id"], format_money(cash))
    return _to_response(snapshot)


@router.delete("/snapshots/{snapshot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_snapshot(
    snapshot_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    snapshot = await store.get_snapshot(db, current_user["team_id"], snapshot_id)
    if snapshot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found.")
    await store.delete_snapshot(db, snapshot)


@router.get("/summary", response_model=RunwaySummaryResponse)
async def get_summary(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    snapshots = await store.list_snapshots(db, current_user["team_id"])
    if not snapshots:
        return RunwaySummaryResponse(has_data=False, message="Log your first cash balance to start tracking runway.")

    latest = snapshots[0]
    trend = [_to_response(s) for s in snapshots]

    monthly_burn: float | None = None
    burn_source = "none"
    message: str | None = None

    if len(snapshots) >= 2:
        previous = snapshots[1]
        days = (latest.recorded_at - previous.recorded_at).total_seconds() / 86400
        if days >= MIN_DAYS_BETWEEN_SNAPSHOTS:
            delta = previous.cash_in_bank - latest.cash_in_bank
            months = days / DAYS_PER_MONTH
            if delta > 0:
                monthly_burn = delta / months
                burn_source = "trend"
            else:
                burn_source = "trend"
                message = "Cash is flat or growing since your last entry — no burn detected. Nice problem to have."
        else:
            message = f"Log another balance at least {MIN_DAYS_BETWEEN_SNAPSHOTS} days apart to compute a trend-based burn rate."

    if monthly_burn is None and burn_source != "trend":
        # Fall back to whatever the founder last typed into the Financials
        # narrative form — best-effort only, and per-user (not team-shared).
        finance_row = await db.scalar(
            select(AnalysisResult).where(
                AnalysisResult.user_id == current_user["id"], AnalysisResult.module == "finance"
            )
        )
        if finance_row and finance_row.inputs.get("monthly_burn"):
            parsed = parse_money(finance_row.inputs["monthly_burn"])
            if parsed:
                monthly_burn = parsed
                burn_source = "finance_module"
                message = None

    runway_months = None
    if monthly_burn and monthly_burn > 0:
        runway_months = round(latest.cash_in_bank / monthly_burn, 1)

    if message is None and runway_months is None and burn_source == "none":
        message = "Log a second balance (a week or more apart) or fill in Monthly burn on the Financials tab to compute runway."

    return RunwaySummaryResponse(
        has_data=True,
        latest_cash=latest.cash_in_bank,
        latest_cash_formatted=format_money(latest.cash_in_bank),
        latest_recorded_at=latest.recorded_at.isoformat(),
        monthly_burn=monthly_burn,
        monthly_burn_formatted=format_money(monthly_burn),
        runway_months=runway_months,
        burn_source=burn_source,
        message=message,
        trend=trend,
    )
