"""
Market Agent — validates TAM/SAM/SOM and competition; suggests GTM strategy and customer segments.
Combines market validation and market strategy in one agent to avoid conflicting tools.
"""

from agents.langgraph_base import create_google_llm, wrap_tool_function, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.sub_agents.market_validator import prompt
from agents.sub_agents.market_validator.tools import (
    assess_competition,
    identify_customer_segments,
    suggest_gtm_strategy,
    validate_market_size,
)
from core.config import config

# Agent configuration
AGENT_NAME = "market_validator_agent"
AGENT_DESCRIPTION = (
    "Validates market sizing (TAM/SAM/SOM) and competitive landscape; suggests go-to-market (GTM) strategy, "
    "ideal customer profiles (ICP), channels, and pricing. Use when the user asks about market size, "
    "competition, GTM plan, next steps, customer segments, or pricing."
)

# Create LLM
model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.2,
    max_retries=2,
)

# Wrap tools
tools = [
    wrap_tool_function(validate_market_size),
    wrap_tool_function(assess_competition),
    wrap_tool_function(suggest_gtm_strategy),
    wrap_tool_function(identify_customer_segments),
]

# Create compiled agent
market_validator_agent = create_react_agent(
    model=model,
    tools=tools,
    system_prompt=prompt.INSTRUCTION,
    agent_name=AGENT_NAME,
    callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
)
