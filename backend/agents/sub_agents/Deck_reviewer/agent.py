"""
Deck Creator sub-agent — creates pitch deck .pptx files using python-pptx.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent

from agents.sub_agents.Deck_reviewer import prompt
from agents.sub_agents.Deck_reviewer.tools import create_pitch_deck_pptx
from core.config import config

deck_creator_agent = Agent(
    name="deck_creator_agent",
    model=config.agents.get_model_for_agent("deck_creator_agent"),
    description=(
        "Creates a full pitch deck as a PowerPoint (.pptx) file from enriched context. "
        "Use when the user wants to \"create a pitch deck\", \"make a deck\", \"build my deck\", "
        "\"generate a .pptx\", or \"turn my idea into a presentation\". Uses python-pptx to produce the file."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[create_pitch_deck_pptx],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.4,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)
