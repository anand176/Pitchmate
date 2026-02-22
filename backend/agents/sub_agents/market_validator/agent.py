"""
Market Validator sub-agent — validates TAM/SAM/SOM and competitive landscape.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent

from agents.sub_agents.market_validator import prompt
from agents.sub_agents.market_validator.tools import validate_market_size, assess_competition
from core.config import config

market_validator_agent = Agent(
    name="market_validator_agent",
    model=config.agents.get_model_for_agent("market_validator_agent"),
    description=(
        "Validates market sizing (TAM/SAM/SOM) claims and evaluates the competitive landscape "
        "in a pitch deck. Use when the user asks about their market size, competitive analysis, "
        "or whether their numbers will hold up to investor scrutiny."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[validate_market_size, assess_competition],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.2,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)
