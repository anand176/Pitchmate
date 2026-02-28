"""
Pitchmate orchestrator agent — coordinates all pitch deck sub-agents.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent
from google.adk.planners import PlanReActPlanner
from google.adk.tools.agent_tool import AgentTool

from agents import prompt
from agents.sub_agents import (
    market_validator_agent,
    investor_outreacher_agent,
    knowledge_base_agent,
    figma_mcp_agent,
    browse_mcp_agent,
    drawio_agent,
    pitch_writer_agent,
    due_diligence_agent,
    deck_creator_agent,
)
from core.config import config

pitchmate_agent = Agent(
    name="pitchmate_agent",
    model=config.agents.get_model_for_agent("pitchmate_agent"),
    description="AI co-pilot for startup founders building and refining pitch decks for investor fundraising.",
    planner=PlanReActPlanner(),
    instruction=prompt.INSTRUCTION,
    tools=[
        AgentTool(agent=market_validator_agent, skip_summarization=False),
        AgentTool(agent=investor_outreacher_agent, skip_summarization=False),
        AgentTool(agent=knowledge_base_agent, skip_summarization=False),
        AgentTool(agent=figma_mcp_agent, skip_summarization=False),
        AgentTool(agent=browse_mcp_agent, skip_summarization=False),
        AgentTool(agent=drawio_agent, skip_summarization=False),
        AgentTool(agent=pitch_writer_agent, skip_summarization=False),
        AgentTool(agent=due_diligence_agent, skip_summarization=False),
        AgentTool(agent=deck_creator_agent, skip_summarization=False),
    ],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.3,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)

