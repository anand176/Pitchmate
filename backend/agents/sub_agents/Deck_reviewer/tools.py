"""
Deck Reviewer tools — slide analysis and deck scoring.
These are pure-LLM reasoning tools; the agent uses them as structured function-call wrappers.
"""

import json
from typing import Optional


# Slide quality dimensions
SLIDE_DIMENSIONS = {
    "problem": ["clarity", "pain_severity", "evidence", "specificity"],
    "solution": ["differentiation", "simplicity", "direct_fit_to_problem", "scalability"],
    "market": ["tam_credibility", "sam_definition", "som_realism", "source_citation"],
    "traction": ["metric_specificity", "growth_rate", "revenue_evidence", "customer_proof"],
    "team": ["domain_expertise", "execution_track_record", "complementary_skills", "advisor_credibility"],
    "business_model": ["revenue_stream_clarity", "margin_profile", "unit_economics", "monetization_path"],
    "financials": ["projection_realism", "assumption_transparency", "burn_rate", "path_to_profitability"],
    "ask": ["amount_justification", "use_of_funds_breakdown", "milestones", "valuation_rationale"],
}


def review_slide(slide_name: str, content: str) -> str:
    """
    Analyse a single pitch deck slide and return structured investor-grade feedback.

    Args:
        slide_name: Name of the slide (e.g. 'problem', 'solution', 'market', 'traction',
                    'team', 'business_model', 'financials', 'ask').
        content: The text content or description of the slide.

    Returns:
        JSON string with strengths, weaknesses, suggestions, and a quality score (0-10).
    """
    slide_name = slide_name.lower().replace(" ", "_")
    dimensions = SLIDE_DIMENSIONS.get(slide_name, ["clarity", "specificity", "evidence", "investor_appeal"])

    result = {
        "slide": slide_name,
        "content_received": content[:300] + ("..." if len(content) > 300 else ""),
        "review_dimensions": dimensions,
        "instructions_for_agent": (
            f"You are reviewing the '{slide_name}' slide of a pitch deck. "
            f"The content is provided above. Evaluate it against these dimensions: {', '.join(dimensions)}. "
            "Return your review as:\n"
            "✅ STRENGTHS: [bullet points of what works]\n"
            "⚠️ WEAKNESSES: [bullet points of issues]\n"
            "💡 SUGGESTIONS: [specific, actionable improvements]\n"
            "📊 SCORE: [X/10] with a one-line justification.\n"
            "Be direct and honest — like a partner at a top-tier VC firm."
        ),
    }
    return json.dumps(result, indent=2)


def score_deck(slides_dict: dict) -> str:
    """
    Score an entire pitch deck across all key sections and return an overall investor-readiness score.

    Args:
        slides_dict: Dictionary mapping slide names to their content.
                     Example: {"problem": "We solve X...", "solution": "Our product does Y..."}

    Returns:
        JSON string with per-slide scores, weighted overall score (0-100), and key findings.
    """
    present_slides = list(slides_dict.keys())
    missing_slides = [s for s in SLIDE_DIMENSIONS.keys() if s not in present_slides]

    result = {
        "slides_provided": present_slides,
        "slides_missing": missing_slides,
        "completeness_penalty": len(missing_slides) * 5,
        "instructions_for_agent": (
            "You are scoring a complete pitch deck for investor readiness (0-100). "
            f"Slides provided: {present_slides}. Missing slides: {missing_slides}. "
            "For each provided slide, give a score out of 10 and one-line reasoning. "
            "Then compute: Overall Score = (sum of slide scores / max possible) * 100 - completeness_penalty. "
            "Format:\n"
            "| Slide | Score | Key Issue |\n"
            "|-------|-------|----------|\n"
            "[rows for each slide]\n\n"
            "**Overall Investor-Readiness Score: XX/100**\n"
            "**Top 3 Action Items before fundraising:**\n"
            "1. ...\n2. ...\n3. ..."
        ),
        "slides_content": {k: v[:200] for k, v in slides_dict.items()},
    }
    return json.dumps(result, indent=2)
