"""Report model — user-generated content reports."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Literal
from pydantic import Field
from .base import BaseDocument

ReportTargetType = Literal["listing", "user", "review", "message"]
ReportStatus = Literal["open", "resolved", "dismissed"]
ReportAction = Literal["takedown", "warn", "ban", "none"]


class Report(BaseDocument):
    reporter_id: str
    target_type: ReportTargetType
    target_id: str
    reason: str  # short slug: spam | offensive | scam | wrong_category | other
    description: str | None = None
    status: ReportStatus = "open"
    resolved_by: str | None = None
    resolved_at: str | None = None
    resolution_action: ReportAction | None = None
    resolution_note: str | None = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
