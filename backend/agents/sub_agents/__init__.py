"""
Sub-agents package — exports all Pitchmate specialized agents.

MCP-backed agents (`drawio_agent`, `figma_mcp_agent`) start as None and are
filled in during FastAPI lifespan via `init_drawio_agent` / `init_figma_agent`.
"""

from agents.sub_agents.market_validator.agent import market_validator_agent
from agents.sub_agents.investor_outreacher.agent import investor_outreacher_agent
from agents.sub_agents.knowledge_base.agent import knowledge_base_agent
from agents.sub_agents.figma_mcp.agent import figma_mcp_agent, init_figma_agent, get_figma_agent
from agents.sub_agents.web_search.agent import web_search_agent
from agents.sub_agents.drawio.agent import drawio_agent, init_drawio_agent, get_drawio_agent
from agents.sub_agents.pitch_writer.agent import pitch_writer_agent
from agents.sub_agents.due_diligence.agent import due_diligence_agent
from agents.sub_agents.deck_creator.agent import deck_creator_agent
from agents.sub_agents.valuation_advisor.agent import valuation_advisor_agent

__all__ = [
    "market_validator_agent",
    "investor_outreacher_agent",
    "knowledge_base_agent",
    "figma_mcp_agent",
    "init_figma_agent",
    "get_figma_agent",
    "web_search_agent",
    "drawio_agent",
    "init_drawio_agent",
    "get_drawio_agent",
    "pitch_writer_agent",
    "due_diligence_agent",
    "deck_creator_agent",
    "valuation_advisor_agent",
]
