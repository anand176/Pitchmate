"""
Basic tests for LangGraph migration.
Run with: python -m pytest backend/agents/test_migration.py
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, Mock, patch
from langchain_core.messages import HumanMessage, AIMessage


class TestLangGraphBase:
    """Test the base LangGraph utilities."""
    
    def test_create_google_llm(self):
        """Test LLM creation."""
        from agents.langgraph_base import create_google_llm
        
        llm = create_google_llm(model="gemini-3.5-flash", temperature=0.3)
        assert llm is not None
        assert "gemini-3.5-flash" in str(llm.model)
        assert llm.temperature == 0.3
    
    def test_wrap_tool_function(self):
        """Test tool wrapping."""
        from agents.langgraph_base import wrap_tool_function
        
        def sample_tool(query: str) -> str:
            """A sample tool for testing."""
            return f"Result: {query}"
        
        wrapped_tool = wrap_tool_function(sample_tool)
        assert wrapped_tool is not None
        assert wrapped_tool.name == "sample_tool"
        assert "sample tool" in wrapped_tool.description.lower()


class TestSubAgents:
    """Test that sub-agents are properly initialized."""
    
    def test_market_validator_agent(self):
        """Test market validator agent initialization."""
        from agents.sub_agents.market_validator.agent import market_validator_agent
        assert market_validator_agent is not None
    
    def test_pitch_writer_agent(self):
        """Test pitch writer agent initialization."""
        from agents.sub_agents.pitch_writer.agent import pitch_writer_agent
        assert pitch_writer_agent is not None
    
    def test_due_diligence_agent(self):
        """Test due diligence agent initialization."""
        from agents.sub_agents.due_diligence.agent import due_diligence_agent
        assert due_diligence_agent is not None
    
    def test_browse_agent(self):
        """Test web search agent initialization."""
        from agents.sub_agents.web_search.agent import web_search_agent
        assert web_search_agent is not None

    def test_valuation_advisor_agent(self):
        """Test valuation advisor agent initialization."""
        from agents.sub_agents.valuation_advisor.agent import valuation_advisor_agent
        assert valuation_advisor_agent is not None

    def test_estimate_valuation_tool(self):
        """Test the deterministic valuation estimation logic."""
        import json
        from agents.sub_agents.valuation_advisor.tools import estimate_valuation

        result = json.loads(estimate_valuation(
            stage="seed", sector="B2B SaaS", arr="$400K",
            growth_rate_yoy="150%", team_strength=4, traction_strength=3,
        ))
        assert result["estimated_valuation_low"] < result["estimated_valuation_high"]


class TestOrchestratorAgent:
    """Test the main orchestrator agent."""
    
    def test_pitchmate_agent_initialization(self):
        """Test that pitchmate agent is properly initialized."""
        from agents.agent import pitchmate_agent
        assert pitchmate_agent is not None


@pytest.mark.asyncio
class TestRunner:
    """Test the LangGraph runner."""
    
    async def test_checkpointer_initialization(self):
        """Test checkpointer initialization."""
        from agents.langgraph_runner import get_checkpointer
        
        checkpointer = await get_checkpointer()
        assert checkpointer is not None
    
    @patch('agents.langgraph_runner.get_checkpointer')
    async def test_run_agent_basic(self, mock_checkpointer):
        """Test basic agent execution (mocked)."""
        from agents.langgraph_runner import run_agent
        
        # Create a mock agent that returns a simple response
        mock_agent = Mock()
        mock_response = {
            "messages": [
                HumanMessage(content="test query"),
                AIMessage(content="test response")
            ]
        }
        mock_agent.ainvoke = AsyncMock(return_value=mock_response)
        
        # Mock checkpointer
        mock_checkpointer.return_value = Mock()
        
        # Run the agent
        response = await run_agent(
            compiled_agent=mock_agent,
            user_id="test_user",
            session_id="test_session",
            query="test query",
            agent_name="test_agent"
        )
        
        assert response == "test response"
        assert mock_agent.ainvoke.called


class TestGuardrails:
    """Test guardrail callbacks."""
    
    def test_keyword_guardrail_creation(self):
        """Test keyword guardrail initialization."""
        from agents.guardrails_langgraph import KeywordBlockGuardrail
        
        guardrail = KeywordBlockGuardrail(blocked_keywords=["TEST"])
        assert guardrail is not None
        assert "TEST" in guardrail.blocked_keywords
    
    def test_create_guardrail_callbacks(self):
        """Test guardrail callbacks factory."""
        from agents.guardrails_langgraph import create_guardrail_callbacks
        
        callbacks = create_guardrail_callbacks(
            agent_name="test_agent",
            blocked_keywords=["BLOCK"],
        )
        assert callbacks is not None
        assert len(callbacks) >= 2


if __name__ == "__main__":
    # Run basic synchronous tests
    print("Running basic initialization tests...")
    
    print("✓ Testing LLM creation...")
    from agents.langgraph_base import create_google_llm
    llm = create_google_llm()
    print(f"  Created LLM: {llm.model}")
    
    print("✓ Testing sub-agents...")
    from agents.sub_agents.market_validator.agent import market_validator_agent
    print(f"  Market validator agent: {'OK' if market_validator_agent else 'FAILED'}")
    
    from agents.sub_agents.pitch_writer.agent import pitch_writer_agent
    print(f"  Pitch writer agent: {'OK' if pitch_writer_agent else 'FAILED'}")
    
    print("✓ Testing orchestrator agent...")
    from agents.agent import pitchmate_agent
    print(f"  Pitchmate agent: {'OK' if pitchmate_agent else 'FAILED'}")
    
    print("\n✅ All basic tests passed!")
    print("Run 'python -m pytest backend/agents/test_migration.py' for full test suite")
