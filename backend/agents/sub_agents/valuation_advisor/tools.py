"""
Valuation Advisor tools — estimate a defensible pre-money valuation range for a startup.

Combines deterministic heuristics (stage baselines, revenue multiples, qualitative
adjustments) with LLM narrative/caveats, mirroring the pattern used by
`market_validator/tools.py` (deterministic pre-computation + `instructions_for_agent`).
"""

import json
import re

# Baseline pre-money valuation ranges by stage (USD), based on typical US market
# comps. These are ballpark ranges, not appraisals — always presented as a range
# with explicit caveats.
STAGE_BASELINES = {
    "pre_seed": (500_000, 3_000_000),
    "seed": (3_000_000, 10_000_000),
    "series_a": (10_000_000, 40_000_000),
    "series_b_plus": (40_000_000, 150_000_000),
}

# Revenue-multiple ranges (x ARR) by sector, used when the startup has meaningful
# recurring revenue. Higher multiples reflect stronger comps for capital-efficient,
# high-margin, high-growth categories (e.g. SaaS, fintech infra) vs. lower-margin
# or capital-intensive categories.
REVENUE_MULTIPLE_MAP = {
    "saas": (6.0, 15.0),
    "fintech": (5.0, 12.0),
    "marketplace": (3.0, 8.0),
    "healthtech": (4.0, 10.0),
    "consumer": (2.0, 6.0),
    "hardware": (1.5, 4.0),
    "ai": (8.0, 20.0),
    "default": (4.0, 10.0),
}

_STAGE_ALIASES = {
    "pre-seed": "pre_seed",
    "preseed": "pre_seed",
    "seed": "seed",
    "series a": "series_a",
    "series-a": "series_a",
    "series b": "series_b_plus",
    "series c": "series_b_plus",
    "growth": "series_b_plus",
}


def _normalize_stage(stage: str) -> str:
    key = stage.lower().strip()
    key = _STAGE_ALIASES.get(key, key.replace("-", "_").replace(" ", "_"))
    return key if key in STAGE_BASELINES else "seed"


def _normalize_sector(sector: str) -> str:
    key = sector.lower()
    for candidate in REVENUE_MULTIPLE_MAP:
        if candidate in key:
            return candidate
    if any(w in key for w in ("ml", "artificial intelligence", "genai", "llm")):
        return "ai"
    if any(w in key for w in ("bank", "payment", "lending", "insurance")):
        return "fintech"
    if any(w in key for w in ("health", "medical", "clinic", "care")):
        return "healthtech"
    if any(w in key for w in ("shop", "retail", "d2c", "dtc", "consumer")):
        return "consumer"
    if any(w in key for w in ("device", "iot", "robot")):
        return "hardware"
    if "marketplace" in key:
        return "marketplace"
    return "default"


def _parse_dollar_amount(text: str) -> float | None:
    if not text:
        return None
    match = re.search(r"\$?([\d,\.]+)\s*([BMK]?)", text.upper())
    if not match:
        return None
    raw = float(match.group(1).replace(",", ""))
    multiplier = {"B": 1e9, "M": 1e6, "K": 1e3, "": 1.0}.get(match.group(2), 1.0)
    return raw * multiplier


def _format_dollars(value: float) -> str:
    if value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"
    if value >= 1_000:
        return f"${value / 1_000:.0f}K"
    return f"${value:.0f}"


