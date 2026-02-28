"""
Market Agent — validates TAM/SAM/SOM and competition; suggests GTM strategy and customer segments.
Combines market validation and market strategy in one agent to avoid conflicting tools.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent

from agents.sub_agents.market_validator import prompt
from agents.sub_agents.market_validator.tools import (
    assess_competition,
    identify_customer_segments,
    suggest_gtm_strategy,
    validate_market_size,
)
from core.config import config

market_validator_agent = Agent(
    name="market_validator_agent",
    model=config.agents.get_model_for_agent("market_validator_agent"),
    description=(
        "Validates market sizing (TAM/SAM/SOM) and competitive landscape; suggests go-to-market (GTM) strategy, "
        "ideal customer profiles (ICP), channels, and pricing. Use when the user asks about market size, "
        "competition, GTM plan, next steps, customer segments, or pricing."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[validate_market_size, assess_competition, suggest_gtm_strategy, identify_customer_segments],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.2,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)
