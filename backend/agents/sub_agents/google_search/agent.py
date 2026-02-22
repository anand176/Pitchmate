import sys

import google.genai.types as genai_types
from google.adk.agents import Agent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

from agents.sub_agents.google_search import prompt
from core.config import config

_NPX_CMD = "npx.cmd" if sys.platform == "win32" else "npx"
# Google Search MCP can run Playwright/browser; allow longer timeout
_MCP_TIMEOUT = float(getattr(config.mcp, "connection_timeout", 60))

google_search_mcp = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command=_NPX_CMD,
            args=["-y", "@mcp-server/google-search-mcp@latest"],
        ),
        timeout=_MCP_TIMEOUT,
    ),
)

google_search_agent = Agent(
    name="google_search_agent",
    model=config.agents.get_model_for_agent("google_search_agent"),
    description="Performs Google web search and returns structured results. Use when the user needs current information, documentation, troubleshooting, or general web search.",
    instruction=prompt.INSTRUCTION,
    tools=[google_search_mcp],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.1,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)
