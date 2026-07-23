"""
Traction Framing tools — help pre-seed/seed founders substitute proof-of-traction
for pedigree: structure whatever early signal they have (metrics, customer quotes,
milestones) into a credible momentum narrative. Deterministic layer is light (a
few emptiness checks); the LLM does the framing. Returns a JSON string with an
`instructions_for_agent` prompt, mirroring the market_validator tool contract.
"""

import json


def frame_traction(
    metrics: str,
    customer_quotes: str = "",
    milestones: str = "",
    stage: str = "",
) -> str:
    """
    Build traction-framing context for the dashboard endpoint.

    Args:
        metrics: Whatever numbers exist — users, revenue, growth, retention, waitlist, pilots.
        customer_quotes: Raw customer/user quotes or testimonials (optional).
        milestones: Notable milestones — launches, partnerships, hires (optional).
        stage: Lifecycle stage for calibration (optional).

    Returns:
        JSON string with presence hints and instructions_for_agent.
    """
    has_metrics = bool(metrics and metrics.strip())
    has_quotes = bool(customer_quotes and customer_quotes.strip())
    has_milestones = bool(milestones and milestones.strip())

    thinness = []
    if not has_quotes:
        thinness.append("No customer quotes provided — social proof will lean entirely on metrics.")
    if not has_milestones:
        thinness.append("No milestones provided — momentum story will rest on metrics alone.")

    result = {
        "has_metrics": has_metrics,
        "has_quotes": has_quotes,
        "has_milestones": has_milestones,
        "instructions_for_agent": (
            "You are Pitchmate's Traction Framing coach. Early founders usually have real signal but "
            "present it weakly ('we have some users'). Your job: turn thin, raw traction into a credible, "
            "confident momentum narrative that substitutes proof-of-traction for pedigree — WITHOUT "
            "inventing or inflating any numbers.\n\n"
            f"Stage: {stage or 'unspecified'}.\n"
            f"Metrics/signal (raw): {metrics or 'none provided'}.\n"
            f"Customer quotes (raw): {customer_quotes or 'none provided'}.\n"
            f"Milestones (raw): {milestones or 'none provided'}.\n\n"
            "Produce:\n"
            "1. traction_narrative — a tight 3-5 sentence investor-facing story that frames the existing "
            "signal as momentum. Lead with the strongest proof point. Use only the numbers given; if a "
            "number is missing, frame qualitatively rather than inventing it.\n"
            "2. proof_points — the specific facts an investor will find credible, each phrased as a "
            "punchy standalone line.\n"
            "3. social_proof — concrete guidance on presenting quotes/logos/design-partners (only if "
            "provided; if none, say what kind to collect first).\n"
            "4. momentum_story — 1-2 sentences for the 'always be raising' narrative: rate of change and "
            "what it implies, not just absolute numbers.\n"
            "5. gaps — the traction evidence investors will expect at this stage that is missing.\n"
            "6. metrics_to_track — 3-5 metrics the founder should start capturing now to strengthen the "
            "next raise.\n"
            "Be specific, honest, and never fabricate figures the founder didn't provide."
        ),
    }
    return json.dumps(result, indent=2)
