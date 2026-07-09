"""
Guardrails and callbacks for LangGraph agents.
Migrated from Google ADK callback system to LangChain callbacks.
"""

from typing import Any, Dict, List, Optional
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.messages import BaseMessage
from langchain_core.outputs import LLMResult
import logging

logger = logging.getLogger("guardrails")


class KeywordBlockGuardrail(BaseCallbackHandler):
    """
    Callback that inspects messages for blocked keywords.
    Logs warnings when blocked keywords are detected.
    
    Note: LangChain callbacks can't block execution like Google ADK,
    but they can log, alert, and modify state for post-processing.
    """
    
    def __init__(self, blocked_keywords: List[str] = None):
        """
        Initialize the keyword block guardrail.
        
        Args:
            blocked_keywords: List of keywords to block (case-insensitive)
        """
        super().__init__()
        self.blocked_keywords = blocked_keywords or ["BLOCK"]
        self.blocked_count = 0
    
    def on_llm_start(
        self,
        serialized: Dict[str, Any],
        prompts: List[str],
        **kwargs: Any,
    ) -> None:
        """Check prompts for blocked keywords before LLM call."""
        for prompt in prompts:
            for keyword in self.blocked_keywords:
                if keyword.upper() in prompt.upper():
                    self.blocked_count += 1
                    logger.warning(
                        f"Blocked keyword '{keyword}' detected in prompt. "
                        f"Total blocks: {self.blocked_count}"
                    )
                    # In production, you could raise an exception here
                    # or set a flag in a shared state object
    
    def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        **kwargs: Any,
    ) -> None:
        """Check messages for blocked keywords before chat model call."""
        for message_list in messages:
            for message in message_list:
                content = message.content if hasattr(message, 'content') else str(message)
                for keyword in self.blocked_keywords:
                    if keyword.upper() in content.upper():
                        self.blocked_count += 1
                        logger.warning(
                            f"Blocked keyword '{keyword}' detected in message. "
                            f"Total blocks: {self.blocked_count}"
                        )


class ContentFilterGuardrail(BaseCallbackHandler):
    """
    Callback that monitors LLM outputs for inappropriate content.
    Logs warnings when content violations are detected.
    """
    
    def __init__(self, max_length: int = 10000):
        """
        Initialize the content filter guardrail.
        
        Args:
            max_length: Maximum allowed response length
        """
        super().__init__()
        self.max_length = max_length
        self.violation_count = 0
    
    def on_llm_end(
        self,
        response: LLMResult,
        **kwargs: Any,
    ) -> None:
        """Check LLM output for content violations."""
        for generation_list in response.generations:
            for generation in generation_list:
                text = generation.text
                
                # Check length
                if len(text) > self.max_length:
                    self.violation_count += 1
                    logger.warning(
                        f"Response length ({len(text)}) exceeds maximum ({self.max_length}). "
                        f"Total violations: {self.violation_count}"
                    )


class AgentMonitorCallback(BaseCallbackHandler):
    """
    Callback that monitors agent execution and logs key events.
    Useful for debugging and observability.
    """
    
    def __init__(self, agent_name: str = "agent"):
        """
        Initialize the agent monitor callback.
        
        Args:
            agent_name: Name of the agent being monitored
        """
        super().__init__()
        self.agent_name = agent_name
        self.llm_calls = 0
        self.tool_calls = 0
        self.errors = 0
    
    def on_llm_start(
        self,
        serialized: Dict[str, Any],
        prompts: List[str],
        **kwargs: Any,
    ) -> None:
        """Log LLM call start."""
        self.llm_calls += 1
        logger.info(f"[{self.agent_name}] LLM call #{self.llm_calls} started")
    
    def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,
        **kwargs: Any,
    ) -> None:
        """Log tool call start."""
        self.tool_calls += 1
        tool_name = serialized.get("name", "unknown")
        logger.info(
            f"[{self.agent_name}] Tool call #{self.tool_calls}: {tool_name}"
        )
    
    def on_tool_end(
        self,
        output: str,
        **kwargs: Any,
    ) -> None:
        """Log tool call completion."""
        logger.info(
            f"[{self.agent_name}] Tool call completed. Output length: {len(output)}"
        )
    
    def on_tool_error(
        self,
        error: BaseException,
        **kwargs: Any,
    ) -> None:
        """Log tool errors."""
        self.errors += 1
        logger.error(
            f"[{self.agent_name}] Tool error #{self.errors}: {str(error)}"
        )
    
    def on_llm_error(
        self,
        error: BaseException,
        **kwargs: Any,
    ) -> None:
        """Log LLM errors."""
        self.errors += 1
        logger.error(
            f"[{self.agent_name}] LLM error #{self.errors}: {str(error)}"
        )


def find_blocked_keyword(text: str, blocked_keywords: Optional[List[str]] = None) -> Optional[str]:
    """
    Check `text` for any blocked keyword (case-insensitive).

    LangChain callbacks (see `KeywordBlockGuardrail`) can only observe/log — they
    cannot stop a run. To actually block a request (matching the original Google
    ADK `block_keyword_guardrail` behavior), callers should check the *incoming*
    query with this function *before* invoking the graph, and short-circuit with a
    fixed response if a keyword is found. See `agents.langgraph_runner.run_agent`.

    Args:
        text: Text to inspect (typically the user's query).
        blocked_keywords: Keywords to check for; defaults to `["BLOCK"]`.

    Returns:
        The first blocked keyword found, or None if the text is clean.
    """
    for keyword in blocked_keywords or ["BLOCK"]:
        if keyword.upper() in text.upper():
            return keyword
    return None


def create_guardrail_callbacks(
    agent_name: str = "agent",
    blocked_keywords: List[str] = None,
    max_response_length: int = 10000,
    enable_monitoring: bool = True,
) -> List[BaseCallbackHandler]:
    """
    Create a list of guardrail callbacks for an agent.
    
    Args:
        agent_name: Name of the agent
        blocked_keywords: List of keywords to block
        max_response_length: Maximum allowed response length
        enable_monitoring: Whether to enable monitoring callback
        
    Returns:
        List of callback handlers
    """
    callbacks = [
        KeywordBlockGuardrail(blocked_keywords=blocked_keywords),
        ContentFilterGuardrail(max_length=max_response_length),
    ]
    
    if enable_monitoring:
        callbacks.append(AgentMonitorCallback(agent_name=agent_name))
    
    return callbacks


# Example usage:
# callbacks = create_guardrail_callbacks(
#     agent_name="pitchmate_agent",
#     blocked_keywords=["BLOCK", "FORBIDDEN"],
# )
# agent = create_react_agent(model, tools, prompt, callbacks=callbacks)
