"""Category model (hierarchical)."""
from __future__ import annotations
from datetime import datetime, timezone
from pydantic import Field
from .base import BaseDocument, PyObjectId


class Category(BaseDocument):
    name: str
    slug: str
    icon_url: str | None = None  # emoji or URL
    parent_id: PyObjectId | None = None
    sort_order: int = 0
    is_active: bool = True
    is_deleted: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
