"""
Due Diligence sub-agent — anticipates investor questions and generates Q&A PDF for meeting prep.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent

from agents.sub_agents.due_diligence import prompt
from agents.sub_agents.due_diligence.tools import create_due_diligence_qa_pdf
from core.config import config

due_diligence_agent = Agent(
    name="due_diligence_agent",
    model=config.agents.get_model_for_agent("due_diligence_agent"),
    description=(
        "Anticipates investor questions, identifies red flags, and generates a due diligence Q&A PDF "
        "for investor meeting prep. Use when the user explicitly asks: \"What questions will investors ask me?\", "
        "\"Prepare me for investor meetings\", \"What are the tough questions about my deck?\", "
        "\"Do due diligence on my startup\", \"What are the red flags in my pitch?\", "
        "\"Help me prep for my investor call\", or to create a doc/PDF for investor Q&A prep."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[create_due_diligence_qa_pdf],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.3,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)
