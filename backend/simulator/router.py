"""
Call-practice simulator router — roleplay a sales/investor call against a
persona, turn by turn, with optional ElevenLabs voice for the persona's side.

Endpoints:
  GET  /simulator/scenarios  — available personas + whether voice is configured
  POST /simulator/start      — opening line for a fresh call
  POST /simulator/turn       — score the founder's last answer + persona's next line
  POST /simulator/speak      — text -> MP3 bytes (ElevenLabs), proxied so the API key never leaves the server
  GET  /simulator/history    — the team's past practice sessions
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from core.config import config
from db.base import get_db_session
from simulator import store
from simulator.personas import MAX_TURNS, PERSONAS, PERSONAS_BY_ID
from simulator.schemas import (
    PracticeHistoryResponse,
    PracticeSessionSummary,
    ScenarioOption,
    ScenariosResponse,
    SimulatorStartRequest,
    SimulatorStartResponse,
    SimulatorTurnRequest,
    SimulatorTurnResponse,
    SpeakRequest,
    TranscriptTurn,
    _OpeningLine,
    _TurnEval,
)
from simulator.tts import TTSNotConfigured, synthesize_speech

logger = logging.getLogger("simulator_router")
router = APIRouter(prefix="/simulator", tags=["Simulator"])


def _resolve_persona(scenario_id: str, custom_persona: str | None):
    persona = PERSONAS_BY_ID.get(scenario_id)
    if persona is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown scenario_id.")
    prompt = persona.prompt
    if scenario_id == "custom":
        if not (custom_persona or "").strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="custom_persona is required for the custom scenario.",
            )
        prompt = f"{prompt}\n\nPersona to play: {custom_persona.strip()}"
    return persona, prompt


async def _profile_markdown(db: AsyncSession, team_id: str) -> str:
    from startup.router import get_profile_for_user, profile_to_markdown

    try:
        profile = await get_profile_for_user(db, team_id)
        return profile_to_markdown(profile) or "No startup profile filled in yet — ask generic but pointed questions."
    except Exception:  # noqa: BLE001 — simulator must still work without a profile
        return "No startup profile available."


@router.get("/scenarios", response_model=ScenariosResponse)
async def list_scenarios(current_user: Annotated[dict, Depends(get_current_user)]):
    return ScenariosResponse(
        scenarios=[ScenarioOption(id=p.id, label=p.label, description=p.description) for p in PERSONAS],
        voice_enabled=config.voice_simulator_enabled,
    )


@router.post("/start", response_model=SimulatorStartResponse)
async def start_call(
    body: SimulatorStartRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    from dashboard.router import _structured_completion

    persona, prompt = _resolve_persona(body.scenario_id, body.custom_persona)
    profile_md = await _profile_markdown(db, current_user["team_id"])

    instructions = (
        f"{prompt}\n\nTone/voice: {persona.voice_style}.\n\n"
        f"Here is the founder's startup, so your questions are grounded in specifics, not generic:\n{profile_md}\n\n"
        "Open the call now with one in-character line — a greeting plus your first question or opening remark. "
        "Keep it to 1-3 sentences, natural spoken language (this will be read aloud)."
    )
    try:
        result = await _structured_completion(
            instructions, _OpeningLine, "simulator_agent", endpoint="simulator_start"
        )
        return SimulatorStartResponse(
            scenario_id=persona.id, scenario_label=persona.label, opening_line=result.opening_line
        )
    except Exception as exc:
        logger.error("Simulator start failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not start the call: {exc}")


def _format_transcript(transcript: list[TranscriptTurn]) -> str:
    lines = []
    for turn in transcript:
        speaker = "Them" if turn.role == "persona" else "You"
        lines.append(f"{speaker}: {turn.text}")
    return "\n".join(lines) if lines else "(this is the founder's first answer on the call)"


@router.post("/turn", response_model=SimulatorTurnResponse)
async def take_turn(
    body: SimulatorTurnRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    from dashboard.router import _structured_completion

    if not body.answer.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="answer is required.")

    persona, prompt = _resolve_persona(body.scenario_id, body.custom_persona)
    profile_md = await _profile_markdown(db, current_user["team_id"])
    turns_so_far = sum(1 for t in body.transcript if t.role == "user") + 1
    force_close = turns_so_far >= MAX_TURNS

    instructions = (
        f"{prompt}\n\nTone/voice: {persona.voice_style}.\n\n"
        f"Startup context:\n{profile_md}\n\n"
        f"Call so far:\n{_format_transcript(body.transcript)}\n\n"
        f"Founder's latest answer: \"{body.answer.strip()}\"\n\n"
        "First, privately score that answer 1-10 and give one honest, specific coaching sentence — this is "
        "NOT shown to the persona, it's feedback to the founder. Then, fully in character, react and either "
        f"ask your next question/objection, or — this is turn {turns_so_far} of a call that should naturally "
        f"wrap up within about {MAX_TURNS} exchanges{' (wrap it up NOW)' if force_close else ''} — bring the "
        "call to a natural close if enough ground has been covered. When you close the call (call_over=true), "
        "also set overall_score (1-10 across the whole call), a 2-3 sentence closing_summary, 2-3 strengths, "
        "and 2-3 improvements for next time."
    )
    try:
        result: _TurnEval = await _structured_completion(
            instructions, _TurnEval, "simulator_agent", endpoint="simulator_turn"
        )
    except Exception as exc:
        logger.error("Simulator turn failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not process that turn: {exc}")

    call_over = result.call_over or force_close
    session_id = None
    if call_over:
        full_transcript = [t.model_dump() for t in body.transcript]
        full_transcript.append({"role": "user", "text": body.answer.strip(), "score": result.score, "feedback": result.feedback})
        full_transcript.append({"role": "persona", "text": result.persona_message})
        try:
            saved = await store.create_session(
                db, current_user["team_id"], current_user["id"],
                scenario_id=persona.id,
                scenario_label=persona.label,
                overall_score=result.overall_score,
                summary=result.closing_summary,
                transcript=full_transcript,
            )
            session_id = saved.id
        except Exception as exc:  # noqa: BLE001 — don't fail the response just because history-save failed
            logger.warning("Could not save practice session: %s", exc)

    return SimulatorTurnResponse(
        feedback=result.feedback,
        score=result.score,
        persona_message=result.persona_message,
        call_over=call_over,
        overall_score=result.overall_score,
        closing_summary=result.closing_summary,
        strengths=result.strengths,
        improvements=result.improvements,
        session_id=session_id,
    )


@router.post("/speak")
async def speak(body: SpeakRequest, current_user: Annotated[dict, Depends(get_current_user)]):
    """Proxy text -> MP3 via ElevenLabs so the API key/voice ID stay server-side."""
    if not body.text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="text is required.")
    try:
        audio = await synthesize_speech(body.text.strip())
        return Response(content=audio, media_type="audio/mpeg")
    except TTSNotConfigured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice isn't configured yet — set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID.",
        )
    except Exception as exc:
        logger.error("Simulator speak failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Voice synthesis failed: {exc}")


@router.get("/history", response_model=PracticeHistoryResponse)
async def get_history(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    rows = await store.list_sessions(db, current_user["team_id"])
    return PracticeHistoryResponse(sessions=[
        PracticeSessionSummary(
            id=r.id,
            scenario_id=r.scenario_id,
            scenario_label=r.scenario_label,
            overall_score=r.overall_score,
            summary=r.summary,
            created_at=r.created_at.isoformat() if r.created_at else None,
            created_by_user_id=r.created_by_user_id,
        )
        for r in rows
    ])
