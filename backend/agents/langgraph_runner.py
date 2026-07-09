"""
LangGraph runner infrastructure for Pitchmate agents.
Replaces Google ADK Runner with LangGraph execution, checkpointing, and session management.
"""

import logging
import os
import re
import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import HTTPException
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.checkpoint.memory import MemorySaver
from psycopg_pool import AsyncConnectionPool
from psycopg.rows import dict_row

from agents.guardrails_langgraph import find_blocked_keyword
from core.config import config
from core.mlflow_tracking import MLflowCallbackHandler, log_metric, log_params, track_run

logger = logging.getLogger("langgraph_runner")

# Configuration
_DB_URL = config.get_database_url()
_ARTIFACTS_ROOT_DIR = config.artifacts_root_dir

# Singleton checkpointer (initialized once, reused across requests)
_checkpointer: AsyncPostgresSaver | MemorySaver | None = None

# Underlying connection pool backing the Postgres checkpointer (needs explicit
# close on shutdown; None when using the in-memory fallback).
_pool: AsyncConnectionPool | None = None

# Cache for compiled agents (keyed by agent_name)
_agent_cache: dict[str, any] = {}


async def get_checkpointer() -> AsyncPostgresSaver | MemorySaver:
    """
    Get or create the checkpointer instance for session persistence.
    Uses PostgreSQL if DATABASE_URL is set, otherwise in-memory.

    Note: `AsyncPostgresSaver.from_conn_string()` is an async context manager and
    cannot be awaited/used directly outside of `async with` — doing so silently
    yields a context-manager object with no usable `.setup()`. For a long-lived
    singleton (as needed here, shared across requests), we instead open our own
    `AsyncConnectionPool` and construct `AsyncPostgresSaver(pool)` directly, per
    the LangGraph-recommended production pattern.
    """
    global _checkpointer, _pool
    if _checkpointer is None:
        if _DB_URL:
            try:
                _pool = AsyncConnectionPool(
                    conninfo=_DB_URL,
                    max_size=20,
                    kwargs={"autocommit": True, "row_factory": dict_row},
                    open=False,
                )
                await _pool.open()
                _checkpointer = AsyncPostgresSaver(_pool)
                # Must be called once so the checkpoint tables/migrations exist.
                await _checkpointer.setup()
                logger.info("PostgreSQL checkpointer initialized")
            except Exception as e:
                logger.warning(f"PostgreSQL checkpointer failed: {e}, using in-memory")
                if _pool is not None:
                    await _pool.close()
                    _pool = None
                _checkpointer = MemorySaver()
        else:
            logger.info("No DATABASE_URL, using in-memory checkpointer")
            _checkpointer = MemorySaver()
    return _checkpointer


def get_artifacts_dir(user_id: str, session_id: str) -> Path:
    """Get or create the artifacts directory for a session."""
    artifacts_path = Path(_ARTIFACTS_ROOT_DIR) / user_id / session_id
    artifacts_path.mkdir(parents=True, exist_ok=True)
    return artifacts_path


def cache_agent(agent_name: str, compiled_agent: Any):
    """Cache a compiled LangGraph agent."""
    _agent_cache[agent_name] = compiled_agent
    logger.info(f"Cached agent: {agent_name}")


def get_cached_agent(agent_name: str) -> Any | None:
    """Get a cached compiled agent."""
    return _agent_cache.get(agent_name)


def _clean_response(text: str) -> str:
    """
    Clean up agent response by removing technical markers and reasoning blocks.
    Mirrors the original ADK runner's cleaning logic.
    """
    # Filter out technical markers
    text = text.replace("/*FINAL_ANSWER*/", "")
    text = text.replace("/FINAL_ANSWER/", "")

    # Remove /*REASONING*/ block up to next paragraph
    text = re.sub(r'/\*REASONING\*/\s*.*?(?=\n\n)', '', text, flags=re.DOTALL)
    text = re.sub(r'/\*REASONING\*/\s*\n?\s*[^\n]*', '', text)

    # Remove /REASONING/ ... /FINAL_ANSWER/ block
    text = re.sub(r'/REASONING/.*?/FINAL_ANSWER/', '', text, flags=re.DOTALL)

    # Remove /REASONING/ block
    text = re.sub(r'/REASONING\s*/\s*.*?(?=\n\n)', '', text, flags=re.DOTALL)
    text = re.sub(r'/REASONING\s*/\s*\n?\s*[^\n]*', '', text)
    text = re.sub(r'/REASONING\s*/', '', text, flags=re.IGNORECASE)
    text = text.replace("/FINAL_ANSWER/", "")

    # Remove remaining /*REASONING*/ or /REASONING/ tags
    text = re.sub(r'/\*REASONING\*/', '', text, flags=re.IGNORECASE)

    # Remove agent-name lead-in paragraph
    text = re.sub(
        r'The\s+`?\s*\w+_agent\s*`?\s+has\s+provided.*?(?=\n\n|Here are the|Summary:|Your |The following)',
        '',
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )
    text = re.sub(
        r'(?m)^\s*The\s+`?\s*\w+_agent\s*`?\s+has\s+provided[^.]*\.\s*',
        '',
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r'The\s+`?\s*\w+_agent\s*`?\s+has\s+provided[^.]*\.\s*',
        '',
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r'\b\w+_agent\s+has\s+provided[^.]*\.\s*',
        '',
        text,
        flags=re.IGNORECASE,
    )

    return text.strip()


