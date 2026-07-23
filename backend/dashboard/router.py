"""
Dashboard router — structured (non-chat) endpoints for the Pitchmate dashboard tabs.

Each endpoint reuses the same deterministic pre-computation as the corresponding
chat sub-agent tool (e.g. `market_validator/tools.py`), then asks an LLM configured
with `.with_structured_output(...)` to produce a typed JSON response matching the
Pydantic schemas in `dashboard/schemas.py` — instead of the freeform chat text the
`/agents/pitchmate` endpoint returns.

Endpoints:
  POST /dashboard/market       — TAM/SAM/SOM validation
  POST /dashboard/competition  — competitive landscape analysis
  POST /dashboard/gtm          — go-to-market plan
  POST /dashboard/investors    — investor targeting strategy
  POST /dashboard/valuation    — pre-money valuation estimate
  POST /dashboard/deck         — structured deck section drafting
  POST /dashboard/deck/export  — generate a PDF/DOCX deck artifact (download link)
"""

import json
import logging
from typing import Annotated, TypeVar

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from agents.langgraph_base import create_google_llm
from core.config import config
from core.mlflow_tracking import MLflowCallbackHandler, log_metric, log_params, track_run
from db.base import get_db_session
from dashboard.store import get_analyses, save_analysis
from dashboard.schemas import (
    CompetitionRequest,
    CompetitionResult,
    DeckExportRequest,
    DeckExportResult,
    DeckRequest,
    DeckResult,
    FinanceRequest,
    FinanceResult,
    GTMRequest,
    GTMResult,
    InvestorRequest,
    InvestorResult,
    MarketSizeRequest,
    MarketSizeResult,
    MeetingDebriefRequest,
    MeetingDebriefResult,
    SavedAnalysis,
    SavedAnalysesResponse,
    TractionRequest,
    TractionResult,
    ValuationRequest,
    ValuationResult,
)

logger = logging.getLogger("dashboard_router")
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

SchemaT = TypeVar("SchemaT", bound=BaseModel)


async def _structured_completion(
    instructions: str,
    schema: type[SchemaT],
    agent_name: str,
    *,
    endpoint: str,
) -> SchemaT:
    """
    Ask a Gemini LLM to produce output matching `schema`, given `instructions` built
    from the same deterministic context the chat sub-agent tools already compute.

    Gemini occasionally responds without an explicit tool call (especially for
    schemas with several nested list fields), which makes LangChain's
    `PydanticToolsParser` return `None` instead of raising. We retry a couple of
    times before giving up, since this is intermittent, not a real dead end.
    """
    model_name = config.agents.get_model_for_agent(agent_name)
    mlflow_cb = MLflowCallbackHandler(agent_name=agent_name)

    async with track_run(
        run_name=f"dashboard-{endpoint}",
        run_type="dashboard",
        params={
            "endpoint": endpoint,
            "agent_name": agent_name,
            "model": model_name,
            "prompt_length": len(instructions),
        },
        tags={"endpoint": endpoint, "agent": agent_name},
    ):
        llm = create_google_llm(
            model=model_name,
            temperature=0.3,
            max_retries=2,
        ).with_config(callbacks=[mlflow_cb])
        structured_llm = llm.with_structured_output(schema)

        last_error: Exception | None = None
        attempts_used = 0
        for attempt in range(3):
            attempts_used = attempt + 1
            try:
                result = await structured_llm.ainvoke(instructions)
            except Exception as exc:  # noqa: BLE001 - retry regardless of exact cause
                last_error = exc
                continue
            if result is not None:
                log_params({"attempts": attempts_used})
                log_metric("result_fields", len(schema.model_fields))
                mlflow_cb.flush_summary_metrics()
                return result
            last_error = RuntimeError("Model response did not include a structured tool call")

        mlflow_cb.flush_summary_metrics()
        raise RuntimeError(f"Failed to get a structured response after 3 attempts: {last_error}")


def _raise_500(exc: Exception, action: str):
    logger.error(f"Dashboard {action} failed: {exc}", exc_info=True)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"{action} failed: {str(exc)}",
    )


# ─── Market ──────────────────────────────────────────────────────────────────

