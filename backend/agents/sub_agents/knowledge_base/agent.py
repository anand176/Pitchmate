"""
Knowledge Base sub-agent — searches uploaded documents and reviews pitch decks.
"""

from agents.langgraph_base import create_google_llm, wrap_tool_function, create_react_agent
from agents.guardrails_langgraph import create_guardrail_callbacks
from agents.sub_agents.knowledge_base import prompt
from agents.sub_agents.knowledge_base.tools import (
    list_uploaded_documents,
    search_knowledge_base,
)
from core.config import config

# Agent configuration
AGENT_NAME = "knowledge_base_agent"
AGENT_DESCRIPTION = (
    "Answers questions about uploaded documents and reviews pitch decks by searching the vector DB. "
    "Use when the user asks to search docs, review their deck, analyse their pitch deck, "
    "or what is in the knowledge base (deck content should be uploaded first)."
)

# Create LLM
model = create_google_llm(
    model=config.agents.get_model_for_agent(AGENT_NAME),
    temperature=0.3,
    max_retries=2,
)

# Wrap tools
tools = [
    wrap_tool_function(search_knowledge_base),
    wrap_tool_function(list_uploaded_documents),
]

# Create compiled agent
knowledge_base_agent = create_react_agent(
    model=model,
    tools=tools,
    system_prompt=prompt.INSTRUCTION,
    agent_name=AGENT_NAME,
    callbacks=create_guardrail_callbacks(agent_name=AGENT_NAME),
)
