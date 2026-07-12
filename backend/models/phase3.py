"""Requirement + Proposal + Chat + Deal models."""
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from typing import Literal, Any
from pydantic import BaseModel, Field
from .base import BaseDocument, PyObjectId

# ---- Requirements ----
Urgency = Literal["immediate", "this_week", "this_month", "flexible"]
ReqStatus = Literal["open", "closed", "expired"]


class ReqLocation(BaseModel):
    lat: float | None = None
    lng: float | None = None
    area: str
    city: str
    state: str | None = None
    pincode: str
    geo: dict | None = None


class ReqMedia(BaseModel):
    url: str
    public_id: str


class Requirement(BaseDocument):
    customer_id: PyObjectId
    title: str
    description: str | None = None
    category_id: PyObjectId
    sub_category_id: PyObjectId | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    photos: list[ReqMedia] = Field(default_factory=list)
    video: ReqMedia | None = None
    location: ReqLocation
    urgency: Urgency = "flexible"
    is_negotiable: bool = True
    expires_at: str = Field(
        default_factory=lambda: (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    )
    status: ReqStatus = "open"
    proposals_count: int = 0
    views_count: int = 0
    is_active: bool = True
    is_deleted: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---- Proposals ----
ProposalStatus = Literal["sent", "shortlisted", "rejected", "accepted"]


class Proposal(BaseDocument):
    requirement_id: PyObjectId
    vendor_id: PyObjectId
    message: str
    quoted_price: float | None = None
    attachments: list[dict] = Field(default_factory=list)
    status: ProposalStatus = "sent"
    is_deleted: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---- Chat: threads + messages ----
ThreadType = Literal["listing", "requirement", "direct"]
MsgType = Literal["text", "image", "video", "listing_card", "location", "quote", "system"]


class ChatThread(BaseDocument):
    participants: list[str]  # exactly 2 user_ids
    thread_type: ThreadType
    context_id: PyObjectId | None = None
    last_message: dict | None = None
    unread_count: dict = Field(default_factory=dict)  # {user_id: int}
    is_archived_by: dict = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ChatMessage(BaseDocument):
    thread_id: PyObjectId
    sender_id: PyObjectId
    receiver_id: PyObjectId
    type: MsgType = "text"
    text: str | None = None
    media: dict | None = None
    shared_listing_id: PyObjectId | None = None
    shared_location: dict | None = None
    quote: dict | None = None
    delivered_at: str | None = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    read_at: str | None = None
    is_deleted: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---- Deals ----
DealStatus = Literal["negotiating", "accepted", "rejected", "expired", "completed", "cancelled"]


class Deal(BaseDocument):
    thread_id: PyObjectId
    listing_id: PyObjectId | None = None
    requirement_id: PyObjectId | None = None
    buyer_id: PyObjectId
    seller_id: PyObjectId
    initial_offer: float
    current_offer: float
    currency: str = "INR"
    offers_history: list[dict] = Field(default_factory=list)
    status: DealStatus = "negotiating"
    expires_at: str = Field(
        default_factory=lambda: (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    )
    completion_pending_from: str | None = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
