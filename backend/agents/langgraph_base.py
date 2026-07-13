"""
LangGraph base utilities for Pitchmate agents.
Provides state schemas, tool wrappers, and agent creation utilities.
"""

import os
from typing import Annotated, Any, Literal, Sequence, TypedDict
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import BaseTool, StructuredTool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langgraph.graph.message import add_messages
import functools
import logging

logger = logging.getLogger("langgraph_base")


# Base State for LangGraph agents
class AgentState(TypedDict):
    """Base state for all agents."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    agent_outcome: str | None


class OrchestratorState(TypedDict):
    """State for the orchestrator agent that delegates to sub-agents."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    sub_agent_results: dict[str, Any]
    current_step: int


def message_content_to_text(content: Any) -> str:
    """
    Normalize AIMessage.content to plain text.

    Gemini 3+ / langchain-google-genai 4.x may return a list of content blocks
    (with thought-signature extras) instead of a plain string.
    """
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                text = block.get("text")
                if text:
                    parts.append(str(text))
            else:
                text = getattr(block, "text", None)
                if text:
                    parts.append(str(text))
        return "".join(parts)
    return str(content)


def ai_message_to_text(message: Any) -> str:
    """Extract display text from an AIMessage (supports Gemini 3 block content)."""
    text_attr = getattr(message, "text", None)
    if isinstance(text_attr, str) and text_attr.strip():
        return text_attr
    return message_content_to_text(getattr(message, "content", ""))


def create_google_llm(
    model: str = "gemini-3.5-flash",
    temperature: float = 0.3,
    max_retries: int = 2,
    thinking_level: str | None = "low",
) -> ChatGoogleGenerativeAI:
    """
    Create a Google Generative AI LLM instance.

    Uses langchain-google-genai >= 3.1 so Gemini 3.x tool-calling loops preserve
    thought_signature across turns (required by the API).

    Args:
        model: Gemini model name (e.g. "gemini-3.5-flash")
        temperature: Sampling temperature (0.0 to 1.0)
        max_retries: Number of retry attempts for failed requests
        thinking_level: Gemini 3+ thinking depth ("minimal"|"low"|"medium"|"high").
            Pass None to use the API default. Ignored for models that don't support it.

    Returns:
        ChatGoogleGenerativeAI instance
    """
    # langchain-google-genai only reads GOOGLE_API_KEY by default. This repo's
    # .env / deploy config uses GEMINI_API_KEY, so without this fallback every
    # agent fails at construction with a DefaultCredentialsError.
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")

    kwargs: dict[str, Any] = {
        "model": model,
        "temperature": temperature,
        "max_retries": max_retries,
        "google_api_key": api_key,
    }
    # Gemini 3+ thinking control. Keep signatures intact via the upgraded SDK;
    # "low" balances quality vs latency for multi-tool agent runs.
    if thinking_level is not None and ("gemini-3" in model or "gemini-3." in model):
        kwargs["thinking_level"] = thinking_level

    try:
        return ChatGoogleGenerativeAI(**kwargs)
    except TypeError:
        # Older SDK builds may not accept thinking_level — retry without it.
        kwargs.pop("thinking_level", None)
        return ChatGoogleGenerativeAI(**kwargs)


def wrap_tool_function(func: callable, name: str | None = None, description: str | None = None) -> StructuredTool:
    """
    Wrap a Python function as a LangChain StructuredTool.
    
    Args:
        func: The function to wrap (must have type hints)
        name: Tool name (defaults to function name)
        description: Tool description (defaults to function docstring)
        
    Returns:
        StructuredTool instance
    """
    return StructuredTool.from_function(
        func=func,
        name=name or func.__name__,
        description=description or func.__doc__ or f"Tool: {func.__name__}",
    )


