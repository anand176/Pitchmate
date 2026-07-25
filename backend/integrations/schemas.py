"""Pydantic schemas for the integrations (Notion / Google OAuth) endpoints."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class IntegrationStatus(BaseModel):
    provider: str
    configured: bool = Field(..., description="Whether the server has OAuth client credentials set.")
    connected: bool = False
    account_label: Optional[str] = None
    notion_parent_page_id: Optional[str] = None
    updated_at: Optional[str] = None


class IntegrationStatusResponse(BaseModel):
    integrations: list[IntegrationStatus] = Field(default_factory=list)


class ConnectUrlResponse(BaseModel):
    authorize_url: str


class NotionSettingsUpdate(BaseModel):
    notion_parent_page_id: str = Field(
        ..., description="ID (or URL) of a Notion page shared with the Pitchmate connection."
    )


class NotionSyncResult(BaseModel):
    created: int = 0
    updated: int = 0
    database_id: Optional[str] = None
    database_url: Optional[str] = None


class ScheduleFollowupRequest(BaseModel):
    investor_id: str
    when: str = Field(..., description="ISO 8601 datetime for the follow-up meeting.")
    duration_minutes: int = 30
    notes: Optional[str] = None


class ScheduleFollowupResult(BaseModel):
    event_id: str
    html_link: Optional[str] = None


class DriveFile(BaseModel):
    id: str
    name: str
    mime_type: Optional[str] = None
    web_view_link: Optional[str] = None


class DriveFilesResponse(BaseModel):
    files: list[DriveFile] = Field(default_factory=list)
