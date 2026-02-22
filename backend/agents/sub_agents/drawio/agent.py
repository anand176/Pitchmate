import sys

import google.genai.types as genai_types
from google.adk.agents import Agent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

from agents.sub_agents.drawio import prompt
from core.config import config

# Use npx.cmd on Windows for reliable subprocess spawning
_NPX_CMD = "npx.cmd" if sys.platform == "win32" else "npx"
_MCP_TIMEOUT = float(getattr(config.mcp, "connection_timeout", 60))

drawio_mcp = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command=_NPX_CMD,
            args=["-y", "@drawio/mcp"],
        ),
        timeout=_MCP_TIMEOUT,
    ),
)

drawio_agent = Agent(
    name="drawio_agent",
    model=config.agents.get_model_for_agent("drawio_agent"),
    description="Creates and opens diagrams in the draw.io editor. Supports Mermaid.js, CSV (org charts, flowcharts), and draw.io XML. Use when the user asks to create, view, or edit diagrams.",
    instruction=prompt.INSTRUCTION,
    tools=[drawio_mcp],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.1,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)
