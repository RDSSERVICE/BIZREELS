"""OTP request model."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Literal
from pydantic import Field
from .base import BaseDocument

OtpPurpose = Literal["login", "signup"]


class OtpRequest(BaseDocument):
    phone: str
    otp_hash: str
    purpose: OtpPurpose = "login"
    attempts: int = 0
    verified: bool = False
    expires_at: datetime  # stored as BSON date so TTL index works
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
