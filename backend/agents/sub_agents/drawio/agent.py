"""
Draw.io MCP sub-agent — creates diagrams and drawings via Draw.io MCP.

Must be initialized asynchronously (see `init_drawio_agent`) during app lifespan.
Import-time `asyncio.run()` fails under uvicorn's running event loop.
"""

import logging

from agents.langgraph_base import create_google_llm, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.mcp_integration import get_mcp_tools, get_npx_command, mcp_env_with_path
from agents.sub_agents.drawio import prompt
from core.config import config

logger = logging.getLogger("drawio_agent")

AGENT_NAME = "drawio_agent"
AGENT_DESCRIPTION = (
    "Creates and opens diagrams/drawings in the draw.io editor. Use mainly when the user asks for "
    "drawings, diagrams, flowcharts, org charts, Mermaid diagrams, or similar visuals. "
    "Supports Mermaid.js, CSV (org charts, flowcharts), and draw.io XML."
)

model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.1,
    max_retries=2,
)

# Populated by `init_drawio_agent()` during FastAPI lifespan.
drawio_agent = None


async def _get_drawio_tools():
    """Fetch Draw.io MCP tools (open_drawio_mermaid / csv / xml)."""
    return await get_mcp_tools(
        command=get_npx_command(),
        args=["-y", "@drawio/mcp"],
        env=mcp_env_with_path(),
        server_name="drawio",
    )


async def init_drawio_agent():
    """
    Build and cache the Draw.io agent. Safe to call from an async lifespan hook.
    Returns the compiled agent, or None if MCP/Node is unavailable.
    """
    global drawio_agent
    if drawio_agent is not None:
        return drawio_agent
    try:
        tools = await _get_drawio_tools()
        if not tools:
            raise RuntimeError("Draw.io MCP returned no tools")
        drawio_agent = create_react_agent(
            model=model,
            tools=tools,
            system_prompt=prompt.INSTRUCTION,
            agent_name=AGENT_NAME,
            callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
        )
        logger.info("Draw.io MCP agent initialized with tools: %s", [t.name for t in tools])
        return drawio_agent
    except Exception as e:
        logger.warning("Failed to initialize Draw.io MCP agent: %s", e)
        drawio_agent = None
        return None


def get_drawio_agent():
    """Return the cached agent (may be None until `init_drawio_agent` succeeds)."""
    return drawio_agent
