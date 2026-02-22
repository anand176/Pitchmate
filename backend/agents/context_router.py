"""
Startup context router — stores and retrieves startup idea per chat session.

Context is kept in the session only (in-memory), not in the database.
It is automatically prepended to every agent query for that session in agents/backend.py.
"""

import uuid
from typing import Annotated, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import logging

from auth.dependencies import get_current_user
from agents.session_context import set_session_context, get_session_context

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
