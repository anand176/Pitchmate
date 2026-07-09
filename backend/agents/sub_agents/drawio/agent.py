"""
Draw.io MCP sub-agent — creates diagrams and drawings via Draw.io MCP.
"""

from agents.langgraph_base import create_google_llm, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.mcp_integration import get_mcp_tools, get_npx_command
from agents.sub_agents.drawio import prompt
from core.config import config

# Agent configuration
AGENT_NAME = "drawio_agent"
AGENT_DESCRIPTION = (
    "Creates and opens diagrams/drawings in the draw.io editor. Use mainly when the user asks for "
    "drawings, diagrams, flowcharts, org charts, Mermaid diagrams, or similar visuals. "
    "Supports Mermaid.js, CSV (org charts, flowcharts), and draw.io XML."
)

# Create LLM
model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.1,
    max_retries=2,
)

# Initialize MCP tools asynchronously
async def _get_drawio_tools():
    """Get Draw.io MCP tools."""
    return await get_mcp_tools(
        command=get_npx_command(),
        args=["-y", "@drawio/mcp"],
    )

# Create a lazy-loading agent factory
def create_drawio_agent():
    """Create Draw.io agent with MCP tools."""
    import asyncio
    tools = asyncio.run(_get_drawio_tools())
    return create_react_agent(
        model=model,
        tools=tools,
        system_prompt=prompt.INSTRUCTION,
        agent_name=AGENT_NAME,
        callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
    )

# Export the agent (lazy-loaded on first access)
_drawio_agent_cache = None

def get_drawio_agent():
    """Get or create the Draw.io agent."""
    global _drawio_agent_cache
    if _drawio_agent_cache is None:
        _drawio_agent_cache = create_drawio_agent()
    return _drawio_agent_cache

# For backward compatibility, create the agent immediately
# (but in production, consider lazy loading)
try:
    drawio_agent = create_drawio_agent()
except Exception as e:
    import logging
    logging.warning(f"Failed to initialize Draw.io MCP agent: {e}. Will retry on first use.")
    drawio_agent = None
