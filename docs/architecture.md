# Architecture — how the LangGraph agent flow works

> Internals reference. For setup and usage see the root [README](../README.md).


When a user types a query, the following happens:

1. **Frontend**
   The chat UI sends a `POST` to `/agents/pitchmate` with `{ query, session_id }` and Pitchmate's own JWT (issued by `/auth/login` / `/auth/signup`, stored in `localStorage`) in the `Authorization` header (`apiPitchmate` in `pitchmateApi.js`).

2. **Backend entry**
   The FastAPI route `pitchmate()` in `agents/backend.py`:
   - Authenticates the user (`get_current_user`).
   - Loads **startup context** for this chat session (`get_session_context(session_id)`).
   - Builds an **enriched query** via `_build_enriched_query()` — it prepends the startup profile and any uploaded-doc summary to the user message so the agents see full context without you re-explaining the company.

3. **Agent resolution**
   `handle_pitchmate_request()` in `agents/agent_runner.py` picks the compiled graph:
   - Prefers the **checkpointer-backed** instance built during app startup (`get_cached_agent("pitchmate_agent")`, cached by `agents/langgraph_runner.py`).
   - Falls back to the module-level `pitchmate_agent` when the FastAPI lifespan never ran (scripts, tests) — that fallback has no cross-request memory.
   - Generates a `session_id` (`uuid4`) if the client didn't send one.

4. **Orchestrator run**
   `run_agent()` in `agents/langgraph_runner.py` invokes the compiled graph with the enriched query, passing `thread_id` so the **checkpointer** (`AsyncPostgresSaver`, or `MemorySaver` when no `DATABASE_URL`) can load and persist multi-turn state.

   The orchestrator is built by `build_pitchmate_agent()` in `agents/agent.py` via `create_react_agent()` — a two-node LangGraph state machine:

   ```
   ┌─────────┐  tool_calls?  ┌─────────┐
   │  agent  │ ────yes─────▶ │  tools  │
   │ (LLM)   │ ◀─────────────│(ToolNode)│
   └─────────┘               └─────────┘
        │ no tool_calls
        ▼
       END
   ```

   - **`agent` node** (`call_model`) — calls Gemini with the full message history.
   - **`should_continue`** — if the last message carries `tool_calls`, route to `tools`; otherwise `END`.
   - **`tools` node** — a `ToolNode` executes the requested tool(s), appends results as messages, and edges **back to `agent`**.

   That `tools → agent` edge *is* the agentic loop: it cycles until the model answers with no tool calls.

5. **Sub-agent execution (nested loops)**
   Each of the nine specialists is **itself** a compiled `create_react_agent` graph. `_build_sub_agent_tools()` wraps each one as an orchestrator tool through `create_sub_agent_tool()`, so when the orchestrator "calls a tool" it is really running a second, independent `agent ⇄ tools` loop underneath. That inner graph runs to completion (`compiled_agent.ainvoke`) and returns a single string back up as the outer loop's tool result.

6. **Response cleanup**
   `_clean_response()` strips internal markers and sub-agent lead-in phrases from the final message.

7. **Response to client**
   The route returns `{ response, session_id }`. The frontend appends the assistant message; if the response names a generated file, the UI shows a **Download** button hitting `/agents/artifacts/download/{filename}`.

**In short:**
User query → auth + context enrichment → compiled LangGraph orchestrator runs its `agent ⇄ tools` loop → each sub-agent tool is a nested `agent ⇄ tools` loop with its own tools (APIs, Pinecone, MCP, file generation) → orchestrator synthesizes a final answer → cleaned and returned → frontend renders it plus any download links.

### Call order (backend)

| Order | Function | File | What it does |
|-------|----------|------|--------------|
| 1 | `pitchmate()` | `agents/backend.py` | FastAPI route: auth, load session context, build enriched query, delegate. Returns `PitchmateResponse(response, session_id)`. |
| 2 | `handle_pitchmate_request()` | `agents/agent_runner.py` | Resolve the compiled agent (cached checkpointer-backed, else module default), mint a `session_id` if absent, call `run_agent()`. |
| 3 | `run_agent()` | `agents/langgraph_runner.py` | Invoke the compiled graph with `thread_id` for checkpointed memory; extract and clean the final message. |
| 4 | `create_react_agent()` graph | `agents/langgraph_base.py` | The `agent ⇄ tools` loop itself — `call_model`, `should_continue`, `ToolNode`. |
| 5 | `create_sub_agent_executor()` | `agents/agent.py` | Runs a chosen sub-agent's own compiled graph via `ainvoke` and returns its text as the tool result. |

### The nine sub-agents

Each row is one tool the orchestrator can call. Registration lives in `SUB_AGENT_SPECS` in `agents/agent.py`; a spec whose `get_agent()` returns `None` (missing credentials) is skipped, so the agent simply isn't offered.

| Tool (sub-agent) | Agent entry | Tools the agent can call |
|------------------|-------------|---------------------------|
| **Market Agent** | `market_validator_agent` | `validate_market_size`, `assess_competition`, `suggest_gtm_strategy`, `identify_customer_segments` |
| **Investor Outreacher** | `investor_outreacher_agent` | `draft_outreach_email`, `suggest_investor_types` |
| **Knowledge Base** | `knowledge_base_agent` | `search_knowledge_base`, `list_uploaded_documents` |
| **Web Search** | `web_search_agent` | `web_search`, `web_search_news` |
| **Draw.io** | `drawio_agent` | MCP toolset (`npx @drawio/mcp`) |
| **Pitch Writer** | `pitch_writer_agent` | `create_executive_summary_pdf`, `save_elevator_pitch` |
| **Due Diligence** | `due_diligence_agent` | `create_due_diligence_qa_pdf` |
| **Deck Creator** | `deck_creator_agent` | `create_deck_pdf`, `create_deck_docx` |
| **Figma Design** | `figma_mcp_agent` | MCP toolset (`npx @figma/mcp`) |

Tool implementations live in `agents/sub_agents/<name>/tools.py` (or MCP wiring in `agent.py` for Draw.io and Figma).

### Picking an agent directly

`GET /agents/available` (`list_available_agents`) returns the currently-available specialists plus an **"Auto (root agent)"** option. Auto is the default and routes through the orchestrator; selecting a specific agent resolves it with `get_sub_agent_by_name()` and skips orchestration entirely.

### Where does memory live?

Conversation state — including each tool call and its result — is held in the LangGraph **checkpointer**, keyed by `thread_id` (the chat's `session_id`):

- **`AsyncPostgresSaver`** when `DATABASE_URL` is set, so multi-turn context survives restarts.
- **`MemorySaver`** otherwise — works fine, but state is lost when the process exits.

Within a single request, the loop's own message list carries each sub-agent's output forward, so when the orchestrator continues it can see what the previous specialist returned before deciding whether to call another one or answer.

---

