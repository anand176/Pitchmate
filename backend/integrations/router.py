"""
Integrations router — OAuth connect/callback/disconnect for Notion and Google,
plus the concrete actions the Pipeline tab uses: syncing investors to Notion
and scheduling a Google Calendar follow-up.

OAuth notes:
  - `/connect` is called by the frontend with a normal Bearer JWT and returns
    an authorize_url to navigate to (full page redirect, not fetch).
  - `/callback` is hit by the provider as a plain browser redirect (no auth
    header), so the user id is threaded through the signed `state` param
    instead (see integrations/oauth_state.py).
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt as pyjwt
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from db.base import get_db_session
from db.models import InvestorContact, IntegrationCredential
from integrations import google_client, notion_client
from integrations.crypto import decrypt, encrypt
from integrations.oauth_state import create_oauth_state, verify_oauth_state
from integrations.schemas import (
    ConnectUrlResponse,
    DriveFile,
    DriveFilesResponse,
    IntegrationStatus,
    IntegrationStatusResponse,
    NotionSettingsUpdate,
    NotionSyncResult,
    ScheduleFollowupRequest,
    ScheduleFollowupResult,
)
from pipeline.schemas import STAGE_LABELS

logger = logging.getLogger("integrations_router")
router = APIRouter(prefix="/integrations", tags=["Integrations"])

PROVIDERS = ("notion", "google")


def _frontend_url() -> str:
    import os

    return os.environ.get("FRONTEND_URL", "http://localhost:5173")


async def _get_credential(db: AsyncSession, user_id: str, provider: str) -> IntegrationCredential | None:
    return await db.scalar(
        select(IntegrationCredential).where(
            IntegrationCredential.user_id == user_id, IntegrationCredential.provider == provider
        )
    )


def _normalize_notion_page_id(raw: str) -> str:
    """Accept either a raw Notion page ID or a full page URL and return a dashed UUID."""
    hex_chars = re.sub(r"[^0-9a-fA-F]", "", raw)[-32:]
    if len(hex_chars) != 32:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not parse a Notion page ID from that value. Paste the full page URL or its 32-character ID.",
        )
    return f"{hex_chars[0:8]}-{hex_chars[8:12]}-{hex_chars[12:16]}-{hex_chars[16:20]}-{hex_chars[20:32]}"


async def _valid_google_access_token(db: AsyncSession, cred: IntegrationCredential) -> str:
    """Return a usable Google access token, refreshing it first if expired."""
    if cred.expires_at and cred.expires_at <= datetime.now(timezone.utc) + timedelta(seconds=30):
        if not cred.refresh_token:
            raise HTTPException(status_code=401, detail="Google connection expired — please reconnect.")
        token_data = await google_client.refresh_access_token(decrypt(cred.refresh_token))
        cred.access_token = encrypt(token_data["access_token"])
        cred.expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))
        await db.commit()
        await db.refresh(cred)
    return decrypt(cred.access_token)


# ─── Status ───────────────────────────────────────────────────────────────────

@router.get("/status", response_model=IntegrationStatusResponse)
async def get_status(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    statuses = []
    configured = {"notion": notion_client.is_configured(), "google": google_client.is_configured()}
    for provider in PROVIDERS:
        cred = await _get_credential(db, current_user["id"], provider)
        statuses.append(
            IntegrationStatus(
                provider=provider,
                configured=configured[provider],
                connected=cred is not None,
                account_label=cred.account_label if cred else None,
                notion_parent_page_id=cred.notion_parent_page_id if cred and provider == "notion" else None,
                updated_at=cred.updated_at.isoformat() if cred else None,
            )
        )
    return IntegrationStatusResponse(integrations=statuses)


# ─── Connect / callback / disconnect ────────────────────────────────────────

@router.get("/{provider}/connect", response_model=ConnectUrlResponse)
async def connect(
    provider: str,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    if provider not in PROVIDERS:
        raise HTTPException(status_code=404, detail="Unknown provider.")
    state = create_oauth_state(current_user["id"], provider)
    try:
        if provider == "notion":
            url = notion_client.get_authorize_url(state)
        else:
            url = google_client.get_authorize_url(state)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc))
    return ConnectUrlResponse(authorize_url=url)


@router.get("/{provider}/callback")
async def callback(
    provider: str,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    code: str | None = Query(None),
    state: str | None = Query(None),
    error: str | None = Query(None),
):
    if provider not in PROVIDERS:
        raise HTTPException(status_code=404, detail="Unknown provider.")
    if error or not code or not state:
        return RedirectResponse(f"{_frontend_url()}/settings?integration={provider}&status=error")

    try:
        user_id = verify_oauth_state(state, provider)
    except (pyjwt.PyJWTError, ValueError):
        return RedirectResponse(f"{_frontend_url()}/settings?integration={provider}&status=error")

    try:
        if provider == "notion":
            token_data = await notion_client.exchange_code_for_token(code)
            access_token = token_data["access_token"]
            workspace_name = token_data.get("workspace_name") or "Notion workspace"
            refresh_token = None
            expires_at = None
        else:
            token_data = await google_client.exchange_code_for_token(code)
            access_token = token_data["access_token"]
            refresh_token = token_data.get("refresh_token")
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))
            workspace_name = await google_client.get_account_email(access_token) or "Google account"
    except Exception:
        logger.exception("OAuth token exchange failed for provider=%s", provider)
        return RedirectResponse(f"{_frontend_url()}/settings?integration={provider}&status=error")

    cred = await _get_credential(db, user_id, provider)
    if cred is None:
        cred = IntegrationCredential(user_id=user_id, provider=provider)
        db.add(cred)
    cred.access_token = encrypt(access_token)
    cred.refresh_token = encrypt(refresh_token) if refresh_token else cred.refresh_token
    cred.expires_at = expires_at
    cred.account_label = workspace_name
    cred.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return RedirectResponse(f"{_frontend_url()}/settings?integration={provider}&status=connected")


@router.delete("/{provider}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect(
    provider: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    if provider not in PROVIDERS:
        raise HTTPException(status_code=404, detail="Unknown provider.")
    cred = await _get_credential(db, current_user["id"], provider)
    if cred is not None:
        await db.delete(cred)
        await db.commit()


# ─── Notion actions ───────────────────────────────────────────────────────────

@router.put("/notion/settings", response_model=IntegrationStatus)
async def update_notion_settings(
    body: NotionSettingsUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    cred = await _get_credential(db, current_user["id"], "notion")
    if cred is None:
        raise HTTPException(status_code=400, detail="Connect Notion first.")
    cred.notion_parent_page_id = _normalize_notion_page_id(body.notion_parent_page_id)
    cred.notion_database_id = None  # force re-create under the new parent on next sync
    cred.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return IntegrationStatus(
        provider="notion",
        configured=notion_client.is_configured(),
        connected=True,
        account_label=cred.account_label,
        notion_parent_page_id=cred.notion_parent_page_id,
        updated_at=cred.updated_at.isoformat(),
    )


@router.post("/notion/sync-pipeline", response_model=NotionSyncResult)
async def sync_pipeline_to_notion(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    cred = await _get_credential(db, current_user["id"], "notion")
    if cred is None:
        raise HTTPException(status_code=400, detail="Connect Notion in Settings first.")
    if not cred.notion_parent_page_id:
        raise HTTPException(
            status_code=400,
            detail="Set a Notion parent page in Settings first (a page you've shared with the Pitchmate connection).",
        )

    access_token = decrypt(cred.access_token)

    if not cred.notion_database_id:
        try:
            db_obj = await notion_client.create_pipeline_database(access_token, cred.notion_parent_page_id)
        except Exception as exc:
            logger.error("Notion database creation failed: %s", exc, exc_info=True)
            raise HTTPException(status_code=502, detail=f"Could not create the Notion database: {exc}")
        cred.notion_database_id = db_obj["id"]
        await db.commit()

    investors = list(
        await db.scalars(select(InvestorContact).where(InvestorContact.team_id == current_user["team_id"]))
    )
    try:
        created, updated = await notion_client.sync_investors(
            access_token, cred.notion_database_id, investors, STAGE_LABELS
        )
    except Exception as exc:
        logger.error("Notion sync failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Notion sync failed: {exc}")

    return NotionSyncResult(
        created=created,
        updated=updated,
        database_id=cred.notion_database_id,
        database_url=f"https://notion.so/{cred.notion_database_id.replace('-', '')}",
    )


# ─── Google actions ───────────────────────────────────────────────────────────

@router.post("/google/schedule-followup", response_model=ScheduleFollowupResult)
async def schedule_followup(
    body: ScheduleFollowupRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    cred = await _get_credential(db, current_user["id"], "google")
    if cred is None:
        raise HTTPException(status_code=400, detail="Connect Google in Settings first.")

    investor = await db.scalar(
        select(InvestorContact).where(
            InvestorContact.team_id == current_user["team_id"], InvestorContact.id == body.investor_id
        )
    )
    if investor is None:
        raise HTTPException(status_code=404, detail="Investor not found.")

    access_token = await _valid_google_access_token(db, cred)
    try:
        # JS `Date.toISOString()` emits a trailing "Z"; normalize for `fromisoformat`
        # so this parses regardless of Python 3.10 vs 3.11+ ISO-8601 support.
        start_dt = datetime.fromisoformat(body.when.replace("Z", "+00:00"))
        end_dt = start_dt + timedelta(minutes=body.duration_minutes)
        event = await google_client.create_calendar_event(
            access_token,
            summary=f"Follow up: {investor.name}",
            description=body.notes or investor.next_action or investor.notes or "",
            start_iso=start_dt.isoformat(),
            end_iso=end_dt.isoformat(),
        )
    except Exception as exc:
        logger.error("Calendar event creation failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Could not create the calendar event: {exc}")

    investor.next_action_date = start_dt
    await db.commit()

    return ScheduleFollowupResult(event_id=event["id"], html_link=event.get("htmlLink"))


@router.get("/google/drive/files", response_model=DriveFilesResponse)
async def drive_files(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    q: str | None = Query(None),
):
    cred = await _get_credential(db, current_user["id"], "google")
    if cred is None:
        raise HTTPException(status_code=400, detail="Connect Google in Settings first.")
    access_token = await _valid_google_access_token(db, cred)
    try:
        raw_files = await google_client.list_drive_files(access_token, q)
    except Exception as exc:
        logger.error("Drive file listing failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Could not list Drive files: {exc}")
    return DriveFilesResponse(
        files=[
            DriveFile(
                id=f["id"], name=f["name"], mime_type=f.get("mimeType"), web_view_link=f.get("webViewLink")
            )
            for f in raw_files
        ]
    )
