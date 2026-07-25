"""SQLAlchemy ORM models for Pitchmate's self-hosted auth database."""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Every user starts as the sole member of their own team (team_id defaults to a
    # fresh uuid, independent of their user id). Accepting a TeamInvite reassigns
    # this to the inviter's team_id — see team/store.py. All "shared" resources
    # (StartupProfile, FundraiseRound, InvestorContact, RoadmapItem, CashSnapshot)
    # are scoped by team_id instead of user_id so cofounders see the same data.
    team_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class TeamInvite(Base):
    """
    A single-use, expiring invite link that lets a cofounder join the
    inviter's team (see User.team_id). Lightweight by design — no roles or
    permissions, just "you're now looking at the same workspace."
    """

    __tablename__ = "team_invites"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(String(36), nullable=False)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    accepted_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

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
    # Scoping column — one profile per team, shared across cofounders. user_id
    # above is kept as "who originally created it" but reads/writes go by team_id.
    team_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)

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


class FundraiseRound(Base):
    """
    A user's active (or past) fundraise round — the container for pipeline
    investor tracking. Most users have exactly one active round at a time,
    but the model allows history (closed rounds) without deleting data.
    """

    __tablename__ = "fundraise_rounds"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    team_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)

    name: Mapped[str] = mapped_column(String(255), default="Fundraise", nullable=False)
    target_amount: Mapped[str | None] = mapped_column(String(64), nullable=True)
    amount_committed: Mapped[str | None] = mapped_column(String(64), nullable=True)
    stage: Mapped[str] = mapped_column(String(32), default="seed", nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="active", nullable=False)  # active | closed

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class InvestorContact(Base):
    """
    A single investor/lead in the founder's fundraise pipeline. Distinct from
    the ad-hoc "Investor Targeting" dashboard module (which suggests investor
    *types*) — this tracks real, named contacts through pipeline stages.
    """

    __tablename__ = "investor_contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    team_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    round_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    firm: Mapped[str | None] = mapped_column(String(255), nullable=True)
    investor_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # See pipeline/schemas.py PIPELINE_STAGES / WARMTH_LEVELS for allowed values.
    pipeline_stage: Mapped[str] = mapped_column(String(32), default="research", nullable=False)
    warmth: Mapped[str] = mapped_column(String(16), default="cold", nullable=False)

    ask_amount: Mapped[str | None] = mapped_column(String(64), nullable=True)
    last_contact_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_action: Mapped[str | None] = mapped_column(String(500), nullable=True)
    next_action_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class IntegrationCredential(Base):
    """
    Per-user OAuth credential for an external integration (Notion, Google).
    Tokens are encrypted at rest (see integrations/crypto.py) before being
    stored in access_token/refresh_token.
    """

    __tablename__ = "integration_credentials"
    __table_args__ = (UniqueConstraint("user_id", "provider", name="uq_integration_credentials_user_provider"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)  # "notion" | "google"

    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    account_label: Mapped[str | None] = mapped_column(String(255), nullable=True)  # workspace/email shown in UI
    # Notion-specific: database created under the user's chosen parent page for pipeline sync.
    notion_parent_page_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notion_database_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class RoadmapItem(Base):
    """
    A single product/feature card on the team's roadmap board. `quarter` is
    the kanban column key (see roadmap/schemas.py compute_roadmap_columns —
    "backlog", "2026-Q3", ..., "later"); `position` orders cards within a
    column for drag-and-drop. Team-scoped so cofounders share one board.
    """

    __tablename__ = "roadmap_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(String(36), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)  # e.g. "Feature", "Infra", "Growth"
    quarter: Mapped[str] = mapped_column(String(16), default="backlog", nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="planned", nullable=False)  # planned|in_progress|shipped
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class CashSnapshot(Base):
    """
    A point-in-time "cash in bank" reading the team logs (weekly/monthly).
    Two or more snapshots let /runway/summary derive an actual burn rate from
    the delta between them instead of relying on a manually-typed figure —
    that's what makes the runway number "live" rather than a one-shot calc.
    """

    __tablename__ = "cash_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(String(36), nullable=False)

    cash_in_bank: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class PracticeSession(Base):
    """
    One completed Q&A call-practice session (see simulator/ package) — a
    turn-by-turn roleplay transcript against an investor/buyer persona, plus
    the overall score/summary computed once the call ends. Unlike
    `AnalysisResult` (one row per module, upserted), founders can run many
    practice sessions, so this is append-only history: team-scoped so
    cofounders can see each other's reps and progress over time.
    """

    __tablename__ = "practice_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(String(36), nullable=False)

    scenario_id: Mapped[str] = mapped_column(String(64), nullable=False)
    scenario_label: Mapped[str] = mapped_column(String(255), nullable=False)
    overall_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    # List of {role: "persona"|"user", text: str, score?: int, feedback?: str}.
    transcript: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
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
