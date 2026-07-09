"""
Web Search agent — web search and news for market data, competitors, trends, and latest news.
Uses SerpAPI (Google Search + Google News) directly; requires SERPAPI_API_KEY.

Note: despite the historical name "browse_mcp_agent" for this agent's exported
symbol, this is a plain SerpAPI REST integration, not a Model Context Protocol
(MCP) server — unlike `figma_mcp` and `drawio`, which are real MCP agents. This
module was previously named `brave_search_mcp`, which was doubly misleading
(neither Brave Search nor MCP); renamed to `web_search` for clarity.
"""

from agents.langgraph_base import create_google_llm, wrap_tool_function, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.sub_agents.web_search import prompt
from agents.sub_agents.web_search.tools import web_search, web_search_news
from core.config import config

# Agent configuration
AGENT_NAME = "web_search_agent"
AGENT_DESCRIPTION = (
    "Web search agent that searches the web and news for market size data, key competitors, "
    "industry trends, and the latest news. Use when the user needs: (1) market size / TAM/SAM/SOM data, "
    "(2) competitor landscape and key players, (3) current industry trends, or (4) **news** — when the user "
    "specifically asks for news, latest news, or news-related content (e.g. 'latest news about X', 'recent news'). "
    "Uses SerpAPI (Google Search + Google News). Requires SERPAPI_API_KEY in the environment."
)

# Create LLM
model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.2,
    max_retries=2,
)

# Wrap tools
tools = [
    wrap_tool_function(web_search),
    wrap_tool_function(web_search_news),
]

# Create compiled agent
web_search_agent = create_react_agent(
    model=model,
    tools=tools,
    system_prompt=prompt.INSTRUCTION,
    agent_name=AGENT_NAME,
    callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
)
