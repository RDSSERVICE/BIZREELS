"""Listing events — time-series analytics log.

Emitted by user actions (view, chat_start, deal_start, deal_complete, save, share, watch, wa_click).
Kept minimal + fire-and-forget from service call-sites.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from bson import ObjectId
from database import get_db

logger = logging.getLogger(__name__)

VALID_EVENTS = {
    "view", "chat_start", "deal_start", "deal_complete",
    "save", "share", "watch", "wa_click",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def emit(
    *,
    listing_id: str,
    vendor_id: str | None,
    event_type: str,
    user_id: str | None = None,
    meta: dict | None = None,
) -> None:
    """Fire-and-forget event log. Never throws."""
    if event_type not in VALID_EVENTS:
        return
    if not listing_id or not ObjectId.is_valid(listing_id):
        return
    try:
        db = get_db()
        # Resolve vendor_id if not provided
        v_id = vendor_id
        if not v_id:
            li = await db.listings.find_one({"_id": ObjectId(listing_id)}, {"vendor_id": 1})
            v_id = str(li["vendor_id"]) if li and li.get("vendor_id") else None
        if not v_id:
            return
        await db.listing_events.insert_one({
            "listing_id": str(listing_id),
            "vendor_id": v_id,
            "event_type": event_type,
            "user_id": user_id,
            "meta": meta or {},
            "created_at": _now_iso(),
        })
    except Exception as e:  # noqa: BLE001
        logger.debug("event emit err (non-fatal): %s", e)
