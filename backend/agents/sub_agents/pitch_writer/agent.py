"""
Pitch Writer sub-agent — short elevator pitch and one-page executive summary (PDF).
Core creative engine: takes enriched context and produces pitch content + PDF.
"""

import google.genai.types as genai_types
from google.adk.agents import Agent

from agents.sub_agents.pitch_writer import prompt
from agents.sub_agents.pitch_writer.tools import (
    create_executive_summary_pdf,
    save_elevator_pitch,
)
from core.config import config

pitch_writer_agent = Agent(
    name="pitch_writer_agent",
    model=config.agents.get_model_for_agent("pitch_writer_agent"),
    description=(
        "Takes enriched context and generates: (1) a short elevator pitch (30–60 sec), and "
        "(2) a one-page executive summary as a PDF. Use when the user wants \"write my pitch\", "
        "\"draft an executive summary\", \"give me an elevator pitch\", \"executive summary as PDF\", "
        "or \"turn my idea into a pitch\"."
    ),
    instruction=prompt.INSTRUCTION,
    tools=[create_executive_summary_pdf, save_elevator_pitch],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.5,
        http_options=genai_types.HttpOptions(
            retry_options=genai_types.HttpRetryOptions(
                initial_delay=1.0, attempts=2, max_delay=5.0
            )
        ),
    ),
)
