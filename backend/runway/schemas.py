"""Pydantic schemas + money formatting for the live runway tracker."""

from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel


def parse_money(text: str | None) -> float | None:
    """Parse '$1.2M', '400k', '1,200' -> float dollars. None if unparseable."""
    if not text:
        return None
    m = re.search(r"\$?\s*([\d,\.]+)\s*([bmk]?)", str(text).strip(), re.IGNORECASE)
    if not m:
        return None
    try:
        raw = float(m.group(1).replace(",", ""))
    except ValueError:
        return None
    mult = {"b": 1e9, "m": 1e6, "k": 1e3, "": 1.0}.get(m.group(2).lower(), 1.0)
    return raw * mult


def format_money(value: float | None) -> str:
    if value is None:
        return "n/a"
    sign = "-" if value < 0 else ""
    value = abs(value)
    if value >= 1e9:
        return f"{sign}${value / 1e9:.1f}B"
    if value >= 1e6:
        return f"{sign}${value / 1e6:.1f}M"
    if value >= 1e3:
        return f"{sign}${value / 1e3:.0f}K"
    return f"{sign}${value:,.0f}"


class CashSnapshotCreate(BaseModel):
    cash_in_bank: str
    recorded_at: Optional[str] = None  # ISO date/datetime string; defaults to now
    note: Optional[str] = None


class CashSnapshotResponse(BaseModel):
    id: str
    cash_in_bank: float
    cash_in_bank_formatted: str
    recorded_at: str
    note: Optional[str] = None
    created_by_user_id: str
    created_at: Optional[str] = None


class RunwaySummaryResponse(BaseModel):
    has_data: bool
    latest_cash: Optional[float] = None
    latest_cash_formatted: str = "n/a"
    latest_recorded_at: Optional[str] = None
    monthly_burn: Optional[float] = None
    monthly_burn_formatted: str = "n/a"
    runway_months: Optional[float] = None
    burn_source: str = "none"  # "trend" | "finance_module" | "none"
    message: Optional[str] = None
    trend: list[CashSnapshotResponse] = []