@router.post("/market", response_model=MarketSizeResult)
async def analyze_market(
    req: MarketSizeRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Validate TAM/SAM/SOM claims and return a structured assessment."""
    from agents.sub_agents.market_validator.tools import validate_market_size

    try:
        context = json.loads(validate_market_size(req.tam, req.sam, req.som, req.description))
        result = await _structured_completion(
            context["instructions_for_agent"], MarketSizeResult, "dashboard_market_agent", endpoint="market"
        )
        result.automatic_flags = context.get("automatic_flags", [])
        await save_analysis(db, current_user["id"], "market", req.model_dump(), result.model_dump())
        return result
    except Exception as exc:
        _raise_500(exc, "Market analysis")


# ─── Competition ─────────────────────────────────────────────────────────────

@router.post("/competition", response_model=CompetitionResult)
async def analyze_competition(
    req: CompetitionRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Evaluate the competitive landscape and return a structured assessment."""
    from agents.sub_agents.market_validator.tools import assess_competition

    try:
        context = json.loads(assess_competition(req.competitors))
        result = await _structured_completion(
            context["instructions_for_agent"], CompetitionResult, "dashboard_competition_agent", endpoint="competition"
        )
        result.competitor_count = context.get("competitor_count", len(req.competitors))
        await save_analysis(db, current_user["id"], "competition", req.model_dump(), result.model_dump())
        return result
    except Exception as exc:
        _raise_500(exc, "Competition analysis")


# ─── GTM ─────────────────────────────────────────────────────────────────────

@router.post("/gtm", response_model=GTMResult)
async def build_gtm_plan(
    req: GTMRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Recommend a phased go-to-market strategy and return a structured plan."""
    from agents.sub_agents.market_validator.tools import suggest_gtm_strategy

    try:
        context = json.loads(suggest_gtm_strategy(req.product_description, req.target_market))
        result = await _structured_completion(
            context["instructions_for_agent"], GTMResult, "dashboard_gtm_agent", endpoint="gtm"
        )
        result.inferred_market_type = context.get("inferred_market_type", result.inferred_market_type)
        result.suggested_channels = context.get("suggested_channels", result.suggested_channels)
        result.suggested_pricing_models = context.get("suggested_pricing_models", result.suggested_pricing_models)
        await save_analysis(db, current_user["id"], "gtm", req.model_dump(), result.model_dump())
        return result
    except Exception as exc:
        _raise_500(exc, "GTM plan generation")


# ─── Investors ───────────────────────────────────────────────────────────────

@router.post("/investors", response_model=InvestorResult)
async def suggest_investors(
    req: InvestorRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Suggest relevant investor types/tiers for a startup's stage and industry."""
    from agents.sub_agents.investor_outreacher.tools import suggest_investor_types

    try:
        context = json.loads(suggest_investor_types(req.stage, req.industry))
        result = await _structured_completion(
            context["instructions_for_agent"], InvestorResult, "dashboard_investors_agent", endpoint="investors"
        )
        result.typical_check_size = context.get("typical_check_size", result.typical_check_size)
        await save_analysis(db, current_user["id"], "investors", req.model_dump(), result.model_dump())
        return result
    except Exception as exc:
        _raise_500(exc, "Investor targeting")


# ─── Valuation ───────────────────────────────────────────────────────────────

@router.post("/valuation", response_model=ValuationResult)
async def estimate_valuation_range(
    req: ValuationRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Estimate a pre-money valuation range with negotiation guidance."""
    from agents.sub_agents.valuation_advisor.tools import estimate_valuation

    try:
        context = json.loads(
            estimate_valuation(
                stage=req.stage,
                sector=req.sector,
                arr=req.arr or "",
                growth_rate_yoy=req.growth_rate_yoy or "",
                team_strength=req.team_strength,
                traction_strength=req.traction_strength,
            )
        )
        result = await _structured_completion(
            context["instructions_for_agent"], ValuationResult, "dashboard_valuation_agent", endpoint="valuation"
        )
        # Deterministic numbers always come from the computed context, not the LLM,
        # to guarantee the displayed range matches the stated methodology.
        result.valuation_low = context["estimated_valuation_low"]
        result.valuation_high = context["estimated_valuation_high"]
        result.valuation_low_formatted = context["estimated_valuation_low_formatted"]
        result.valuation_high_formatted = context["estimated_valuation_high_formatted"]
        result.methodology = context["methodology"]
        await save_analysis(db, current_user["id"], "valuation", req.model_dump(), result.model_dump())
        return result
    except Exception as exc:
        _raise_500(exc, "Valuation estimate")


# ─── Deck ────────────────────────────────────────────────────────────────────

@router.post("/deck", response_model=DeckResult)
async def draft_deck_sections(
    req: DeckRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Draft/polish pitch deck section copy from whatever content is provided."""
    from agents.sub_agents.deck_creator.tools import SECTION_ORDER, SECTION_TITLES

    provided = {k: v for k, v in req.model_dump().items() if k != "company_name" and v}
    instructions = (
        f"You are drafting/polishing pitch deck section copy for '{req.company_name}'. "
        f"Sections provided so far: {json.dumps(provided)}. "
        "For each of these sections — problem, solution, market_size, product, traction, "
        "business_model, gtm_strategy, competition — produce a concise, investor-ready paragraph "
        "(2-5 sentences). If content was provided for a section, polish/tighten it without changing "
        "the facts. If a section was NOT provided, write a clearly-labeled placeholder prompting the "
        "founder for that information (do not invent facts, funding numbers, or traction data). "
        "Return sections as a list of {key, title, content} objects, using these exact keys: "
        f"{SECTION_ORDER}, with titles: {SECTION_TITLES}."
    )
    try:
        result = await _structured_completion(instructions, DeckResult, "dashboard_deck_agent", endpoint="deck")
        result.company_name = req.company_name
        await save_analysis(db, current_user["id"], "deck", req.model_dump(), result.model_dump())
        return result
    except Exception as exc:
        _raise_500(exc, "Deck drafting")


@router.post("/deck/export", response_model=DeckExportResult)
async def export_deck(
    req: DeckExportRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """Generate a PDF or DOCX deck artifact from structured section content."""
    from agents.sub_agents.deck_creator.tools import create_deck_pdf, create_deck_docx

    content_json = json.dumps(req.model_dump(exclude={"format"}))
    try:
        async with track_run(
            run_name="dashboard-deck-export",
            run_type="dashboard",
            params={"endpoint": "deck/export", "format": req.format, "company_name": req.company_name},
            tags={"endpoint": "deck/export"},
        ):
            if req.format.lower() == "docx":
                message = create_deck_docx(content_json, company_name=req.company_name)
            else:
                message = create_deck_pdf(content_json, company_name=req.company_name)

            if "Download:" not in message:
                raise RuntimeError(message)
            filename = message.rsplit("Download:", 1)[-1].strip()
            log_metric("export_success", 1)
            return DeckExportResult(
                filename=filename,
                download_url=f"/agents/artifacts/download/{filename}",
            )
    except Exception as exc:
        _raise_500(exc, "Deck export")


# ─── Financial Narrative ─────────────────────────────────────────────────────

@router.post("/finance", response_model=FinanceResult)
async def coach_financials(
    req: FinanceRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Turn raw unit economics into an investor-facing financial narrative."""
    from agents.sub_agents.financial_narrative.tools import analyze_financials

    try:
        context = json.loads(
            analyze_financials(
                req.revenue or "", req.cac or "", req.ltv or "", req.monthly_burn or "",
                req.cash_in_bank or "", req.gross_margin or "", req.context or "",
            )
        )
        result = await _structured_completion(
            context["instructions_for_agent"], FinanceResult, "dashboard_finance_agent", endpoint="finance"
        )
        # Deterministic numbers come from the computed context, never the LLM.
        for key in ("ltv_cac_ratio", "ltv_cac_formatted", "runway_months", "cac_formatted",
                    "ltv_formatted", "monthly_burn_formatted", "cash_formatted", "gross_margin_pct"):
            setattr(result, key, context.get(key))
        result.automatic_flags = context.get("automatic_flags", [])
        await save_analysis(db, current_user["id"], "finance", req.model_dump(), result.model_dump())
        return result
    except Exception as exc:
        _raise_500(exc, "Financial narrative")


# ─── Traction Framing ────────────────────────────────────────────────────────

@router.post("/traction", response_model=TractionResult)
async def frame_traction_story(
    req: TractionRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Frame raw early traction into a credible momentum / social-proof narrative."""
    from agents.sub_agents.traction_framing.tools import frame_traction

    try:
        context = json.loads(
            frame_traction(req.metrics, req.customer_quotes or "", req.milestones or "", req.stage or "")
        )
        result = await _structured_completion(
            context["instructions_for_agent"], TractionResult, "dashboard_traction_agent", endpoint="traction"
        )
        await save_analysis(db, current_user["id"], "traction", req.model_dump(), result.model_dump())
        return result
    except Exception as exc:
        _raise_500(exc, "Traction framing")


# ─── Meeting Debrief ─────────────────────────────────────────────────────────

@router.post("/debrief", response_model=MeetingDebriefResult)
async def debrief_meeting(
    req: MeetingDebriefRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Read an investor meeting's signal (warm/lukewarm/dead) and recommend next steps."""
    from agents.sub_agents.meeting_debrief.tools import analyze_meeting_debrief

    try:
        context = json.loads(
            analyze_meeting_debrief(req.investor_name, req.investor_type, req.meeting_notes, req.ask or "")
        )
        result = await _structured_completion(
            context["instructions_for_agent"], MeetingDebriefResult, "dashboard_debrief_agent", endpoint="debrief"
        )
        await save_analysis(db, current_user["id"], "debrief", req.model_dump(), result.model_dump())
        return result
    except Exception as exc:
        _raise_500(exc, "Meeting debrief")


# ─── Saved analyses ──────────────────────────────────────────────────────────

@router.get("/results", response_model=SavedAnalysesResponse)
async def list_saved_analyses(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Return the latest saved analysis per module for the current user, so the
    dashboard can restore prior work and pre-fill forms on return."""
    rows = await get_analyses(db, current_user["id"])
    results = {
        row.module: SavedAnalysis(
            module=row.module,
            inputs=row.inputs or {},
            result=row.result or {},
            updated_at=row.updated_at.isoformat() if row.updated_at else None,
        )
        for row in rows
    }
    return SavedAnalysesResponse(
        results=results,
        completed_modules=sorted(results.keys()),
    )
