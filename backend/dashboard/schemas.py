"""
Pydantic request/response schemas for the Pitchmate dashboard tabs:
Market, Competition, GTM, Investors, Valuation, and Deck.
"""

from typing import Optional
from pydantic import BaseModel, Field


# ─── Market ──────────────────────────────────────────────────────────────────

class MarketSizeRequest(BaseModel):
    tam: str = Field(..., description='Total Addressable Market claim, e.g. "$50B global CRM market".')
    sam: str = Field(..., description='Serviceable Addressable Market claim, e.g. "$5B US mid-market CRM".')
    som: str = Field(..., description='Serviceable Obtainable Market claim, e.g. "$500M in 5 years".')
    description: str = Field(..., description="Brief description of the business and product.")


class MarketSizeResult(BaseModel):
    verdict: str = Field(..., description='Overall verdict: "credible", "needs_work", or "not_credible".')
    tam_assessment: str
    sam_assessment: str
    som_assessment: str
    strengths: list[str] = Field(default_factory=list)
    red_flags: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    automatic_flags: list[str] = Field(
        default_factory=list,
        description="Deterministic logical-consistency flags (e.g. SAM > TAM) computed before the LLM call.",
    )


# ─── Competition ─────────────────────────────────────────────────────────────

class CompetitionRequest(BaseModel):
    competitors: list[str] = Field(..., description="List of competitor names or short descriptions.")
    description: Optional[str] = Field(None, description="Brief description of the startup for context.")


class CompetitorProfile(BaseModel):
    name: str
    positioning: str = ""
    weakness: str = ""


class CompetitionResult(BaseModel):
    strengths: list[str] = Field(default_factory=list, description="What's strong about the competitive positioning.")
    gaps: list[str] = Field(default_factory=list, description="Gaps or weaknesses investors will probe.")
    recommendations: list[str] = Field(default_factory=list)
    suggested_moat: str = Field(..., description="Suggested moat/differentiation angle.")
    competitor_table: list[CompetitorProfile] = Field(default_factory=list)
    competitor_count: int = 0


# ─── GTM (Go-To-Market) ──────────────────────────────────────────────────────

class GTMRequest(BaseModel):
    product_description: str
    target_market: str


class GTMPhase(BaseModel):
    name: str = Field("", description='e.g. "Beachhead (0-6 months)"')
    focus: str = ""
    key_actions: list[str] = Field(default_factory=list)


class GTMResult(BaseModel):
    inferred_market_type: str
    suggested_channels: list[str] = Field(default_factory=list)
    suggested_pricing_models: list[str] = Field(default_factory=list)
    phases: list[GTMPhase] = Field(default_factory=list)
    primary_icp: str = Field("", description="Primary ideal customer profile summary.")
    early_adopter_profile: str = ""
    recommended_sales_motion: str = ""
    key_metric_per_phase: str = ""


# ─── Investors ───────────────────────────────────────────────────────────────

class InvestorRequest(BaseModel):
    stage: str = Field(..., description='Funding stage, e.g. "seed", "Series A".')
    industry: str = Field(..., description='Industry/vertical, e.g. "fintech", "AI/ML".')


class InvestorTier(BaseModel):
    tier: str = Field("", description='"A", "B", or "C".')
    investor_types: list[str] = Field(default_factory=list)
    rationale: str = ""


class InvestorResult(BaseModel):
    typical_check_size: str
    what_investors_look_for: str
    tiers: list[InvestorTier] = Field(default_factory=list)
    outreach_strategy: str = ""
    example_profiles: list[str] = Field(default_factory=list)
    red_flags: list[str] = Field(default_factory=list)


# ─── Valuation ───────────────────────────────────────────────────────────────

class ValuationRequest(BaseModel):
    stage: str = Field(..., description='Funding stage, e.g. "pre-seed", "seed", "Series A".')
    sector: str = Field(..., description='Industry/vertical, e.g. "B2B SaaS", "fintech".')
    arr: Optional[str] = Field("", description='Annual recurring revenue, e.g. "$400K". Empty if pre-revenue.')
    growth_rate_yoy: Optional[str] = Field("", description='Year-over-year growth, e.g. "150%".')
    team_strength: int = Field(3, ge=1, le=5, description="Subjective team strength, 1 (weak) to 5 (exceptional).")
    traction_strength: int = Field(3, ge=1, le=5, description="Subjective traction strength, 1 (none) to 5 (strong).")


class ValuationResult(BaseModel):
    valuation_low: float
    valuation_high: float
    valuation_low_formatted: str
    valuation_high_formatted: str
    methodology: str
    value_drivers: list[str] = Field(default_factory=list)
    key_risks: list[str] = Field(default_factory=list)
    negotiation_guidance: str = ""
    caveat: str = (
        "Early-stage valuation is negotiated, not computed — this range is directional "
        "based on comparable company data, not a formal appraisal."
    )


# ─── Deck ────────────────────────────────────────────────────────────────────

class DeckRequest(BaseModel):
    company_name: str = "Product Deck"
    problem: Optional[str] = None
    solution: Optional[str] = None
    market_size: Optional[str] = None
    product: Optional[str] = None
    traction: Optional[str] = None
    business_model: Optional[str] = None
    gtm_strategy: Optional[str] = None
    competition: Optional[str] = None


class DeckSection(BaseModel):
    key: str
    title: str
    content: str


class DeckResult(BaseModel):
    company_name: str
    sections: list[DeckSection] = Field(default_factory=list)


class DeckExportRequest(DeckRequest):
    format: str = Field("pdf", description='"pdf" or "docx".')


class DeckExportResult(BaseModel):
    filename: str
    download_url: str


# ─── Saved analyses (persistence) ────────────────────────────────────────────

class SavedAnalysis(BaseModel):
    module: str
    inputs: dict = Field(default_factory=dict)
    result: dict = Field(default_factory=dict)
    updated_at: Optional[str] = None


class SavedAnalysesResponse(BaseModel):
    results: dict[str, SavedAnalysis] = Field(
        default_factory=dict,
        description="Saved analyses keyed by module name (market, competition, gtm, investors, valuation, deck).",
    )
    completed_modules: list[str] = Field(default_factory=list)
