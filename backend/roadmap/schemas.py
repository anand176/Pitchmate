"""
Pydantic schemas + quarter-column logic for the roadmap board.

Columns are computed dynamically from "today" (Backlog, current quarter, the
next 3 quarters, Later) rather than hardcoded, so the board never goes stale.
Both the API and the frontend call GET /roadmap/columns as the single source
of truth instead of duplicating this date math in JS.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field

ROADMAP_STATUSES = ["planned", "in_progress", "shipped"]
ROADMAP_CATEGORIES = ["Feature", "Infra", "Growth", "Fundraising", "Ops", "Hiring"]


def _quarter_key(dt: datetime) -> str:
    q = (dt.month - 1) // 3 + 1
    return f"{dt.year}-Q{q}"


def _quarter_label(key: str) -> str:
    year, q = key.split("-Q")
    return f"Q{q} {year}"


def _next_quarter_key(key: str) -> str:
    year_s, q_s = key.split("-Q")
    year, q = int(year_s), int(q_s) + 1
    if q > 4:
        q, year = 1, year + 1
    return f"{year}-Q{q}"


def compute_roadmap_columns(now: Optional[datetime] = None) -> list[dict]:
    now = now or datetime.now(timezone.utc)
    key = _quarter_key(now)
    quarter_keys = [key]
    for _ in range(3):
        quarter_keys.append(_next_quarter_key(quarter_keys[-1]))

    columns = [{"key": "backlog", "label": "Backlog"}]
    columns += [{"key": k, "label": _quarter_label(k)} for k in quarter_keys]
    columns.append({"key": "later", "label": "Later"})
    return columns


def valid_quarter_keys() -> set[str]:
    return {c["key"] for c in compute_roadmap_columns()}


class RoadmapColumn(BaseModel):
    key: str
    label: str


class RoadmapColumnsResponse(BaseModel):
    columns: list[RoadmapColumn]
    statuses: list[str] = ROADMAP_STATUSES
    categories: list[str] = ROADMAP_CATEGORIES


class RoadmapItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    quarter: str = "backlog"
    status: str = "planned"


class RoadmapItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None


class RoadmapMoveRequest(BaseModel):
    quarter: str
    position: int = 0


class RoadmapItemResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    quarter: str
    status: str
    position: int
    created_by_user_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class RoadmapGenerateRequest(BaseModel):
    # Optional extra steer, e.g. "focus on GTM and hiring, not product".
    focus: Optional[str] = None
    count: int = 6


class RoadmapSuggestedItem(BaseModel):
    title: str
    description: str = ""
    category: str = Field("Feature", description=f"One of: {ROADMAP_CATEGORIES}")
    quarter: str = Field("backlog", description='Quarter column key, e.g. "backlog" or a "YYYY-Qn" key, or "later".')


class RoadmapGenerateResponse(BaseModel):
    items: list[RoadmapSuggestedItem] = Field(default_factory=list)
