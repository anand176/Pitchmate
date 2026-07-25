"""Pydantic schemas for the call-practice simulator."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class ScenarioOption(BaseModel):
    id: str
    label: str
    description: str


class ScenariosResponse(BaseModel):
    scenarios: list[ScenarioOption]
    voice_enabled: bool = Field(..., description="Whether ELEVENLABS_API_KEY/ELEVENLABS_VOICE_ID are configured.")


class SimulatorStartRequest(BaseModel):
    scenario_id: str
    # Only used when scenario_id == "custom" — the founder's own description
    # of who/what they want to practice against.
    custom_persona: Optional[str] = None


class SimulatorStartResponse(BaseModel):
    scenario_id: str
    scenario_label: str
    opening_line: str


class TranscriptTurn(BaseModel):
    role: Literal["persona", "user"]
    text: str


class SimulatorTurnRequest(BaseModel):
    scenario_id: str
    custom_persona: Optional[str] = None
    transcript: list[TranscriptTurn] = Field(default_factory=list)
    answer: str


class SimulatorTurnResponse(BaseModel):
    feedback: str = Field("", description="One-line coaching note on the founder's last answer.")
    score: Optional[int] = Field(None, ge=1, le=10, description="Score for that single answer, 1-10.")
    persona_message: str = Field(..., description="The persona's in-character reply/next question (spoken aloud).")
    call_over: bool = False
    overall_score: Optional[int] = Field(None, ge=1, le=10)
    closing_summary: Optional[str] = None
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    session_id: Optional[str] = Field(None, description="Set once call_over=true — the saved PracticeSession id.")


# ─── LLM structured-output shape (internal) ──────────────────────────────────

class _TurnEval(BaseModel):
    feedback: str = Field(..., description="One encouraging-but-honest sentence of coaching on the founder's last answer.")
    score: int = Field(..., ge=1, le=10, description="Score for that single answer, 1 (weak) to 10 (excellent).")
    persona_message: str = Field(
        ..., description="What the persona says next, fully in character — a reaction plus the next question/objection."
    )
    call_over: bool = Field(
        False, description="True once the call has run its natural course (typically after several exchanges)."
    )
    overall_score: Optional[int] = Field(None, ge=1, le=10, description="Only set when call_over=true.")
    closing_summary: Optional[str] = Field(None, description="Only set when call_over=true — 2-3 sentence overall debrief.")
    strengths: list[str] = Field(default_factory=list, description="Only set when call_over=true.")
    improvements: list[str] = Field(default_factory=list, description="Only set when call_over=true.")


class _OpeningLine(BaseModel):
    opening_line: str = Field(..., description="The persona's opening line/question to start the call, in character.")


class SpeakRequest(BaseModel):
    text: str


class PracticeSessionSummary(BaseModel):
    id: str
    scenario_id: str
    scenario_label: str
    overall_score: Optional[int] = None
    summary: Optional[str] = None
    created_at: Optional[str] = None
    created_by_user_id: str


class PracticeHistoryResponse(BaseModel):
    sessions: list[PracticeSessionSummary]