async def run_agent(
    compiled_agent: Any,
    user_id: str,
    session_id: str,
    query: str,
    agent_name: str = "agent",
) -> str:
    """
    Execute a LangGraph agent with the given query.
    
    Args:
        compiled_agent: Compiled LangGraph agent
        user_id: User identifier
        session_id: Session identifier for checkpointing
        query: User query/message
        agent_name: Name of the agent (for logging)
        
    Returns:
        Agent's final response text
    """
    # Hard-block check (mirrors the original Google ADK keyword guardrail, which
    # LangChain callbacks alone cannot replicate since they can only observe/log —
    # see agents.guardrails_langgraph.find_blocked_keyword docstring).
    blocked_keyword = find_blocked_keyword(query)
    if blocked_keyword:
        logger.warning(f"[{agent_name}] Blocked request containing keyword '{blocked_keyword}'")
        async with track_run(
            run_name=f"blocked-{agent_name}",
            run_type="agent_chat",
            params={
                "agent_name": agent_name,
                "user_id": user_id,
                "session_id": session_id,
                "query_length": len(query),
                "blocked_keyword": blocked_keyword,
            },
            tags={"agent": agent_name, "blocked": "true"},
        ):
            log_metric("blocked", 1)
        return (
            f"I'm sorry, I cannot process this request because it contains the "
            f"blocked keyword '{blocked_keyword}'."
        )

    checkpointer = await get_checkpointer()

    mlflow_cb = MLflowCallbackHandler(agent_name=agent_name)

    async with track_run(
        run_name=f"{agent_name}-{session_id[:8]}",
        run_type="agent_chat",
        params={
            "agent_name": agent_name,
            "user_id": user_id,
            "session_id": session_id,
            "query_length": len(query),
            "model": config.agents.get_model_for_agent(agent_name),
        },
        tags={"agent": agent_name},
    ):
        # Create thread config for checkpointing (+ runtime MLflow callbacks)
        config_dict = {
            "configurable": {
                "thread_id": f"{user_id}:{session_id}",
                "checkpoint_ns": agent_name,
            },
            "callbacks": [mlflow_cb],
        }

        input_state = {"messages": [HumanMessage(content=query)]}

        try:
            final_state = await compiled_agent.ainvoke(
                input_state,
                config=config_dict,
            )

            messages = final_state.get("messages", [])
            if not messages:
                log_metric("response_length", 0)
                return "Agent did not produce a response."

            last_message = messages[-1]
            if isinstance(last_message, AIMessage):
                response_text = last_message.content
            else:
                response_text = str(last_message)

            cleaned_response = _clean_response(response_text)
            log_params({"message_count": len(messages)})
            log_metric("response_length", len(cleaned_response or ""))
            mlflow_cb.flush_summary_metrics()
            return cleaned_response if cleaned_response else "Agent completed without a final response."

        except Exception as e:
            logger.error(f"Agent {agent_name} execution failed: {e}", exc_info=True)
            mlflow_cb.flush_summary_metrics()
            raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")


async def handle_agent_request(
    user_id: str,
    query: str,
    compiled_agent: Any,
    agent_name: str,
    session_id: Optional[str] = None,
) -> tuple[str, str]:
    """
    Handle an agent request with automatic session management.
    
    Args:
        user_id: User identifier
        query: User query
        compiled_agent: Compiled LangGraph agent
        agent_name: Name of the agent
        session_id: Optional session ID (creates new if not provided)
        
    Returns:
        Tuple of (response_text, session_id)
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
    
    logger.info(f"Agent request: user={user_id}, agent={agent_name}, session={session_id}")
    
    # Execute the agent
    response = await run_agent(
        compiled_agent=compiled_agent,
        user_id=user_id,
        session_id=session_id,
        query=query,
        agent_name=agent_name,
    )
    
    logger.info(f"Agent request completed: user={user_id}, agent={agent_name}")
    return response, session_id


async def cleanup_checkpointer():
    """Cleanup checkpointer resources (call on app shutdown)."""
    global _checkpointer, _pool
    if _pool is not None:
        await _pool.close()
        logger.info("Postgres checkpointer connection pool closed")
    _checkpointer = None
    _pool = None
