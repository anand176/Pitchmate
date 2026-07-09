"""
Pitchmate agent runner — migrated to LangGraph from Google ADK.
Handles agent execution with session management, checkpointing, and memory.
"""

import logging
import uuid
from typing import Any, Optional

from core.config import config
from fastapi import HTTPException
from agents.langgraph_runner import handle_agent_request, run_agent, get_checkpointer

logger = logging.getLogger("pitchmate_runner")

# Configuration
_DB_URL = config.get_database_url()
_ARTIFACTS_ROOT_DIR = config.artifacts_root_dir

# Cache for compiled agents (keyed by agent_name)
_agent_cache: dict[str, Any] = {}


def register_agent(agent_name: str, compiled_agent: Any):
    """
    Register a compiled LangGraph agent for use by the runner.
    
    Args:
        agent_name: Name identifier for the agent
        compiled_agent: Compiled LangGraph agent
    """
    _agent_cache[agent_name] = compiled_agent
    logger.info(f"Registered agent: {agent_name}")


def get_registered_agent(agent_name: str) -> Any | None:
    """
    Get a registered compiled agent by name.
    
    Args:
        agent_name: Name of the agent
        
    Returns:
        Compiled agent or None if not found
    """
    return _agent_cache.get(agent_name)


async def handle_pitchmate_request(
    user_id: str,
    query: str,
    session_id: Optional[str] = None,
) -> tuple[str, str]:
    """
    Handle a request to the main Pitchmate orchestrator agent.
    
    Args:
        user_id: User identifier
        query: User query/message
        session_id: Optional session ID (creates new if not provided)
        
    Returns:
        Tuple of (response_text, session_id)
    """
    # Prefer the checkpointer-backed instance built during app startup
    # (see app.py lifespan); fall back to the memory-only module default for
    # contexts where the lifespan never ran (e.g. scripts, tests).
    from agents.langgraph_runner import get_cached_agent
    from agents.agent import pitchmate_agent as _default_pitchmate_agent

    compiled_agent = get_cached_agent("pitchmate_agent") or _default_pitchmate_agent

    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if not session_id:
        session_id = str(uuid.uuid4())
    
    logger.info(f"Pitchmate request: user={user_id}, session={session_id}")
    
    # Execute the agent
    response = await run_agent(
        compiled_agent=compiled_agent,
        user_id=user_id,
        session_id=session_id,
        query=query,
        agent_name="pitchmate_agent",
    )
    
    logger.info(f"Pitchmate request completed: user={user_id}")
    return response, session_id


async def cleanup():
    """Cleanup resources (call on app shutdown)."""
    from agents.langgraph_runner import cleanup_checkpointer
    await cleanup_checkpointer()
    logger.info("Runner cleanup completed")

