"""
Startup context router — stores and retrieves startup idea per chat session.

Context is kept in the session only (in-memory), not in the database.
It is automatically prepended to every agent query for that session in agents/backend.py.

Endpoints:
  POST /agents/context         — save context from JSON body
  POST /agents/context/upload-file — save context from uploaded PDF or DOCX file
  GET  /agents/context         — get context for session_id
"""

import uuid
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
import logging

from auth.dependencies import get_current_user
from agents.session_context import set_session_context, get_session_context
from knowledge_base.router import _extract_text_from_file

logger = logging.getLogger("context_router")
router = APIRouter(prefix="/agents/context", tags=["Context"])


class ContextRequest(BaseModel):
    context: str  # The startup idea / context text
    session_id: Optional[str] = None  # If omitted, a new session id is created and returned


class ContextResponse(BaseModel):
    context: str
    message: str = "ok"
    session_id: Optional[str] = None  # Present so client can use it for subsequent chat


@router.post("", response_model=ContextResponse)
async def save_context(
    req: ContextRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """Save startup context for this chat session. If no session_id, one is created and returned."""
    user_id = current_user["id"]
    session_id = req.session_id or str(uuid.uuid4())
    set_session_context(session_id, req.context.strip())
    logger.info(f"Saved startup context for session {session_id} (user {user_id})")
    return ContextResponse(
        context=req.context.strip(),
        message="Context saved for this chat session",
        session_id=session_id,
    )


@router.post("/upload-file", response_model=ContextResponse)
async def save_context_from_file(
    file: Annotated[UploadFile, File()],
    current_user: Annotated[dict, Depends(get_current_user)],
    session_id: Annotated[Optional[str], Form()] = None,
):
    """Save startup context from an uploaded PDF or DOCX. Extract text and store for this chat session."""
    fn = (file.filename or "").strip().lower()
    if not fn.endswith(".pdf") and not fn.endswith(".docx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are allowed.",
        )
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File is empty.")
    try:
        text = _extract_text_from_file(content, fn)
    except Exception as exc:
        logger.warning(f"Extract text from file failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not extract text from file: {exc}",
        ) from exc
    if not (text or "").strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the file.")
    sid = session_id or str(uuid.uuid4())
    set_session_context(sid, text.strip())
    logger.info(f"Saved startup context from file for session {sid} (user {current_user['id']})")
    return ContextResponse(
        context=text.strip(),
        message="Context saved from file for this chat session",
        session_id=sid,
    )


@router.get("", response_model=ContextResponse)
async def get_context(
    current_user: Annotated[dict, Depends(get_current_user)],
    session_id: Optional[str] = None,
):
    """Retrieve startup context for the given session. Pass session_id to get that chat's context."""
    if not session_id:
        return ContextResponse(context="", message="No session_id provided")
    context = get_session_context(session_id)
    return ContextResponse(context=context, message="ok" if context else "No context for this session")
