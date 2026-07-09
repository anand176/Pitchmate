"""
Dashboard package — structured (non-chat) API endpoints for the Pitchmate dashboard UI.

Unlike the chat endpoint (`agents/backend.py`), which returns freeform agent text,
these endpoints return typed JSON matching the Pydantic schemas in `schemas.py`, so
the frontend dashboard tabs (Market, Investors, Competition, GTM, Valuation, Deck)
can render structured data instead of parsing markdown.
"""
