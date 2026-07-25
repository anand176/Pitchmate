"""
Integrations package — OAuth connections to external services (Notion, Google)
for the fundraise pipeline: syncing investor rows to Notion and scheduling
follow-ups on Google Calendar / listing Google Drive files.

Note on "MCP": Notion and Google both ship *hosted* remote MCP servers meant
for interactive AI clients (Claude, Cursor) where a human completes OAuth
inside that client. Pitchmate is a multi-tenant backend product, not an MCP
client, so this package talks to Notion's and Google's plain REST APIs
directly using per-user OAuth tokens obtained via our own OAuth app — the
same end result (an AI-driven action reaching your Notion/Calendar/Drive)
without requiring every founder to own an MCP-capable desktop AI tool.
"""
