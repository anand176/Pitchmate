"""
Figma MCP sub-agent — pitch deck visual design analysis via Figma MCP.
"""

import os
from agents.langgraph_base import create_google_llm, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.mcp_integration import get_mcp_tools, get_npx_command
from agents.sub_agents.figma_mcp import prompt
from core.config import config

# Agent configuration
AGENT_NAME = "figma_mcp_agent"
AGENT_DESCRIPTION = (
    "Analyses pitch deck visual design using the Figma MCP tool. "
    "Use when the user shares a Figma link or asks for design feedback, "
    "layout review, slide visual critique, or brand consistency checks."
)

# Create LLM
model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.3,
    max_retries=2,
)

# Initialize MCP tools asynchronously
async def _get_figma_tools():
    """Get Figma MCP tools."""
    return await get_mcp_tools(
        command=get_npx_command(),
        args=["-y", "@figma/mcp"],
        env={
            **os.environ,
            "FIGMA_PERSONAL_ACCESS_TOKEN": os.environ.get("FIGMA_PERSONAL_ACCESS_TOKEN", ""),
        },
    )

# Create a lazy-loading agent factory
def create_figma_agent():
    """Create Figma agent with MCP tools."""
    import asyncio
    tools = asyncio.run(_get_figma_tools())
    return create_react_agent(
        model=model,
        tools=tools,
        system_prompt=prompt.INSTRUCTION,
        agent_name=AGENT_NAME,
        callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
    )

# Export the agent (lazy-loaded on first access)
_figma_agent_cache = None

def get_figma_agent():
    """Get or create the Figma agent."""
    global _figma_agent_cache
    if _figma_agent_cache is None:
        _figma_agent_cache = create_figma_agent()
    return _figma_agent_cache

# For backward compatibility, create the agent immediately
# (but in production, consider lazy loading)
try:
    figma_mcp_agent = create_figma_agent()
except Exception as e:
    import logging
    logging.warning(f"Failed to initialize Figma MCP agent: {e}. Will retry on first use.")
    figma_mcp_agent = None
