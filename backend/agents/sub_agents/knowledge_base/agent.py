from core.config import config
from google.adk.agents import Agent

from agents.sub_agents.knowledge_base import prompt
from agents.sub_agents.knowledge_base.tools import (
    list_uploaded_documents,
    search_knowledge_base,
)

knowledge_base_agent = Agent(
    name="knowledge_base_agent",
    model=config.agents.get_model_for_agent("knowledge_base_agent"),
    description="Answers questions about uploaded documents by searching the vector DB (knowledge base). Use when the user asks anything about docs they uploaded or what is in the knowledge base.",
    instruction=prompt.INSTRUCTION,
    tools=[search_knowledge_base, list_uploaded_documents],
)
