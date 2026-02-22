"""
Investor Outreacher sub-agent — investor targeting and outreach email drafting.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent

from agents.sub_agents.investor_outreacher import prompt
from agents.sub_agents.investor_outreacher.tools import draft_outreach_email, suggest_investor_types
from core.config import config

investor_outreacher_agent = Agent(
    name="investor_outreacher_agent",
    model=config.agents.get_model_for_agent("investor_outreacher_agent"),
    description=(
        "Identifies the right investor types for a startup's stage and industry, "
        "and drafts personalized investor outreach emails. "
        "Use when the user asks who to pitch to, how to find investors, or needs an outreach email written."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[draft_outreach_email, suggest_investor_types],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.5,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)
