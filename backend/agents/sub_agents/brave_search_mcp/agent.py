"""
Browse MCP — web search and news for market data, competitors, trends, and latest news.
Uses SerpAPI (Google Search + Google News); requires SERPAPI_API_KEY.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent

from agents.sub_agents.brave_search_mcp import prompt
from agents.sub_agents.brave_search_mcp.tools import web_search, web_search_news
from core.config import config

browse_mcp_agent = Agent(
    name="browse_mcp_agent",
    model=config.agents.get_model_for_agent("browse_mcp_agent"),
    description=(
        "Browse MCP agent that searches the web and news for market size data, key competitors, "
        "industry trends, and the latest news. Use when the user needs: (1) market size / TAM/SAM/SOM data, "
        "(2) competitor landscape and key players, (3) current industry trends, or (4) **news** — when the user "
        "specifically asks for news, latest news, or news-related content (e.g. 'latest news about X', 'recent news'). "
        "Uses SerpAPI (Google Search + Google News). Requires SERPAPI_API_KEY in the environment."
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
