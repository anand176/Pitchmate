"""
Pitch Writer sub-agent — short elevator pitch and one-page executive summary (PDF).
Core creative engine: takes enriched context and produces pitch content + PDF.
"""

from agents.langgraph_base import create_google_llm, wrap_tool_function, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.sub_agents.pitch_writer import prompt
from agents.sub_agents.pitch_writer.tools import (
    create_executive_summary_pdf,
    save_elevator_pitch,
)
from core.config import config

# Agent configuration
AGENT_NAME = "pitch_writer_agent"
AGENT_DESCRIPTION = (
    "Takes enriched context and generates: (1) a short elevator pitch (30–60 sec), and "
    "(2) a one-page executive summary as a PDF. Use when the user wants \"write my pitch\", "
    "\"draft an executive summary\", \"give me an elevator pitch\", \"executive summary as PDF\", "
    "or \"turn my idea into a pitch\"."
)

# Create LLM
model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.5,
    max_retries=2,
)

# Wrap tools
tools = [
    wrap_tool_function(create_executive_summary_pdf),
    wrap_tool_function(save_elevator_pitch),
]

# Create compiled agent
pitch_writer_agent = create_react_agent(
    model=model,
    tools=tools,
    system_prompt=prompt.INSTRUCTION,
    agent_name=AGENT_NAME,
    callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
)
