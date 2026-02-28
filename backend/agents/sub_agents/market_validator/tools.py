"""
Market Agent tools — validate TAM/SAM/SOM and competition; GTM strategy and customer segments.
"""

import json

# GTM channel and pricing maps (from market strategist)
CHANNEL_MAP = {
    "b2b_saas": ["PLG (product-led growth)", "content marketing + SEO", "inside sales", "LinkedIn outbound", "partner/reseller channel"],
    "b2c": ["paid social (Meta/TikTok)", "influencer marketing", "SEO/content", "app store optimization", "referral programs"],
    "marketplace": ["supply-side acquisition first", "demand-side incentives", "geographic density strategy", "content SEO", "partnerships"],
    "enterprise": ["field sales", "account-based marketing (ABM)", "thought leadership / analyst relations", "channel partners (SIs, VARs)", "RFP/procurement"],
    "consumer_hardware": ["DTC e-commerce", "retail partnerships", "crowdfunding (Kickstarter/Indiegogo)", "influencer unboxing", "paid search"],
    "fintech": ["bank/credit union partnerships", "employer benefits channel", "B2B2C", "content + community", "referral with incentives"],
    "healthtech": ["provider partnerships", "employer benefits / HR", "direct-to-consumer telemedicine", "insurance reimbursement pathway", "clinical study → credibility"],
    "edtech": ["school/university sales", "teacher communities", "B2C parent/student direct", "corporate L&D", "content SEO"],
}
PRICING_MODELS = {
    "saas": ["per seat (per user/month)", "usage-based (API calls, records, events)", "tiered flat-rate (Starter/Pro/Enterprise)", "freemium → paid", "outcome-based"],
    "marketplace": ["take rate (% of GMV)", "subscription for power sellers", "featured listing fee", "transaction fee + SaaS"],
    "hardware": ["hardware margin + recurring software/service", "razor-and-blade (hardware subsidised + subscription)", "one-time purchase", "lease/financing"],
    "services": ["retainer", "project-based", "outcome/performance-based", "hourly"],
}


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


def suggest_gtm_strategy(product_description: str, target_market: str) -> str:
    """
    Recommend a phased go-to-market strategy for a startup.

    Args:
        product_description: Brief description of the product or service.
        target_market: Description of the target market (e.g. "US mid-market B2B SaaS companies").

    Returns:
        JSON string with GTM context and structured strategy recommendations.
    """
    desc_lower = (product_description + " " + target_market).lower()
    market_type = "b2b_saas"
    if any(w in desc_lower for w in ["consumer", "b2c", "app", "personal"]):
        market_type = "b2c"
    elif "enterprise" in desc_lower:
        market_type = "enterprise"
    elif "marketplace" in desc_lower:
        market_type = "marketplace"
    elif "fintech" in desc_lower or "finance" in desc_lower or "payment" in desc_lower:
        market_type = "fintech"
    elif "health" in desc_lower or "medical" in desc_lower or "clinic" in desc_lower:
        market_type = "healthtech"
    elif "educat" in desc_lower or "learn" in desc_lower or "school" in desc_lower:
        market_type = "edtech"
    elif "hardware" in desc_lower or "device" in desc_lower or "iot" in desc_lower:
        market_type = "consumer_hardware"

    suggested_channels = CHANNEL_MAP.get(market_type, CHANNEL_MAP["b2b_saas"])
    suggested_pricing = PRICING_MODELS.get(
        "saas" if "saas" in market_type else market_type.split("_")[0],
        PRICING_MODELS["saas"],
    )

    result = {
        "product_description": product_description,
        "target_market": target_market,
        "inferred_market_type": market_type,
        "suggested_channels": suggested_channels,
        "suggested_pricing_models": suggested_pricing,
        "instructions_for_agent": (
            "You are building a go-to-market strategy for a startup. "
            f"Product: {product_description}. Target market: {target_market}. "
            f"Inferred market type: {market_type}. "
            f"Likely relevant channels: {suggested_channels}. "
            f"Likely pricing models: {suggested_pricing}. "
            "Create a phased GTM strategy:\n"
            "**Phase 1 — Beachhead (0-6 months):** Identify the single most winnable niche. "
            "Which specific channel will you use first and why? What is the ideal first customer profile?\n"
            "**Phase 2 — Expand (6-18 months):** Once initial traction, what adjacent segments/geographies?\n"
            "**Phase 3 — Scale (18+ months):** What does the scaled distribution model look like?\n"
            "Also recommend: Sales motion (PLG/inside/field), Pricing model, Key metric to track per phase.\n"
            "Be specific, practical, and stage-appropriate."
        ),
    }
    return json.dumps(result, indent=2)


def identify_customer_segments(industry: str, product_type: str) -> str:
    """
    Identify ideal customer profiles (ICP) and early adopter segments.

    Args:
        industry: Industry the startup operates in (e.g. "legal tech", "HR tech", "retail").
        product_type: Type of product (e.g. "workflow automation SaaS", "mobile app", "marketplace").

    Returns:
        JSON string with customer segmentation analysis instructions.
    """
    result = {
        "industry": industry,
        "product_type": product_type,
        "instructions_for_agent": (
            "You are identifying ideal customer profiles (ICP) for a startup. "
            f"Industry: {industry}. Product type: {product_type}. "
            "Provide a structured segmentation analysis:\n"
            "1. **Primary ICP** (who will pay first and most): Firmographics (company size, industry, geography), "
            "   Key persona (title, goals, pain points), Buying trigger, Budget authority.\n"
            "2. **Secondary ICP** (adjacent segment for expansion): Same structure.\n"
            "3. **Early Adopter Profile** (who is most desperate for this solution right now): "
            "   Characteristics, where to find them, how to reach them.\n"
            "4. **Anti-ICP** (who to avoid): Who seems like a good fit but isn't (wrong size, wrong pain, churn risk).\n"
            "Be specific — avoid 'any company with X problem'. Name real company types and personas."
        ),
    }
    return json.dumps(result, indent=2)
