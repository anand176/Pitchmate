"""
Financial Narrative tools — turn raw unit economics (CAC, LTV, burn, runway)
into an investor-facing story. The deterministic layer computes LTV:CAC and
runway and flags problems; the LLM writes the narrative and talking points.
Returns a JSON string with an `instructions_for_agent` prompt, mirroring the
market_validator tool contract.
"""

import json
import re


def _parse_money(text: str) -> float | None:
    """Parse '$1.2M', '400k', '1,200' → float dollars. None if unparseable."""
    if not text:
        return None
    m = re.search(r"\$?\s*([\d,\.]+)\s*([bmk]?)", str(text).strip(), re.IGNORECASE)
    if not m:
        return None
    try:
        raw = float(m.group(1).replace(",", ""))
    except ValueError:
        return None
    mult = {"b": 1e9, "m": 1e6, "k": 1e3, "": 1.0}.get(m.group(2).lower(), 1.0)
    return raw * mult


def _fmt(value: float | None) -> str:
    if value is None:
        return "n/a"
    if value >= 1e9:
        return f"${value / 1e9:.1f}B"
    if value >= 1e6:
        return f"${value / 1e6:.1f}M"
    if value >= 1e3:
        return f"${value / 1e3:.0f}K"
    return f"${value:,.0f}"


def analyze_financials(
    revenue: str,
    cac: str,
    ltv: str,
    monthly_burn: str,
    cash_in_bank: str,
    gross_margin: str = "",
    context: str = "",
) -> str:
    """
    Build financial-narrative context for the dashboard endpoint.

    Args:
        revenue: MRR or ARR, e.g. "$40K MRR" or "pre-revenue".
        cac: Customer acquisition cost, e.g. "$1,200".
        ltv: Lifetime value, e.g. "$4,800".
        monthly_burn: Net monthly burn, e.g. "$60K".
        cash_in_bank: Current cash, e.g. "$720K".
        gross_margin: Gross margin %, e.g. "78%" (optional).
        context: Any extra context (optional).

    Returns:
        JSON string with computed metrics, flags, and instructions_for_agent.
    """
    cac_v = _parse_money(cac)
    ltv_v = _parse_money(ltv)
    burn_v = _parse_money(monthly_burn)
    cash_v = _parse_money(cash_in_bank)

    ltv_cac = round(ltv_v / cac_v, 2) if (cac_v and ltv_v and cac_v > 0) else None
    runway = round(cash_v / burn_v, 1) if (burn_v and cash_v and burn_v > 0) else None

    flags = []
    if ltv_cac is not None:
        if ltv_cac < 1:
            flags.append(f"LTV:CAC is {ltv_cac}:1 — you lose money on every customer. Blocking issue for investors.")
        elif ltv_cac < 3:
            flags.append(f"LTV:CAC is {ltv_cac}:1 — below the 3:1 investors expect; unit economics look thin.")
    if runway is not None and runway < 6:
        flags.append(f"Runway is ~{runway} months — you're raising from a position of weakness. Investors will sense urgency.")
    elif runway is not None and runway < 12:
        flags.append(f"Runway is ~{runway} months — tight; aim to close before you drop under 6.")

    gm_v = None
    gm_match = re.search(r"(\d+(?:\.\d+)?)", gross_margin or "")
    if gm_match:
        gm_v = float(gm_match.group(1))
        if gm_v < 50:
            flags.append(f"Gross margin {gm_v:.0f}% is low for a venture-scale story — investors prefer 70%+ for SaaS.")

    computed = {
        "ltv_cac_ratio": ltv_cac,
        "ltv_cac_formatted": f"{ltv_cac}:1" if ltv_cac is not None else "n/a",
        "runway_months": runway,
        "cac_formatted": _fmt(cac_v),
        "ltv_formatted": _fmt(ltv_v),
        "monthly_burn_formatted": _fmt(burn_v),
        "cash_formatted": _fmt(cash_v),
        "gross_margin_pct": gm_v,
    }

    result = {
        **computed,
        "automatic_flags": flags,
        "instructions_for_agent": (
            "You are Pitchmate's Financial Narrative Coach. Founders hand you raw numbers; "
            "you turn them into the crisp unit-economics story VCs use to make decisions.\n\n"
            f"Revenue: {revenue or 'pre-revenue'}. CAC: {cac or 'n/a'}. LTV: {ltv or 'n/a'}. "
            f"Monthly burn: {monthly_burn or 'n/a'}. Cash: {cash_in_bank or 'n/a'}. "
            f"Gross margin: {gross_margin or 'n/a'}. Context: {context or 'none'}.\n"
            f"Computed — LTV:CAC = {computed['ltv_cac_formatted']}, runway = "
            f"{runway if runway is not None else 'n/a'} months. "
            f"Automatic flags: {flags if flags else 'none'}.\n\n"
            "Do NOT recompute the ratio or runway — use the computed values above verbatim. "
            "Produce:\n"
            "1. narrative — a tight 3-5 sentence investor-facing financial story: what the numbers "
            "say about efficiency, why the model works (or the path to it), framed the way a founder "
            "would say it in a partner meeting. Reference the actual figures.\n"
            "2. strengths — what's genuinely fundable here.\n"
            "3. red_flags — what a sharp investor will attack (build on the automatic flags; add more).\n"
            "4. talking_points — 3-5 crisp lines the founder can say out loud to frame the economics "
            "confidently (e.g. how to defend CAC, payback period, path to profitability).\n"
            "5. benchmark_notes — one line on how these metrics compare to stage norms.\n"
            "Be specific and numerate; never generic. If pre-revenue, focus the narrative on efficiency "
            "of spend, leading indicators, and the credible path to first revenue."
        ),
    }
    return json.dumps(result, indent=2)
