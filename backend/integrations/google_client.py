"""
Google integration — OAuth (installed/web app flow) + REST calls to Google
Calendar (schedule investor follow-ups) and Google Drive (list files for
deck/data-room linking).

Requires a Google Cloud OAuth 2.0 Client ID (Web application) with the
Calendar and Drive APIs enabled. Configure via env vars:
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

Uses Google's plain REST APIs directly with per-user OAuth tokens, not the
hosted Google Workspace MCP servers — see integrations/__init__.py for why.
"""

from __future__ import annotations

import os
from typing import Any
from urllib.parse import urlencode

import httpx

AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files"

SCOPES = " ".join([
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
])


def is_configured() -> bool:
    return bool(os.environ.get("GOOGLE_CLIENT_ID") and os.environ.get("GOOGLE_CLIENT_SECRET"))


def get_authorize_url(state: str) -> str:
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI", "")
    if not client_id or not redirect_uri:
        raise RuntimeError(
            "Google integration is not configured: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, "
            "and GOOGLE_REDIRECT_URI in the backend environment."
        )
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{AUTHORIZE_URL}?{urlencode(params)}"


async def exchange_code_for_token(code: str) -> dict[str, Any]:
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI", "")
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            TOKEN_URL,
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )
        resp.raise_for_status()
        return resp.json()


async def refresh_access_token(refresh_token: str) -> dict[str, Any]:
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            TOKEN_URL,
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        resp.raise_for_status()
        return resp.json()


async def get_account_email(access_token: str) -> str | None:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
        if resp.status_code != 200:
            return None
        return resp.json().get("email")


async def create_calendar_event(
    access_token: str,
    summary: str,
    description: str,
    start_iso: str,
    end_iso: str,
) -> dict[str, Any]:
    payload = {
        "summary": summary,
        "description": description,
        "start": {"dateTime": start_iso},
        "end": {"dateTime": end_iso},
    }
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            CALENDAR_EVENTS_URL,
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


async def list_drive_files(access_token: str, query: str | None = None) -> list[dict[str, Any]]:
    params = {
        "pageSize": 20,
        "fields": "files(id,name,mimeType,webViewLink)",
        "orderBy": "modifiedTime desc",
    }
    if query:
        params["q"] = f"name contains '{query}' and trashed = false"
    else:
        params["q"] = "trashed = false"
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            DRIVE_FILES_URL, headers={"Authorization": f"Bearer {access_token}"}, params=params
        )
        resp.raise_for_status()
        return resp.json().get("files", [])
