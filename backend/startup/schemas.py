"""Pydantic schemas for startup profile and readiness."""

from typing import Optional

from pydantic import BaseModel, Field


LIFECYCLE_STAGES = [
    "idea",
    "validating",
    "building",
    "pre_revenue",
    "revenue",
    "raising",
    "angel_backed",
    "seed_closed",
    "series_a_plus",
]


class StartupProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    one_liner: Optional[str] = None
    lifecycle_stage: Optional[str] = None
    industry: Optional[str] = None
    problem: Optional[str] = None
    solution: Optional[str] = None
    product_description: Optional[str] = None
    is_actively_raising: Optional[bool] = None
    target_raise: Optional[str] = None
    amount_raised: Optional[str] = None
    investor_count: Optional[int] = None
    investor_notes: Optional[str] = None
    has_deck_upload: Optional[bool] = None
    has_architecture_upload: Optional[bool] = None
    architecture_image_name: Optional[str] = None
    wizard_completed: Optional[bool] = None
    onboarding_dismissed: Optional[bool] = None


class StartupProfileResponse(BaseModel):
    id: Optional[str] = None
    company_name: Optional[str] = None
    one_liner: Optional[str] = None
    lifecycle_stage: Optional[str] = None
    industry: Optional[str] = None
    problem: Optional[str] = None
    solution: Optional[str] = None
    product_description: Optional[str] = None
    is_actively_raising: bool = False
    target_raise: Optional[str] = None
    amount_raised: Optional[str] = None
    investor_count: Optional[int] = None
    investor_notes: Optional[str] = None
    has_deck_upload: bool = False
    has_architecture_upload: bool = False
    architecture_image_name: Optional[str] = None
    wizard_completed: bool = False
    onboarding_dismissed: bool = False
    profile_complete: bool = False
    updated_at: Optional[str] = None


class ReadinessMilestone(BaseModel):
    id: str
    label: str
    done: bool
    weight: int
    percent: int = 0


class ReadinessResponse(BaseModel):
    overall_percent: int
    profile_complete: bool
    milestones: list[ReadinessMilestone] = Field(default_factory=list)
    next_action: str
    next_action_path: str = "/market"