def create_react_agent(
    model: ChatGoogleGenerativeAI,
    tools: list[BaseTool],
    system_prompt: str,
    agent_name: str = "agent",
    checkpointer: Any | None = None,
    callbacks: list[BaseCallbackHandler] | None = None,
) -> StateGraph:
    """
    Create a ReAct-style agent using LangGraph.
    
    The agent follows the ReAct pattern:
    1. Reason about the current state
    2. Act by calling tools or responding
    3. Observe tool results
    4. Repeat until task is complete
    
    Args:
        model: LLM instance
        tools: List of tools the agent can use
        system_prompt: System instruction for the agent
        agent_name: Name of the agent (for logging)
        checkpointer: Optional LangGraph checkpointer (e.g. AsyncPostgresSaver or
            MemorySaver) to enable cross-request session persistence. Without this,
            the compiled graph has no memory even if a `thread_id` is passed at
            invoke time.
        callbacks: Optional guardrail/monitoring callbacks (see
            `agents.guardrails_langgraph.create_guardrail_callbacks`). Bound directly
            onto the model (via `.with_config()`) and passed into the `ToolNode` so
            they reliably fire on every LLM call and tool call for this agent,
            regardless of how the graph is later invoked. Note: the raw `tools` list
            passed to `model.bind_tools()` must stay unwrapped — Gemini's tool-schema
            conversion doesn't understand `RunnableBinding`-wrapped tools.
        
    Returns:
        Compiled StateGraph
    """
    # Bind tools to the model (must use the raw, unwrapped tool objects — Gemini's
    # function-declaration conversion can't introspect a RunnableBinding).
    model_with_tools = model.bind_tools(tools)
    if callbacks:
        # Bind callbacks onto the model too, so on_llm_start/on_chat_model_start/
        # on_llm_end/on_llm_error reliably fire for this agent's LLM calls.
        model_with_tools = model_with_tools.with_config(callbacks=callbacks)
    
    # Create the prompt template
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    # Define the agent node
    def call_model(state: AgentState) -> dict:
        """Agent reasoning and action selection."""
        messages = state["messages"]
        formatted = prompt.invoke({"messages": messages})
        response = model_with_tools.invoke(formatted.messages)
        return {"messages": [response]}
    
    # Define the decision function
    def should_continue(state: AgentState) -> Literal["tools", "end"]:
        """Determine if agent should continue or end."""
        last_message = state["messages"][-1]
        # If there are tool calls, continue to tools node
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        # Otherwise, end
        return "end"
    
    # Build the graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("agent", call_model)
    tool_node = ToolNode(tools)
    if callbacks:
        # Bind onto the ToolNode itself (not the individual tools — Gemini's
        # bind_tools() can't introspect RunnableBinding-wrapped tools) so
        # on_tool_start/on_tool_end/on_tool_error reliably fire.
        tool_node = tool_node.with_config(callbacks=callbacks)
    workflow.add_node("tools", tool_node)
    
    # Set entry point
    workflow.set_entry_point("agent")
    
    # Add edges
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            "end": END,
        },
    )
    workflow.add_edge("tools", "agent")
    
    return workflow.compile(checkpointer=checkpointer)


def create_tool_calling_agent(
    model: ChatGoogleGenerativeAI,
    tools: list[BaseTool],
    system_prompt: str,
) -> callable:
    """
    Create a simple tool-calling agent (non-ReAct, single-turn).
    Useful for sub-agents that execute a specific task and return.
    
    Args:
        model: LLM instance
        tools: List of tools the agent can use
        system_prompt: System instruction for the agent
        
    Returns:
        Async function that processes a query and returns a response
    """
    model_with_tools = model.bind_tools(tools)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    async def agent_executor(messages: list[BaseMessage]) -> str:
        """Execute the agent with the given messages."""
        formatted = prompt.invoke({"messages": messages})
        response = await model_with_tools.ainvoke(formatted.messages)
        
        # If tool calls are made, execute them
        if hasattr(response, "tool_calls") and response.tool_calls:
            tool_node = ToolNode(tools)
            # Execute tools
            tool_results = await tool_node.ainvoke({
                "messages": [response]
            })
            # Get final response
            final_messages = [*messages, response, *tool_results["messages"]]
            final_formatted = prompt.invoke({"messages": final_messages})
            final_response = await model_with_tools.ainvoke(final_formatted.messages)
            return ai_message_to_text(final_response)
        
        return ai_message_to_text(response)
    
    return agent_executor


def create_sub_agent_tool(
    agent_executor: callable,
    name: str,
    description: str,
) -> BaseTool:
    """
    Wrap a sub-agent executor as a tool that can be called by the orchestrator.
    
    Args:
        agent_executor: Async function that executes the sub-agent
        name: Tool/agent name
        description: Tool/agent description
        
    Returns:
        StructuredTool that wraps the sub-agent
    """
    async def run_sub_agent(query: str) -> str:
        """Execute the sub-agent with the given query."""
        messages = [HumanMessage(content=query)]
        try:
            result = await agent_executor(messages)
            return result
        except Exception as e:
            logger.error(f"Sub-agent {name} failed: {e}")
            return f"Error executing {name}: {str(e)}"
    
    return StructuredTool.from_function(
        coroutine=run_sub_agent,
        name=name,
        description=description,
    )
