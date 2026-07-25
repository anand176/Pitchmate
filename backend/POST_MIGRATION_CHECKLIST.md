# Post-Migration Checklist

## ✅ Immediate Next Steps

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

**Expected packages:**
- `langchain==0.3.15`
- `langgraph==0.2.63`
- `langchain-google-genai==2.0.8`
- `langgraph-checkpoint-postgres==2.0.12`

### 2. Environment Configuration
Ensure your `.env` file has these required variables:

```env
# Required
GEMINI_API_KEY=your-gemini-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Optional but recommended
DATABASE_URL=postgresql://user:password@host:port/dbname
PITCHMATE_MODEL=gemini-2.5-flash

# Optional for MCP agents
SERPAPI_API_KEY=your-serpapi-key  # For web search
FIGMA_PERSONAL_ACCESS_TOKEN=your-figma-token  # For Figma agent
```

### 3. Database Setup (Optional, but recommended for production)
If using PostgreSQL for session persistence:

```python
# The checkpointer will auto-create tables on first run
# Or manually run:
python -c "
import asyncio
from agents.langgraph_runner import get_checkpointer

async def setup():
    checkpointer = await get_checkpointer()
    print('Checkpointer initialized and tables created')

asyncio.run(setup())
"
```

### 4. Run Basic Tests
```bash
cd backend
python agents/test_migration.py
```

**Expected output:**
```
✓ Testing LLM creation...
  Created LLM: gemini-2.5-flash
✓ Testing sub-agents...
  Market validator agent: OK
  Pitch writer agent: OK
✓ Testing orchestrator agent...
  Pitchmate agent: OK

✅ All basic tests passed!
```

### 5. Start the Backend
```bash
cd backend
uvicorn app:app --reload --port 8000
```

### 6. Test API Endpoints

#### Test Health Check
```bash
curl http://localhost:8000/health
```

#### Test Pitchmate Agent
```bash
curl -X POST http://localhost:8000/agents/pitchmate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "What are the key elements of a pitch deck?",
    "session_id": "test-session-123"
  }'
```

### 7. Start Frontend
```bash
cd frontend
npm install  # If not already done
npm run dev
```

Visit `http://localhost:5173` and test the chat interface.

---

## 🔍 Verification Checklist

### Core Functionality
- [ ] Main pitchmate agent responds to queries
- [ ] Session persistence works across requests
- [ ] Responses are properly cleaned (no technical markers)

### Sub-Agents
- [ ] Market validator agent works
- [ ] Pitch writer agent creates PDFs
- [ ] Due diligence agent generates Q&A documents
- [ ] Browse agent performs web searches (requires SERPAPI_API_KEY)
- [ ] Knowledge base agent searches documents
- [ ] Investor outreacher drafts emails
- [ ] Deck creator generates PDF/DOCX

### MCP Agents (Optional)
- [ ] Figma agent analyzes designs (requires FIGMA_PERSONAL_ACCESS_TOKEN)
- [ ] Draw.io agent creates diagrams (requires npx)

### Error Handling
- [ ] Agent handles invalid queries gracefully
- [ ] Proper error messages for missing API keys
- [ ] Session recovery after errors

---

## 🐛 Troubleshooting

### Issue: Import errors after pip install
**Symptom:** `ModuleNotFoundError: No module named 'langchain'`

**Solution:**
```bash
pip uninstall google-adk google-generativeai
pip install -r requirements.txt --force-reinstall
```

### Issue: MCP agents don't load (Figma/Draw.io)
**Symptom:** Agent is `None` or errors on first use

**Solution:**
1. Check that `npx` is available: `npx --version`
2. Test MCP package installation: `npx -y @drawio/mcp --help`
3. For Figma, ensure `FIGMA_PERSONAL_ACCESS_TOKEN` is set
4. Check logs for MCP connection errors

**Temporary workaround:** Comment out MCP agents in `agents/agent.py` if not needed.

### Issue: Database connection errors
**Symptom:** `Connection to database failed`

**Solution:**
1. Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
2. Test connection: `psql $DATABASE_URL -c "SELECT 1;"`
3. Fallback: Remove `DATABASE_URL` to use in-memory checkpointing (no persistence)

