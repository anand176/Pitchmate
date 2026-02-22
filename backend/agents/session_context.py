"""
In-memory store for startup context per chat session.
Context is kept in the session only (not persisted to DB).
"""

from typing import Optional

# session_id -> context text (plain string)
_SESSION_CONTEXT: dict[str, str] = {}


def set_session_context(session_id: str, context: str) -> None:
    """Store startup context for the given session."""
    _SESSION_CONTEXT[session_id] = context


def get_session_context(session_id: Optional[str]) -> str:
    """Return startup context for the given session, or empty string."""
    if not session_id:
        return ""
    return _SESSION_CONTEXT.get(session_id, "")
