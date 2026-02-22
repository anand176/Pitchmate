"""
Market Validator tools — validate TAM/SAM/SOM and competitive landscape.
"""

import json


def validate_market_size(tam: str, sam: str, som: str, description: str) -> str:
    """
    Validate the market sizing (TAM, SAM, SOM) claims in a pitch deck.

    Args:
        tam: Total Addressable Market claim (e.g. "$50B global CRM market").
        sam: Serviceable Addressable Market claim (e.g. "$5B US mid-market CRM").
        som: Serviceable Obtainable Market claim (e.g. "$500M in 5 years").
        description: Brief description of the business and product.

    Returns:
        JSON string with validation context and instructions for structured feedback.
    """
    # Parse $ values for basic sanity checks
    def _extract_value(text: str) -> float | None:
        import re
        match = re.search(r"\$?([\d,\.]+)\s*([BMK]?)", text.upper())
        if not match:
            return None
        raw = float(match.group(1).replace(",", ""))
        multiplier = {"B": 1e9, "M": 1e6, "K": 1e3, "": 1.0}.get(match.group(2), 1.0)
        return raw * multiplier

    tam_val = _extract_value(tam)
    sam_val = _extract_value(sam)
    som_val = _extract_value(som)

    flags = []
    if tam_val and sam_val and sam_val > tam_val:
        flags.append("SAM cannot be larger than TAM — logical inconsistency.")
    if sam_val and som_val and som_val > sam_val:
        flags.append("SOM cannot be larger than SAM — logical inconsistency.")
    if tam_val and sam_val and (sam_val / tam_val) > 0.5:
        flags.append("SAM is >50% of TAM — investors will question this; SAM should be a realistic subset.")
    if sam_val and som_val and (som_val / sam_val) > 0.1:
        flags.append("SOM is >10% of SAM — investors find this aggressive without strong justification.")

    result = {
        "tam_claimed": tam,
        "sam_claimed": sam,
        "som_claimed": som,
        "business_description": description,
        "automatic_flags": flags,
        "instructions_for_agent": (
            "You are validating market sizing for a pitch deck. "
            f"Business: {description}. TAM: {tam}. SAM: {sam}. SOM: {som}. "
            f"Automatic flags detected: {flags if flags else 'None'}. "
            "Evaluate:\n"
            "1. Is the methodology top-down or bottom-up? Is bottom-up used/supported?\n"
            "2. Are numbers sourced (Gartner, McKinsey, IBISWorld, government data)?\n"
            "3. Are TAM/SAM/SOM logically nested and coherent?\n"
            "4. Is SOM achievable given the team's resources and timeline?\n"
            "Return:\n"
            "✅ What's credible\n"
            "⚠️ Red flags investors will raise\n"
            "💡 How to strengthen the market slide\n"
            "Be specific and reference the actual numbers provided."
        ),
    }
    return json.dumps(result, indent=2)


def assess_competition(competitors_list: list) -> str:
    """
    Evaluate the competitive landscape breakdown in a pitch deck.

    Args:
        competitors_list: List of competitor entries. Each entry can be a string (competitor name)
                         or a dict with keys like 'name', 'description', 'weaknesses'.

    Returns:
        JSON string with competitive analysis context and structured feedback instructions.
    """
    result = {
        "competitors_provided": competitors_list,
        "competitor_count": len(competitors_list),
        "instructions_for_agent": (
            "You are evaluating a startup's competitive analysis for a pitch deck. "
            f"Competitors listed: {competitors_list}. "
            "Evaluate:\n"
            "1. Are there obvious missing competitors (direct, adjacent, status quo alternatives)?\n"
            "2. Is differentiation specific and defensible, or generic (faster, cheaper, better)?\n"
            "3. Do the axes of any 2x2/quadrant matrix represent real buying criteria?\n"
            "4. Is the 'no competitor' trap avoided? (Claiming no competition = no market)\n"
            "5. Is the moat articulated (network effects, IP, switching costs, data, brand)?\n"
            "Return:\n"
            "✅ What's strong about the competitive positioning\n"
            "⚠️ Gaps or weaknesses investors will probe\n"
            "💡 Specific improvements to the competition slide\n"
            "🏆 Suggested moat/differentiation angle if missing"
        ),
    }
    return json.dumps(result, indent=2)
