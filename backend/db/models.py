"""SQLAlchemy ORM models for Pitchmate's self-hosted auth database."""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class StartupProfile(Base):
    """
    Persistent, user-scoped startup profile — source of truth for onboarding,
    lifecycle stage, and agent context injection.
    """

    __tablename__ = "startup_profiles"
    __table_args__ = (UniqueConstraint("user_id", name="uq_startup_profiles_user_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)

    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    one_liner: Mapped[str | None] = mapped_column(String(500), nullable=True)
    lifecycle_stage: Mapped[str | None] = mapped_column(String(64), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(255), nullable=True)

    problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    solution: Mapped[str | None] = mapped_column(Text, nullable=True)
    product_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_actively_raising: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    target_raise: Mapped[str | None] = mapped_column(String(64), nullable=True)
    amount_raised: Mapped[str | None] = mapped_column(String(64), nullable=True)
    investor_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    investor_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    has_deck_upload: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_architecture_upload: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    architecture_image_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    wizard_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    onboarding_dismissed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class AnalysisResult(Base):
    """
    Latest saved output of a dashboard module (market, competition, gtm,
    investors, valuation, deck) for a user. One row per (user, module) — a
    re-run upserts in place, so the dashboard always restores the most recent
    analysis and readiness can tell which modules are done. `inputs` stores the
    form the user submitted (for form pre-fill on return); `result` stores the
    structured LLM output (for instant re-render without another API call).
    """

    __tablename__ = "analysis_results"
    __table_args__ = (
        UniqueConstraint("user_id", "module", name="uq_analysis_results_user_module"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    module: Mapped[str] = mapped_column(String(32), nullable=False)

    inputs: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    result: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
