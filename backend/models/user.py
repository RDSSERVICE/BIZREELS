"""User model."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Literal
from pydantic import Field
from .base import BaseDocument

Role = Literal["customer", "vendor", "creator", "admin"]
KycStatus = Literal["unverified", "pending", "approved", "rejected"]


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
    # Phase 6c: flags data created by automated tests / seed harnesses so that
    # public queries (feed, leaderboard, search) can trivially exclude it.
    is_test_data: bool = False
    # Phase 4a additions (all safe defaults for pre-existing docs)
    is_subscribed_verified: bool = False
    rating_avg: float = 0.0
    rating_count: int = 0
    trust_score: int | None = None
    city: str | None = None
    # Phase 4b additions
    is_banned: bool = False
    has_received_first_topup_bonus: bool = False
    fcm_tokens: list[dict] = Field(default_factory=list)  # [{token, platform, added_at}]
    # Phase 5 additions
    referral_code: str | None = None
    avg_response_time_seconds: int | None = None
    chat_response_rate: float = 0.0  # 0..1 (fraction responded within 24h)
    total_conversations_responded: int = 0
    has_received_profile_complete_bonus: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
