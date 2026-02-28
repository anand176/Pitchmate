"""
Deck Creator sub-agent — creates pitch deck / product report as PDF or DOCX.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent

from agents.sub_agents.deck_creator import prompt
from agents.sub_agents.deck_creator.tools import create_deck_pdf, create_deck_docx
from core.config import config

deck_creator_agent = Agent(
    name="deck_creator_agent",
    model=config.agents.get_model_for_agent("deck_creator_agent"),
    description=(
        "Creates a pitch deck / product report as a document (PDF or DOCX) with sections: Problem, Solution, "
        "Market Size (TAM/SAM/SOM), Product, Traction, Business Model, GTM Strategy, Competition. "
        "Use when the user wants to 'create a deck', 'create a report', 'generate a document' with their pitch details. "
        "If the user does not specify format, ask: 'Do you need it in DOCX or PDF?' then call the corresponding tool "
        "based on their answer (create_deck_pdf or create_deck_docx)."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[create_deck_pdf, create_deck_docx],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.3,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)
