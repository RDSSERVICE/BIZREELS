"""Phase 4a models — reviews, notifications, wallet, payments, subscriptions, kyc."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Literal
from pydantic import Field, BaseModel
from .base import BaseDocument, PyObjectId


class Review(BaseDocument):
    reviewer_id: PyObjectId
    target_type: Literal["vendor", "listing", "service"]
    target_id: PyObjectId
    listing_id: PyObjectId | None = None
    deal_id: PyObjectId | None = None
    rating: int  # 1-5
    comment: str | None = None
    images: list[dict] = Field(default_factory=list)
    videos: list[dict] = Field(default_factory=list)
    is_verified_purchase: bool = False
    helpful_count: int = 0
    reply: dict | None = None
    is_active: bool = True
    is_deleted: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Notification(BaseDocument):
    user_id: PyObjectId
    type: str
    title: str
    body: str | None = None
    data: dict = Field(default_factory=dict)
    action_url: str | None = None
    is_read: bool = False
    read_at: str | None = None
    is_deleted: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Wallet(BaseDocument):
    user_id: PyObjectId
    credits: int = 0
    balance_inr_paise: int = 0
    lifetime_earned_credits: int = 0
    lifetime_spent_credits: int = 0
    lifetime_deposited_paise: int = 0
    lifetime_spent_paise: int = 0
    is_frozen: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class WalletTxn(BaseDocument):
    wallet_id: PyObjectId
    user_id: PyObjectId
    type: str  # credit_earn|credit_spend|deposit|purchase|refund|admin_adjust
    bucket: Literal["credits", "balance_inr"]
    amount: int  # positive
    balance_after: int
    reason: str | None = None
    ref_type: str | None = None
    ref_id: str | None = None
    razorpay_order_id: str | None = None
    razorpay_payment_id: str | None = None
    status: str = "success"
    meta: dict = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Payment(BaseDocument):
    user_id: PyObjectId
    purpose: str  # verified_badge_monthly | verified_badge_yearly | wallet_topup | listing_boost | other
    ref_id: str | None = None
    amount_paise: int
    currency: str = "INR"
    razorpay_order_id: str
    razorpay_payment_id: str | None = None
    razorpay_signature: str | None = None
    status: str = "created"  # created|authorized|captured|failed|refunded
    receipt: str
    notes: dict = Field(default_factory=dict)
    attempts: list[dict] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Subscription(BaseDocument):
    user_id: PyObjectId
    plan: Literal["verified_monthly", "verified_yearly"]
    status: Literal["active", "expired", "cancelled"] = "active"
    started_at: str
    expires_at: str
    auto_renew: bool = False
    payment_id: PyObjectId | None = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class KycDoc(BaseDocument):
    user_id: PyObjectId
    doc_type: Literal["aadhaar", "pan", "driving_license", "passport"]
    doc_number: str
    doc_url: str
    selfie_url: str | None = None
    status: Literal["pending", "approved", "rejected"] = "pending"
    rejection_reason: str | None = None
    reviewed_by: str | None = None
    reviewed_at: str | None = None
    submitted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_deleted: bool = False
