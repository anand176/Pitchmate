"""
Draw.io MCP sub-agent — generates pitch framework diagrams via Draw.io MCP.
"""

import os
import google.genai.types as genai_types
from google.adk.agents import Agent
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StdioServerParameters

from agents.sub_agents.drawio_mcp import prompt
from core.config import config

drawio_mcp_agent = Agent(
    name="drawio_mcp_agent",
    model=config.agents.get_model_for_agent("drawio_mcp_agent"),
    description=(
        "Creates pitch framework diagrams using the Draw.io MCP tool. "
        "Use when the user asks to create or visualise a business model canvas, "
        "GTM funnel, competitive landscape map, customer journey, org chart, "
        "product roadmap, or any structured visual for their pitch deck."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[
        MCPToolset(
            connection_params=StdioServerParameters(
                command="npx",
                args=["-y", "@pocketbase/mcp-server-drawio"],
                # Pass full system env so npx/node is reachable inside venv
                env=dict(os.environ),
            )
        )
    ],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.4,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=8.0
            )
        ),
    ),
)
