"""
Figma MCP sub-agent — pitch deck visual design analysis via Figma MCP.
"""

import os
import google.genai.types as genai_types
from google.adk.agents import Agent
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StdioServerParameters

from agents.sub_agents.figma_mcp import prompt
from core.config import config

figma_mcp_agent = Agent(
    name="figma_mcp_agent",
    model=config.agents.get_model_for_agent("figma_mcp_agent"),
    description=(
        "Analyses pitch deck visual design using the Figma MCP tool. "
        "Use when the user shares a Figma link or asks for design feedback, "
        "layout review, slide visual critique, or brand consistency checks."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[
        MCPToolset(
            connection_params=StdioServerParameters(
                command="npx",
                args=["-y", "@figma/mcp"],
                # Pass full system env so npx/node is reachable inside venv
                env={
                    **os.environ,
                    "FIGMA_PERSONAL_ACCESS_TOKEN": os.environ.get("FIGMA_PERSONAL_ACCESS_TOKEN", ""),
                },
            )
        )
    ],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.3,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=8.0
            )
        ),
    ),
)
