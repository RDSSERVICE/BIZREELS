"""User model."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Literal
from pydantic import Field
from .base import BaseDocument

Role = Literal["customer", "vendor", "creator", "admin"]
KycStatus = Literal["unverified", "pending", "verified", "rejected"]


class User(BaseDocument):
    phone: str
    name: str | None = None
    email: str | None = None
    roles: list[Role] = Field(default_factory=lambda: ["customer"])
    current_role: Role = "customer"
    kyc_status: KycStatus = "unverified"
    profile_pic: str | None = None
    gender: str | None = None
    dob: str | None = None  # ISO date string
    is_active: bool = True
    is_deleted: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
