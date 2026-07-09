"""
Deck Creator sub-agent — creates pitch deck / product report as PDF or DOCX.
"""

from agents.langgraph_base import create_google_llm, wrap_tool_function, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.sub_agents.deck_creator import prompt
from agents.sub_agents.deck_creator.tools import create_deck_pdf, create_deck_docx
from core.config import config

# Agent configuration
AGENT_NAME = "deck_creator_agent"
AGENT_DESCRIPTION = (
    "Creates a pitch deck / product report as a document (PDF or DOCX) with sections: Problem, Solution, "
    "Market Size (TAM/SAM/SOM), Product, Traction, Business Model, GTM Strategy, Competition. "
    "Use when the user wants to 'create a deck', 'create a report', 'generate a document' with their pitch details. "
    "If the user does not specify format, ask: 'Do you need it in DOCX or PDF?' then call the corresponding tool "
    "based on their answer (create_deck_pdf or create_deck_docx)."
)

# Create LLM
model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.3,
    max_retries=2,
)

# Wrap tools
tools = [
    wrap_tool_function(create_deck_pdf),
    wrap_tool_function(create_deck_docx),
]

# Create compiled agent
deck_creator_agent = create_react_agent(
    model=model,
    tools=tools,
    system_prompt=prompt.INSTRUCTION,
    agent_name=AGENT_NAME,
    callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
)
