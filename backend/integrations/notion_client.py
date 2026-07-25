"""
Notion integration — OAuth (public integration flow) + REST API calls to sync
the fundraise pipeline into a Notion database.

Requires a Notion "public integration" registered at notion.so/my-integrations
with OAuth enabled. Configure via env vars:
  NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_REDIRECT_URI

This talks to Notion's plain REST API (api.notion.com/v1/...), not the hosted
Notion MCP server — see integrations/__init__.py for why.
"""

from __future__ import annotations

import base64
import os
from datetime import datetime
from typing import Any

import httpx

NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"
AUTHORIZE_URL = "https://api.notion.com/v1/oauth/authorize"
TOKEN_URL = "https://api.notion.com/v1/oauth/token"

# Custom property used to match Pitchmate investor rows to Notion pages on re-sync.
PITCHMATE_ID_PROPERTY = "Pitchmate ID"


def is_configured() -> bool:
    return bool(os.environ.get("NOTION_CLIENT_ID") and os.environ.get("NOTION_CLIENT_SECRET"))


def get_authorize_url(state: str) -> str:
    client_id = os.environ.get("NOTION_CLIENT_ID", "")
    redirect_uri = os.environ.get("NOTION_REDIRECT_URI", "")
    if not client_id or not redirect_uri:
        raise RuntimeError(
            "Notion integration is not configured: set NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, "
            "and NOTION_REDIRECT_URI in the backend environment."
        )
    params = f"client_id={client_id}&response_type=code&owner=user&redirect_uri={redirect_uri}&state={state}"
    return f"{AUTHORIZE_URL}?{params}"


async def exchange_code_for_token(code: str) -> dict[str, Any]:
    """Exchange an authorization code for an access token. Returns the raw Notion response."""
    client_id = os.environ.get("NOTION_CLIENT_ID", "")
    client_secret = os.environ.get("NOTION_CLIENT_SECRET", "")
    redirect_uri = os.environ.get("NOTION_REDIRECT_URI", "")
    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            TOKEN_URL,
            headers={"Authorization": f"Basic {basic}", "Content-Type": "application/json"},
            json={"grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri},
        )
        resp.raise_for_status()
        return resp.json()


def _headers(access_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {access_token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


async def create_pipeline_database(access_token: str, parent_page_id: str) -> dict[str, Any]:
    """Create the 'Pitchmate Fundraise Pipeline' database under the given page."""
    payload = {
        "parent": {"type": "page_id", "page_id": parent_page_id},
        "title": [{"type": "text", "text": {"content": "Pitchmate Fundraise Pipeline"}}],
        "properties": {
            "Name": {"title": {}},
            "Firm": {"rich_text": {}},
            "Type": {"rich_text": {}},
            "Stage": {
                "select": {
                    "options": [
                        {"name": "Research"}, {"name": "Outreach"}, {"name": "Meeting scheduled"},
                        {"name": "Pitched"}, {"name": "Due diligence"}, {"name": "Term sheet"},
                        {"name": "Closed (won)"}, {"name": "Closed (lost)"},
                    ]
                }
            },
            "Warmth": {
                "select": {"options": [{"name": "cold"}, {"name": "warm"}, {"name": "hot"}]}
            },
            "Next action": {"rich_text": {}},
            "Follow-up date": {"date": {}},
            "Notes": {"rich_text": {}},
            PITCHMATE_ID_PROPERTY: {"rich_text": {}},
        },
    }
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            f"{NOTION_API_BASE}/databases", headers=_headers(access_token), json=payload
        )
        resp.raise_for_status()
        return resp.json()


def _investor_page_properties(investor, stage_label: str) -> dict[str, Any]:
    def rt(text: str | None) -> dict:
        return {"rich_text": [{"type": "text", "text": {"content": (text or "")[:2000]}}]}

    props: dict[str, Any] = {
        "Name": {"title": [{"type": "text", "text": {"content": investor.name or "Unnamed"}}]},
        "Firm": rt(investor.firm),
        "Type": rt(investor.investor_type),
        "Stage": {"select": {"name": stage_label}},
        "Warmth": {"select": {"name": investor.warmth or "cold"}},
        "Next action": rt(investor.next_action),
        "Notes": rt(investor.notes),
        PITCHMATE_ID_PROPERTY: rt(investor.id),
    }
    if investor.next_action_date:
        props["Follow-up date"] = {"date": {"start": investor.next_action_date.date().isoformat()}}
    return props


async def _find_page_by_pitchmate_id(access_token: str, database_id: str, investor_id: str) -> str | None:
    payload = {
        "filter": {
            "property": PITCHMATE_ID_PROPERTY,
            "rich_text": {"equals": investor_id},
        }
    }
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            f"{NOTION_API_BASE}/databases/{database_id}/query",
            headers=_headers(access_token),
            json=payload,
        )
        resp.raise_for_status()
        results = resp.json().get("results", [])
        return results[0]["id"] if results else None


async def sync_investors(
    access_token: str,
    database_id: str,
    investors: list,
    stage_labels: dict[str, str],
) -> tuple[int, int]:
    """Create/update one Notion page per investor. Returns (created, updated)."""
    created = 0
    updated = 0
    async with httpx.AsyncClient(timeout=20) as client:
        for investor in investors:
            stage_label = stage_labels.get(investor.pipeline_stage, investor.pipeline_stage)
            props = _investor_page_properties(investor, stage_label)
            page_id = await _find_page_by_pitchmate_id(access_token, database_id, investor.id)
            if page_id:
                resp = await client.patch(
                    f"{NOTION_API_BASE}/pages/{page_id}",
                    headers=_headers(access_token),
                    json={"properties": props},
                )
                resp.raise_for_status()
                updated += 1
            else:
                resp = await client.post(
                    f"{NOTION_API_BASE}/pages",
                    headers=_headers(access_token),
                    json={"parent": {"database_id": database_id}, "properties": props},
                )
                resp.raise_for_status()
                created += 1
    return created, updated
