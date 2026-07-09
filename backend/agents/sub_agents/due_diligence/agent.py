"""
Due Diligence sub-agent — anticipates investor questions and generates Q&A PDF for meeting prep.
"""

from agents.langgraph_base import create_google_llm, wrap_tool_function, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.sub_agents.due_diligence import prompt
from agents.sub_agents.due_diligence.tools import create_due_diligence_qa_pdf
from core.config import config

# Agent configuration
AGENT_NAME = "due_diligence_agent"
AGENT_DESCRIPTION = (
    "Anticipates investor questions, identifies red flags, and generates a due diligence Q&A PDF "
    "for investor meeting prep. Use when the user explicitly asks: \"What questions will investors ask me?\", "
    "\"Prepare me for investor meetings\", \"What are the tough questions about my deck?\", "
    "\"Do due diligence on my startup\", \"What are the red flags in my pitch?\", "
    "\"Help me prep for my investor call\", or to create a doc/PDF for investor Q&A prep."
)

# Create LLM
model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.3,
    max_retries=2,
)

# Wrap tools
tools = [
    wrap_tool_function(create_due_diligence_qa_pdf),
]

# Create compiled agent
due_diligence_agent = create_react_agent(
    model=model,
    tools=tools,
    system_prompt=prompt.INSTRUCTION,
    agent_name=AGENT_NAME,
    callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
)
