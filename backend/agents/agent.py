"""
Pitchmate orchestrator agent — coordinates all pitch deck sub-agents.
Migrated to LangChain-LangGraph from Google ADK.
"""

from typing import Any

from langchain_core.tools import BaseTool
from langgraph.graph.state import CompiledStateGraph
from agents.langgraph_base import create_google_llm, create_react_agent, create_sub_agent_tool
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents import prompt
from agents.sub_agents import (
    market_validator_agent,
    investor_outreacher_agent,
    knowledge_base_agent,
    figma_mcp_agent,
    web_search_agent,
    drawio_agent,
    pitch_writer_agent,
    due_diligence_agent,
    deck_creator_agent,
    valuation_advisor_agent,
)
from core.config import config

# Agent configuration
AGENT_NAME = "pitchmate_agent"
AGENT_DESCRIPTION = (
    "AI co-pilot for startup founders building and refining pitch decks for investor fundraising."
)

# Create LLM for orchestrator
model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.3,
    max_retries=2,
)

# Define sub-agent metadata for tool creation
SUB_AGENTS = [
    {
        "agent": market_validator_agent,
        "name": "market_validator_agent",
        "description": (
            "Validates market sizing (TAM/SAM/SOM) and competitive landscape; suggests go-to-market (GTM) strategy, "
            "ideal customer profiles (ICP), channels, and pricing. Use when the user asks about market size, "
            "competition, GTM plan, next steps, customer segments, or pricing."
        ),
    },
    {
        "agent": investor_outreacher_agent,
        "name": "investor_outreacher_agent",
        "description": (
            "Identifies the right investor types for a startup's stage and industry, "
            "and drafts personalized investor outreach emails. "
            "Use when the user asks who to pitch to, how to find investors, or needs an outreach email written."
        ),
    },
    {
        "agent": knowledge_base_agent,
        "name": "knowledge_base_agent",
        "description": (
            "Answers questions about uploaded documents and reviews pitch decks by searching the vector DB. "
            "Use when the user asks to search docs, review their deck, analyse their pitch deck, "
            "or what is in the knowledge base (deck content should be uploaded first)."
        ),
    },
    {
        "agent": figma_mcp_agent,
        "name": "figma_mcp_agent",
        "description": (
            "Analyses pitch deck visual design using the Figma MCP tool. "
            "Use when the user shares a Figma link or asks for design feedback, "
            "layout review, slide visual critique, or brand consistency checks."
        ),
    },
    {
        "agent": web_search_agent,
        "name": "web_search_agent",
        "description": (
            "Web search agent that searches the web and news for market size data, key competitors, "
            "industry trends, and the latest news. Use when the user needs: (1) market size / TAM/SAM/SOM data, "
            "(2) competitor landscape and key players, (3) current industry trends, or (4) news — when the user "
            "specifically asks for news, latest news, or news-related content."
        ),
    },
    {
        "agent": drawio_agent,
        "name": "drawio_agent",
        "description": (
            "Creates and opens diagrams/drawings in the draw.io editor. Use mainly when the user asks for "
            "drawings, diagrams, flowcharts, org charts, Mermaid diagrams, or similar visuals."
        ),
    },
    {
        "agent": pitch_writer_agent,
        "name": "pitch_writer_agent",
        "description": (
            "Takes enriched context and generates: (1) a short elevator pitch (30–60 sec), and "
            "(2) a one-page executive summary as a PDF. Use when the user wants to write their pitch "
            "or create an executive summary."
        ),
    },
    {
        "agent": due_diligence_agent,
        "name": "due_diligence_agent",
        "description": (
            "Anticipates investor questions, identifies red flags, and generates a due diligence Q&A PDF. "
            "Use when the user asks what questions investors will ask or wants to prepare for meetings."
        ),
    },
    {
        "agent": deck_creator_agent,
        "name": "deck_creator_agent",
        "description": (
            "Creates a pitch deck / product report as a document (PDF or DOCX) with sections: Problem, Solution, "
            "Market Size, Product, Traction, Business Model, GTM Strategy, Competition. "
            "Use when the user wants to create a deck or report document."
        ),
    },
    {
        "agent": valuation_advisor_agent,
        "name": "valuation_advisor_agent",
        "description": (
            "Estimates a defensible pre-money valuation range using stage baselines, revenue multiple "
            "comps, and team/traction adjustments; gives negotiation guidance. "
            "Use when the user asks what their startup is worth, what valuation to ask for, how much "
            "equity to give up, or for term sheet valuation negotiation guidance."
        ),
    },
]


def create_sub_agent_executor(compiled_agent):
    """
    Create an executor function for a sub-agent.
    
    Args:
        compiled_agent: Compiled LangGraph agent
        
    Returns:
        Async executor function
    """
    async def executor(messages):
        """Execute the sub-agent."""
        if compiled_agent is None:
            return "This agent is not currently available."
        
        try:
            result = await compiled_agent.ainvoke({"messages": messages})
            # Extract response from final state
            messages_out = result.get("messages", [])
            if messages_out:
                last_msg = messages_out[-1]
                return last_msg.content if hasattr(last_msg, "content") else str(last_msg)
            return "Agent completed without response."
        except Exception as e:
            return f"Error executing agent: {str(e)}"
    
    return executor


def _build_sub_agent_tools() -> list[BaseTool]:
    """Wrap each configured (non-None) sub-agent as an orchestrator tool."""
    tools = []
    for sub_agent_config in SUB_AGENTS:
        if sub_agent_config["agent"] is not None:
            executor = create_sub_agent_executor(sub_agent_config["agent"])
            tool = create_sub_agent_tool(
                agent_executor=executor,
                name=sub_agent_config["name"],
                description=sub_agent_config["description"],
            )
            tools.append(tool)
    return tools


def build_pitchmate_agent(checkpointer: Any | None = None) -> CompiledStateGraph:
    """
    Build (compile) the Pitchmate orchestrator agent.

    Args:
        checkpointer: Optional LangGraph checkpointer for cross-request session
            persistence (e.g. the singleton from `agents.langgraph_runner.get_checkpointer()`).
            When omitted, the graph is compiled without memory — fine for tests/scripts,
            but multi-turn conversation state will not persist across requests.

    Returns:
        Compiled LangGraph graph for the orchestrator.
    """
    return create_react_agent(
        model=model,
        tools=_build_sub_agent_tools(),
        system_prompt=prompt.INSTRUCTION,
        agent_name=AGENT_NAME,
        checkpointer=checkpointer,
        callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
    )


# Module-level default instance (no checkpointer — no cross-request memory).
# `app.py`'s startup lifespan rebuilds this with a real checkpointer via
# `build_pitchmate_agent()` and stores it with `langgraph_runner.cache_agent()`;
# `agent_runner.py` prefers that cached instance and falls back to this one.
pitchmate_agent = build_pitchmate_agent()