### Issue: Tool execution failures
**Symptom:** "Error executing agent: ..." or tool results are empty

**Solution:**
1. Check that tools have proper type hints
2. Verify async tools use `coroutine` parameter
3. Test individual tools directly
4. Check tool function signatures match LangChain requirements

### Issue: Slow response times
**Symptom:** Requests take > 30 seconds

**Solution:**
1. Check Gemini API rate limits
2. Reduce `temperature` in agent configs
3. Optimize tool execution (especially web searches)
4. Consider caching for repeated queries

---

## 📊 Performance Comparison

Test the same queries on both versions to compare:

| Metric | Google ADK | LangGraph | Notes |
|--------|-----------|-----------|-------|
| Cold start | ? | ? | First request after restart |
| Avg response | ? | ? | Typical query response time |
| Memory usage | ? | ? | Process memory footprint |
| Session restore | ? | ? | Time to restore previous session |

---

## 🔄 Rollback Procedure

If critical issues arise:

### 1. Restore Previous Version
```bash
# Restore requirements.txt
git checkout HEAD~N backend/requirements.txt
pip install -r backend/requirements.txt

# Restore agent files
git checkout HEAD~N backend/agents/

# Restart server
uvicorn app:app --reload --port 8000
```

Replace `N` with the number of commits back to go (check `git log` first).

### 2. Notify Team
Document the issue and reason for rollback.

### 3. Fix Forward
- Review error logs
- Check migration guide for solutions
- Test fix in development
- Redeploy when ready

---

## 📈 Monitoring & Observability

### Add LangSmith (Optional)
For production monitoring, consider adding LangSmith:

```bash
pip install langsmith
```

```python
# In agents/langgraph_base.py
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-api-key"
```

### Custom Logging
Use the built-in guardrails for monitoring:

```python
from agents.guardrails_langgraph import create_guardrail_callbacks

callbacks = create_guardrail_callbacks(
    agent_name="pitchmate_agent",
    blocked_keywords=["CONFIDENTIAL", "SECRET"],
    enable_monitoring=True,
)
```

### Health Check Endpoint
Add agent health checks to your FastAPI app:

```python
@app.get("/agents/health")
async def agent_health():
    try:
        from agents.agent import pitchmate_agent
        return {
            "status": "healthy",
            "agent_loaded": pitchmate_agent is not None
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
```

---

## 🎯 Success Criteria

The migration is successful when:

- ✅ All sub-agents respond correctly
- ✅ Session persistence works
- ✅ No regressions in functionality
- ✅ Error handling is robust
- ✅ Performance is acceptable
- ✅ Documentation is complete
- ✅ Team is trained on new system

---

## 📚 Additional Resources

- **LangChain Docs:** https://python.langchain.com/
- **LangGraph Tutorial:** https://langchain-ai.github.io/langgraph/tutorials/
- **Google Gemini Docs:** https://ai.google.dev/docs
- **Migration Guide:** `backend/MIGRATION_GUIDE.md`
- **Migration Summary:** `backend/MIGRATION_SUMMARY.md`
- **Test Suite:** `backend/agents/test_migration.py`

---

## ✅ Sign-Off

Once all checks pass:

- [ ] All tests passing
- [ ] Production deployment successful
- [ ] Monitoring in place
- [ ] Documentation updated
- [ ] Team notified

**Migration completed by:** _______________  
**Date:** _______________  
**Approved by:** _______________

---

## 💡 Future Enhancements

Consider these improvements after stabilization:

1. **Streaming Responses** - LangGraph supports streaming, add this for better UX
2. **Advanced Checkpointing** - Implement branch/merge for complex workflows
3. **Custom Tools** - Add more domain-specific tools
4. **Agent Metrics** - Add detailed performance tracking
5. **A/B Testing** - Compare different prompts/models
6. **Rate Limiting** - Add per-user rate limits
7. **Caching Layer** - Cache common queries/responses
8. **Multi-Model Support** - Support multiple LLM providers

---

**Need help?** Review the migration documents or check LangChain community forums.
