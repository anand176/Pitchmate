"""
Agents router — Pitchmate AI co-pilot endpoint and artifact download.
"""

import os
from typing import Optional, Annotated
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from agents.session_context import get_session_context
from core.config import config
from db.base import get_db_session

logger = logging.getLogger("agents_backend")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/agents", tags=["Agents"])


class PitchmateRequest(BaseModel):
    query: str
    session_id: Optional[str] = None


class PitchmateResponse(BaseModel):
    status: str
    response: str
    session_id: str


def _build_enriched_query(query: str, profile_md: str, session_context: str) -> str:
    """Prepend persistent profile + optional session context to the user query."""
    parts: list[str] = []
    if profile_md:
        parts.append(profile_md)
    if session_context:
        parts.append("## Session Notes\n" + session_context)
    if not parts:
        return query
    return "\n\n".join(parts) + "\n\n---\n## User Question\n" + query


@router.post("/pitchmate", response_model=PitchmateResponse)
async def pitchmate(
    req: PitchmateRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    """
    Main Pitchmate agent endpoint.
    Auto-prepends the user's startup profile and session context to every query.
    """
    user_id = current_user["id"]
    logger.info(f"Pitchmate request: user={user_id}, session_id={req.session_id}, query={req.query[:80]}...")

    profile_md = ""
    try:
        from startup.router import get_profile_for_user, profile_to_markdown

        profile = await get_profile_for_user(db, user_id)
        profile_md = profile_to_markdown(profile)
    except Exception as exc:  # noqa: BLE001 — chat must not fail if profile lookup fails
        logger.warning("Could not load startup profile for chat: %s", exc)

    session_context = get_session_context(req.session_id)
    enriched_query = _build_enriched_query(req.query, profile_md, session_context)
    if profile_md:
        logger.info("Injected startup profile (%d chars) for user %s", len(profile_md), user_id)
    if session_context:
        logger.info(f"Injected session context ({len(session_context)} chars) for session {req.session_id}")

    try:
        from agents.agent_runner import handle_pitchmate_request

        response, actual_session_id = await handle_pitchmate_request(
            user_id=user_id,
            query=enriched_query,
            session_id=req.session_id,
        )

        return PitchmateResponse(
            status="success",
            response=response,
            session_id=actual_session_id,
        )

    except Exception as e:
        logger.error(f"Pitchmate agent error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process request: {str(e)}",
        )


def _safe_artifact_filename(name: str) -> bool:
    """Allow only simple filenames (no path traversal)."""
    if not name or ".." in name or os.path.sep in name or "/" in name or "\\" in name:
        return False
    return name.endswith((".pdf", ".txt", ".docx"))


@router.get("/artifacts/download/{filename}")
async def download_artifact(
    filename: str,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """
    Download an artifact file (e.g. due diligence Q&A PDF, executive summary PDF) by filename.
    Files are stored in the artifacts directory. Only .pdf and .txt are allowed.
    """
    if not _safe_artifact_filename(filename):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")
    root = config.artifacts_root_dir
    filepath = os.path.join(root, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    if filename.lower().endswith(".pdf"):
        media_type = "application/pdf"
    elif filename.lower().endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        media_type = "text/plain"
    return FileResponse(filepath, filename=filename, media_type=media_type)
