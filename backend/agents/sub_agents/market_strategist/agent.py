"""
Market Strategist sub-agent — GTM strategy, customer segmentation, channels, pricing.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent

from agents.sub_agents.market_strategist import prompt
from agents.sub_agents.market_strategist.tools import suggest_gtm_strategy, identify_customer_segments
from core.config import config

market_strategist_agent = Agent(
    name="market_strategist_agent",
    model=config.agents.get_model_for_agent("market_strategist_agent"),
    description=(
        "Crafts go-to-market strategies, identifies ideal customer profiles (ICP), "
        "and recommends acquisition channels and pricing models for startups. "
        "Use when the user asks about their GTM plan, customer segments, sales motion, or pricing."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[suggest_gtm_strategy, identify_customer_segments],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.4,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)
