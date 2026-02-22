"""
Deck Reviewer sub-agent — reviews and scores pitch deck slides.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent

from agents.sub_agents.Deck_reviewer import prompt
from agents.sub_agents.Deck_reviewer.tools import review_slide, score_deck
from core.config import config

deck_reviewer_agent = Agent(
    name="deck_reviewer_agent",
    model=config.agents.get_model_for_agent("deck_reviewer_agent"),
    description=(
        "Reviews and scores pitch deck slides for investor-readiness. "
        "Use when the user wants feedback on their problem, solution, market, traction, "
        "team, business model, financials, or ask slide, or wants an overall deck score."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[review_slide, score_deck],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.3,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)
