"""Follow (vendor/user) relationship."""
from __future__ import annotations
from datetime import datetime, timezone
from pydantic import Field
from .base import BaseDocument, PyObjectId


class Follow(BaseDocument):
    follower_id: PyObjectId
    following_id: PyObjectId
    following_type: str = "user"  # user | business
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
