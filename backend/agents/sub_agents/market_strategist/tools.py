"""
Market Strategist tools — GTM strategy and customer segmentation.
"""

import json


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


def suggest_gtm_strategy(product_description: str, target_market: str) -> str:
    """
    Recommend a phased go-to-market strategy for a startup.

    Args:
        product_description: Brief description of the product or service.
        target_market: Description of the target market (e.g. "US mid-market B2B SaaS companies").

    Returns:
        JSON string with GTM context and structured strategy recommendations.
    """
    # Infer market type for channel suggestions
    desc_lower = (product_description + " " + target_market).lower()
    market_type = "b2b_saas"  # default
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
