"""
Valuation Advisor agent — estimates pre-money valuation ranges and negotiation guidance.
"""

from agents.langgraph_base import create_google_llm, wrap_tool_function, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.sub_agents.valuation_advisor import prompt
from agents.sub_agents.valuation_advisor.tools import estimate_valuation
from core.config import config

# Agent configuration
AGENT_NAME = "valuation_advisor_agent"
AGENT_DESCRIPTION = (
    "Estimates a defensible pre-money valuation range for a startup using stage baselines, "
    "revenue multiple comps, and qualitative team/traction adjustments; provides negotiation "
    "guidance. Use when the user asks about valuation, how much their startup is worth, how "
    "much equity to give up, or negotiation guidance for a term sheet's valuation."
)

# Create LLM
model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.2,
    max_retries=2,
)

# Wrap tools
tools = [
    wrap_tool_function(estimate_valuation),
]

# Create compiled agent
valuation_advisor_agent = create_react_agent(
    model=model,
    tools=tools,
    system_prompt=prompt.INSTRUCTION,
    agent_name=AGENT_NAME,
    callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
)
