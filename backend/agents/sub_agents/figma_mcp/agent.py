"""
Figma MCP sub-agent — pitch deck visual design analysis via Figma MCP.

Must be initialized asynchronously (see `init_figma_agent`) during app lifespan.
Import-time `asyncio.run()` fails under uvicorn's running event loop.
"""

import logging
import os

from agents.langgraph_base import create_google_llm, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.mcp_integration import get_mcp_tools, get_npx_command, mcp_env_with_path
from agents.sub_agents.figma_mcp import prompt
from core.config import config

logger = logging.getLogger("figma_mcp_agent")

AGENT_NAME = "figma_mcp_agent"
AGENT_DESCRIPTION = (
    "Analyses pitch deck visual design using the Figma MCP tool. "
    "Use when the user shares a Figma link or asks for design feedback, "
    "layout review, slide visual critique, or brand consistency checks."
)

model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.3,
    max_retries=2,
)

# Populated by `init_figma_agent()` during FastAPI lifespan.
figma_mcp_agent = None


async def _get_figma_tools():
    """Fetch Figma MCP tools."""
    return await get_mcp_tools(
        command=get_npx_command(),
        args=["-y", "@figma/mcp"],
        env=mcp_env_with_path({
            "FIGMA_PERSONAL_ACCESS_TOKEN": os.environ.get("FIGMA_PERSONAL_ACCESS_TOKEN", ""),
        }),
        server_name="figma",
    )


async def init_figma_agent():
    """
    Build and cache the Figma agent. Safe to call from an async lifespan hook.
    Returns the compiled agent, or None if MCP/Node/token setup fails.
    """
    global figma_mcp_agent
    if figma_mcp_agent is not None:
        return figma_mcp_agent
    try:
        tools = await _get_figma_tools()
        if not tools:
            raise RuntimeError("Figma MCP returned no tools")
        figma_mcp_agent = create_react_agent(
            model=model,
            tools=tools,
            system_prompt=prompt.INSTRUCTION,
            agent_name=AGENT_NAME,
            callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
        )
        logger.info("Figma MCP agent initialized with tools: %s", [t.name for t in tools])
        return figma_mcp_agent
    except Exception as e:
        logger.warning("Failed to initialize Figma MCP agent: %s", e)
        figma_mcp_agent = None
        return None


def get_figma_agent():
    """Return the cached agent (may be None until `init_figma_agent` succeeds)."""
    return figma_mcp_agent
