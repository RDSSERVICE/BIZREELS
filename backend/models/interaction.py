"""Interaction (like / save) between user and listing."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Literal
from pydantic import Field
from .base import BaseDocument, PyObjectId

InteractionType = Literal["like", "save"]


class Interaction(BaseDocument):
    user_id: PyObjectId
    listing_id: PyObjectId
    type: InteractionType
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
