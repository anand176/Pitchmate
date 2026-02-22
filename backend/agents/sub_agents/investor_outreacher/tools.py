"""
Investor Outreacher tools — investor targeting and email drafting.
"""

import json


INVESTOR_TYPE_MAP = {
    "pre_seed": {
        "types": ["Angel investors", "Pre-seed VCs", "Accelerators (YC, Techstars)", "Family offices", "Founder-angels"],
        "check_size": "$25K–$500K",
        "what_they_look_for": "Team quality, vision, early signals of product-market fit, massive potential market",
    },
    "seed": {
        "types": ["Seed VCs", "Micro-VCs", "Super-angels", "Angel syndicates (AngelList)", "Strategic angels"],
        "check_size": "$500K–$3M",
        "what_they_look_for": "Early traction (revenue or strong retention), clear GTM thesis, founder-market fit",
    },
    "series_a": {
        "types": ["Series A VCs", "Multi-stage VCs (Sequoia, a16z, Accel)", "Corporate VCs"],
        "check_size": "$3M–$15M",
        "what_they_look_for": "Proven product-market fit, repeatable sales motion, strong unit economics, growth rate",
    },
    "series_b_plus": {
        "types": ["Growth equity VCs", "Crossover funds", "Late-stage VCs", "PE-backed growth funds"],
        "check_size": "$15M+",
        "what_they_look_for": "Market leadership position, scalable operations, clear path to profitability or IPO",
    },
}

EMAIL_SUBJECT_TEMPLATES = {
    "angel": "Intro: {startup} — {one_liner} | Seeking angel round",
    "seed": "{startup} — {metric} growth, raising seed | Quick intro",
    "series_a": "{startup} ({metric}) — {market} opportunity | {partner_name}",
    "generic": "Intro: {startup} — {one_liner}",
}


def draft_outreach_email(startup_name: str, pitch_summary: str, investor_type: str) -> str:
    """
    Draft a personalized investor outreach email for cold or warm outreach.

    Args:
        startup_name: Name of the startup (e.g. "Pitchmate").
        pitch_summary: 2-3 sentence summary of what the startup does, traction, and the ask.
        investor_type: Type of investor to target (e.g. "angel", "seed VC", "Series A VC",
                      "family office", "corporate VC", "accelerator").

    Returns:
        JSON string with email drafting context and a ready-to-personalise email template.
    """
    inv_lower = investor_type.lower()
    template_key = "generic"
    if "angel" in inv_lower:
        template_key = "angel"
    elif "seed" in inv_lower:
        template_key = "seed"
    elif "series a" in inv_lower or "series_a" in inv_lower:
        template_key = "series_a"

    result = {
        "startup_name": startup_name,
        "pitch_summary": pitch_summary,
        "investor_type": investor_type,
        "subject_template": EMAIL_SUBJECT_TEMPLATES[template_key],
        "email_rules": {
            "max_words": 150,
            "structure": ["Hook (why this investor)", "What we do (1 sentence)", "Traction proof point", "The ask + CTA"],
            "tone": "Confident, concise, respectful of their time",
            "avoid": ["long paragraphs", "jargon", "vague metrics", "attachments on cold email"],
        },
        "instructions_for_agent": (
            f"Draft a cold investor outreach email for {startup_name}. "
            f"Pitch summary: {pitch_summary}. Investor type: {investor_type}. "
            "Follow these rules strictly:\n"
            "- Subject line: < 10 words, creates curiosity or highlights traction. Use the template as guide.\n"
            "- Line 1: Why you're emailing THIS specific type of investor (their focus area).\n"
            "- Lines 2-3: What the startup does in one crisp sentence + the single most impressive traction metric.\n"
            "- Line 4: The specific ask (e.g. '15-minute intro call this week').\n"
            "- Sign-off: Founder name, title, startup name, website.\n"
            "Total email body: < 150 words.\n"
            "Output the full email in this format:\n"
            "**Subject:** [subject line]\n\n"
            "Hi [First Name],\n\n"
            "[Email body]\n\n"
            "Best,\n[Founder Name]\n[Title] @ [Company]\n[website]\n\n"
            "---\n"
            "Also provide a **P.S. version** with a warm intro adaptation (2 sentences asking for an intro referral)."
        ),
    }
    return json.dumps(result, indent=2)


def suggest_investor_types(stage: str, industry: str) -> str:
    """
    Suggest the most relevant investor types for a startup's stage and industry.

    Args:
        stage: Funding stage (e.g. "pre-seed", "seed", "Series A", "Series B").
        industry: Industry/vertical (e.g. "AI/ML", "fintech", "health tech", "SaaS").

    Returns:
        JSON string with investor type recommendations and targeting strategy.
    """
    stage_lower = stage.lower().replace("-", "_").replace(" ", "_")
    stage_key = "seed"  # default
    if "pre" in stage_lower:
        stage_key = "pre_seed"
    elif "series_a" in stage_lower or "series a" in stage_lower.replace("-", " "):
        stage_key = "series_a"
    elif "series_b" in stage_lower or "series_c" in stage_lower or "growth" in stage_lower:
        stage_key = "series_b_plus"

    stage_info = INVESTOR_TYPE_MAP[stage_key]

    result = {
        "stage": stage,
        "industry": industry,
        "typical_investor_types": stage_info["types"],
        "typical_check_size": stage_info["check_size"],
        "what_investors_look_for_at_this_stage": stage_info["what_they_look_for"],
        "instructions_for_agent": (
            f"Recommend investor targeting strategy for a {industry} startup at {stage} stage. "
            f"Typical investors at this stage: {stage_info['types']}. "
            f"Check size range: {stage_info['check_size']}. "
            f"What they look for: {stage_info['what_they_look_for']}. "
            "Provide:\n"
            "1. **Investor Priority List** (A/B/C tier with rationale):\n"
            "   - A-tier: 3-5 investor types MOST likely to invest at this stage in this industry\n"
            "   - B-tier: 3-5 good secondary targets\n"
            "   - C-tier: Long-shot but worth trying\n"
            "2. **Outreach Strategy:** Warm intro vs cold, how to get introductions.\n"
            "3. **5 Specific Example Investor Profiles** (firm type + what they're known for in this space).\n"
            "4. **Red Flags:** Which investor types to avoid at this stage and why.\n"
            "Be specific — name real fund types, strategies, and allocation patterns."
        ),
    }
    return json.dumps(result, indent=2)
