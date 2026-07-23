"""
Meeting Debrief tools — classify an investor's post-meeting signal (warm /
lukewarm / dead), then build instructions for a structured LLM response with
concrete next steps. Mirrors the market_validator tool contract: returns a JSON
string with deterministic hints plus an `instructions_for_agent` prompt.
"""

import json
import re

# Vague, non-committal phrases founders routinely misread as positive. Detected
# deterministically so the LLM is nudged to treat them as lukewarm-at-best.
_SOFT_PASS_PATTERNS = [
    r"stay in touch", r"keep me posted", r"keep us posted", r"circle back",
    r"reach out when", r"once you (have|hit|get)", r"let's reconnect",
    r"not the right (fit|stage|time)", r"a bit early", r"too early",
    r"come back when", r"check back", r"revisit", r"follow your progress",
]
# Phrases that usually signal genuine interest / momentum.
_WARM_PATTERNS = [
    r"send (me|us) the deck", r"intro(duce)? you to", r"partner meeting",
    r"next step", r"term sheet", r"due diligence", r"data room",
    r"how much are you raising", r"what's the allocation", r"references",
    r"loop in", r"schedule a follow", r"deep dive",
]


def _scan(text: str, patterns: list[str]) -> list[str]:
    found = []
    low = text.lower()
    for pat in patterns:
        m = re.search(pat, low)
        if m:
            found.append(m.group(0))
    return found


def analyze_meeting_debrief(
    investor_name: str,
    investor_type: str,
    meeting_notes: str,
    ask: str = "",
) -> str:
    """
    Build the debrief context for the meeting-debrief dashboard endpoint.

    Args:
        investor_name: Who the meeting was with (person or firm).
        investor_type: e.g. "seed VC", "angel", "Series A VC".
        meeting_notes: What was said / how it went, in the founder's words.
        ask: What the founder is raising / asked for (optional).

    Returns:
        JSON string with deterministic phrase hints and instructions_for_agent.
    """
    soft_pass = _scan(meeting_notes, _SOFT_PASS_PATTERNS)
    warm_hits = _scan(meeting_notes, _WARM_PATTERNS)

    hint = "ambiguous"
    if warm_hits and not soft_pass:
        hint = "leans warm"
    elif soft_pass and not warm_hits:
        hint = "leans lukewarm / soft-pass"
    elif soft_pass and warm_hits:
        hint = "mixed — verify commitments are concrete, not polite"

    result = {
        "investor_name": investor_name,
        "investor_type": investor_type,
        "ask": ask,
        "detected_soft_pass_phrases": soft_pass,
        "detected_warm_phrases": warm_hits,
        "heuristic_hint": hint,
        "instructions_for_agent": (
            "You are Pitchmate's Meeting Debrief agent. A founder just met an investor "
            "and needs an honest read on how it went plus exact next steps. Founders "
            "systematically over-read polite interest as real interest — your job is to "
            "cut through that.\n\n"
            f"Investor: {investor_name} ({investor_type}). "
            f"Founder's ask: {ask or 'not stated'}.\n"
            f"What happened (founder's notes): {meeting_notes}\n\n"
            f"Deterministic phrase scan — soft-pass/non-committal: {soft_pass or 'none'}; "
            f"genuine-interest markers: {warm_hits or 'none'}; overall lean: {hint}.\n\n"
            "Classify the signal as exactly one of: 'warm', 'lukewarm', or 'dead'.\n"
            "- warm = concrete forward motion (asked for deck/references/partner meeting, "
            "discussed allocation/terms, proposed a real next step).\n"
            "- lukewarm = interest but no commitment; 'stay in touch' / 'too early' / "
            "'come back when' are lukewarm AT BEST — treat vague encouragement as a soft pass.\n"
            "- dead = clear pass or no path forward.\n\n"
            "Then provide: a one-line signal_reasoning; the positive_signals actually present "
            "(be strict); the concerns/objections raised or implied; recommended_next_steps "
            "(specific and sequenced); suggested_followup_timing (e.g. '48 hours', '2-3 weeks "
            "with a progress update'); materials_to_send (only what moves this forward); and a "
            "ready-to-send draft_followup_message (<120 words, references something specific "
            "from the meeting, has a concrete CTA). Be direct and honest — if it's a soft pass, "
            "say so and pivot the founder's energy to better-fit investors."
        ),
    }
    return json.dumps(result, indent=2)
