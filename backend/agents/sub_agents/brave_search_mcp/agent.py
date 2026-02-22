"""
Web Search sub-agent — real-time market and investor research.
Uses SerpAPI (Google Search + Google News) via Python; requires SERPAPI_API_KEY.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent

from agents.sub_agents.brave_search_mcp import prompt
from agents.sub_agents.brave_search_mcp.tools import web_search, web_search_news
from core.config import config

brave_search_mcp_agent = Agent(
    name="brave_search_mcp_agent",
    model=config.agents.get_model_for_agent("brave_search_mcp_agent"),
    description=(
        "Performs real-time web research on markets, competitors, and investors "
        "using SerpAPI (Google Search + Google News). "
        "Use when the user asks to validate market size, research competitors, "
        "find active investors in a space, or get current industry data and trends. "
        "Requires SERPAPI_API_KEY in the environment."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[web_search, web_search_news],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.2,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=8.0
            )
        ),
    ),
)
