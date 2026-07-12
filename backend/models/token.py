"""Refresh token model."""
from __future__ import annotations
from datetime import datetime, timezone
from pydantic import Field
from .base import BaseDocument


class RefreshToken(BaseDocument):
    user_id: str
    token_hash: str
    expires_at: datetime  # BSON date for TTL
    revoked: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