def estimate_valuation(
    stage: str,
    sector: str,
    arr: str = "",
    growth_rate_yoy: str = "",
    team_strength: int = 3,
    traction_strength: int = 3,
) -> str:
    """
    Estimate a defensible pre-money valuation range for a startup pitch.

    Combines a stage-based baseline, revenue-multiple comps (if ARR is provided),
    and qualitative adjustments for team and traction strength. Always returns a
    range (not a single number) since early-stage valuation is inherently
    negotiated, not computed.

    Args:
        stage: Funding stage (e.g. "pre-seed", "seed", "Series A", "Series B").
        sector: Industry/vertical (e.g. "B2B SaaS", "fintech", "healthtech", "AI").
        arr: Annual recurring revenue, if any (e.g. "$400K", "$1.2M"). Leave empty
            if pre-revenue.
        growth_rate_yoy: Year-over-year revenue growth rate, if known (e.g. "150%").
        team_strength: Subjective team strength 1 (weak) to 5 (exceptional, repeat
            founders / domain experts).
        traction_strength: Subjective traction strength 1 (none) to 5 (strong
            revenue/usage momentum).

    Returns:
        JSON string with a computed valuation range, methodology, and instructions
        for the agent to produce the narrative + caveats.
    """
    stage_key = _normalize_stage(stage)
    sector_key = _normalize_sector(sector)
    low, high = STAGE_BASELINES[stage_key]
    methodology = "stage_baseline"

    arr_value = _parse_dollar_amount(arr)
    if arr_value and arr_value > 0:
        mult_low, mult_high = REVENUE_MULTIPLE_MAP[sector_key]
        growth_val = _parse_dollar_amount(growth_rate_yoy.replace("%", "")) if growth_rate_yoy else None
        # Bump multiples for exceptional growth (>100% YoY), trim for slow growth (<30%).
        if growth_val is not None:
            if growth_val >= 100:
                mult_low, mult_high = mult_low * 1.2, mult_high * 1.3
            elif growth_val < 30:
                mult_low, mult_high = mult_low * 0.7, mult_high * 0.8
        revenue_low, revenue_high = arr_value * mult_low, arr_value * mult_high
        # Blend the revenue-multiple estimate with the stage baseline (avoids wild
        # outliers when ARR is tiny relative to stage, or huge relative to stage).
        low = max(low, revenue_low) * 0.6 + low * 0.4
        high = max(high, revenue_high) * 0.6 + high * 0.4
        methodology = "revenue_multiple_blended_with_stage_baseline"

    # Qualitative adjustment: team + traction strength (1-5 each) shift the range
    # by up to +/-20% combined.
    quality_score = (team_strength + traction_strength) / 10.0  # 0.2 (weak) .. 1.0 (excellent)
    adjustment = 0.8 + (quality_score * 0.4)  # maps 0.2->0.88 .. 1.0->1.2
    low *= adjustment
    high *= adjustment

    result = {
        "stage": stage,
        "sector": sector,
        "arr_provided": arr or None,
        "growth_rate_yoy": growth_rate_yoy or None,
        "team_strength": team_strength,
        "traction_strength": traction_strength,
        "methodology": methodology,
        "estimated_valuation_low": round(low, -3),
        "estimated_valuation_high": round(high, -3),
        "estimated_valuation_low_formatted": _format_dollars(low),
        "estimated_valuation_high_formatted": _format_dollars(high),
        "instructions_for_agent": (
            f"You are advising a founder on pre-money valuation for a {sector} startup at {stage} stage. "
            f"Computed range: {_format_dollars(low)} – {_format_dollars(high)} "
            f"(methodology: {methodology}). "
            f"ARR: {arr or 'pre-revenue'}. Growth: {growth_rate_yoy or 'unknown'}. "
            f"Team strength: {team_strength}/5. Traction strength: {traction_strength}/5.\n"
            "Provide:\n"
            "1. **Valuation Range** — present the computed range clearly, and explain in plain terms "
            "why (stage norms, revenue multiple comps if applicable, team/traction adjustments).\n"
            "2. **Key Value Drivers** — 3-4 specific things about this startup that push valuation up.\n"
            "3. **Key Risks** — 2-3 things that could push valuation down or scare off investors.\n"
            "4. **Negotiation Guidance** — how to anchor the conversation, and what terms "
            "(option pool, liquidation preference, board seats) matter as much as the headline number.\n"
            "5. **Caveat** — always state that early-stage valuation is negotiated, not computed, and "
            "this range is directional based on comparable company data, not a formal appraisal.\n"
            "Be specific and honest, like a VC partner — do not inflate expectations."
        ),
    }
    return json.dumps(result, indent=2)
