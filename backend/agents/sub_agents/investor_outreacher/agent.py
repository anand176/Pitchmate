"""
Investor Outreacher sub-agent — investor targeting and outreach email drafting.
"""

from agents.langgraph_base import create_google_llm, wrap_tool_function, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.sub_agents.investor_outreacher import prompt
from agents.sub_agents.investor_outreacher.tools import draft_outreach_email, suggest_investor_types
from core.config import config

# Agent configuration
AGENT_NAME = "investor_outreacher_agent"
AGENT_DESCRIPTION = (
    "Identifies the right investor types for a startup's stage and industry, "
    "and drafts personalized investor outreach emails. "
    "Use when the user asks who to pitch to, how to find investors, or needs an outreach email written."
)

# Create LLM
model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.5,
    max_retries=2,
)

# Wrap tools
tools = [
    wrap_tool_function(draft_outreach_email),
    wrap_tool_function(suggest_investor_types),
]

# Create compiled agent
investor_outreacher_agent = create_react_agent(
    model=model,
    tools=tools,
    system_prompt=prompt.INSTRUCTION,
    agent_name=AGENT_NAME,
    callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
)
