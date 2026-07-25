# Google ADK to LangChain-LangGraph Migration Guide

## Overview

This migration converts the Pitchmate agent system from Google ADK to LangChain-LangGraph while maintaining all functionality and improving modularity.

## What Changed

### 1. Dependencies
**Before (Google ADK):**
```
google-adk==1.22.0
google-generativeai==0.8.3
```

**After (LangChain-LangGraph):**
```
langchain==0.3.15
langchain-google-genai==2.0.8
langgraph==0.2.63
langgraph-checkpoint-postgres==2.0.12
```

### 2. Core Architecture

#### Agent Definition
**Before:**
```python
from google.adk.agents import Agent

agent = Agent(
    name="agent_name",
    model="gemini-2.5-flash",
    instruction="...",
    tools=[tool1, tool2],
    generate_content_config=genai_types.GenerateContentConfig(...)
)
```

**After:**
```python
from agents.langgraph_base import create_google_llm, wrap_tool_function, create_react_agent

model = create_google_llm(model="gemini-2.5-flash", temperature=0.3)
tools = [wrap_tool_function(tool1), wrap_tool_function(tool2)]
agent = create_react_agent(model, tools, system_prompt="...", agent_name="agent_name")
```

#### Runner/Execution
**Before:**
```python
from google.adk.runners import Runner
from google.adk.apps import App

app = App(name="app", root_agent=agent, plugins=[...])
runner = Runner(app=app, session_service=..., memory_service=...)
response = await runner.run_async(user_id, session_id, message)
```

**After:**
```python
from agents.langgraph_runner import run_agent

response = await run_agent(
    compiled_agent=agent,
    user_id=user_id,
    session_id=session_id,
    query=query,
    agent_name="agent_name"
)
```

#### Session Management
**Before:**
```python
from google.adk.sessions import DatabaseSessionService
session_service = DatabaseSessionService(db_url=db_url)
```

**After:**
```python
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
checkpointer = AsyncPostgresSaver.from_conn_string(db_url)
await checkpointer.setup()
```

### 3. New Module Structure

#### `agents/langgraph_base.py`
Core utilities for creating LangGraph agents:
- `create_google_llm()` - Create Gemini LLM instances
- `wrap_tool_function()` - Convert Python functions to LangChain tools
- `create_react_agent()` - Create ReAct-style agents
- `create_sub_agent_tool()` - Wrap sub-agents as tools for orchestration

#### `agents/langgraph_runner.py`
Execution infrastructure:
- `get_checkpointer()` - Session persistence (PostgreSQL or in-memory)
- `run_agent()` - Execute agents with checkpointing
- `handle_agent_request()` - High-level request handler

#### `agents/mcp_integration.py`
MCP (Model Context Protocol) integration for LangChain:
- `MCPToolWrapper` - Wrapper for MCP servers
- `get_mcp_tools()` - Convert MCP tools to LangChain tools

### 4. Agent Migrations

All agents have been migrated:

1. **market_validator_agent** - Market validation and GTM strategy
2. **pitch_writer_agent** - Elevator pitch and executive summary
3. **due_diligence_agent** - Investor Q&A preparation
4. **web_search_agent** - Web search and news (formerly `browse_mcp_agent` / `brave_search_mcp`; SerpAPI-based, not MCP)
5. **investor_outreacher_agent** - Investor targeting and outreach
6. **knowledge_base_agent** - Document search and deck review
7. **deck_creator_agent** - Pitch deck document generation
8. **figma_mcp_agent** - Figma design analysis (MCP)
9. **drawio_agent** - Diagram creation (MCP)

### 5. Orchestrator Agent

The main `pitchmate_agent` now uses LangGraph's hierarchical agent pattern:
- Sub-agents are wrapped as tools
- ReAct planner handles routing and delegation
- State management via LangGraph checkpointing

## Key Benefits

### 1. **Better Modularity**
- Clear separation of concerns
- Reusable utilities for agent creation
- Easier to test and maintain

### 2. **Standard Framework**
- LangChain is more widely adopted
- Better documentation and community support
- More integrations available

### 3. **Improved State Management**
- Built-in checkpointing with PostgreSQL
- Better session persistence
- Easier debugging with state inspection

### 4. **MCP Integration**
- Native MCP support via LangChain
- Easier to add new MCP servers
- Better error handling

## Migration Checklist

- [x] Update requirements.txt with LangChain dependencies
- [x] Create LangGraph base utilities
- [x] Migrate runner infrastructure
- [x] Migrate all 9 sub-agents
- [x] Migrate orchestrator agent
- [x] Update API endpoints
- [x] Test basic functionality

## Testing

### Basic Test
```python
from agents.agent import pitchmate_agent
from agents.langgraph_runner import run_agent

response = await run_agent(
    compiled_agent=pitchmate_agent,
    user_id="test_user",
    session_id="test_session",
    query="What are the key elements of a pitch deck?",
    agent_name="pitchmate_agent"
)
print(response)
```

### Test Sub-Agent
```python
from agents.sub_agents.market_validator.agent import market_validator_agent
from agents.langgraph_runner import run_agent

response = await run_agent(
    compiled_agent=market_validator_agent,
    user_id="test_user",
    session_id="test_session",
    query="Validate my market size: TAM $50B, SAM $5B, SOM $500M",
    agent_name="market_validator_agent"
)
print(response)
```

## Known Issues & Considerations

### 1. MCP Agents (Figma, Draw.io)
- These agents initialize MCP connections on startup
- If MCP servers are unavailable, agents will be `None`
- Consider implementing lazy loading for production

### 2. Session Persistence
- PostgreSQL checkpointer requires schema setup
- Falls back to in-memory if DB unavailable
- Ensure `DATABASE_URL` is set for persistence

### 3. Tool Compatibility
- Most tools work as-is with `wrap_tool_function()`
- Complex tools may need custom wrapping
- Async tools are fully supported

## Rollback Plan

If issues arise, the old Google ADK code can be temporarily restored:

1. Revert `requirements.txt` to use `google-adk`
2. Restore `backend/agents/agent.py` from git
3. Restore `backend/agents/agent_runner.py` from git
4. Restore sub-agent files from git

## Next Steps

1. **Test all endpoints** - Verify each agent works correctly
2. **Performance testing** - Compare response times
3. **Error handling** - Test error scenarios and recovery
4. **Documentation** - Update API docs with new architecture
5. **Monitoring** - Add observability for LangGraph execution

## Support

For questions or issues:
- Check LangChain documentation: https://python.langchain.com/
- LangGraph docs: https://langchain-ai.github.io/langgraph/
- Review migration commit history

---

**Migration completed:** June 28, 2026
**Migrated by:** AI Agent
**Framework versions:**
- LangChain: 0.3.15
- LangGraph: 0.2.63
- LangChain Google GenAI: 2.0.8
