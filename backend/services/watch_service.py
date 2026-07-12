"""Anonymous listing watchers (lead capture)."""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from database import get_db

INDIA_PHONE_RX = "6789"


def _validate_phone(phone: str) -> str:
    p = (phone or "").strip()
    if not p.isdigit() or len(p) != 10 or p[0] not in INDIA_PHONE_RX:
        raise HTTPException(400, "Invalid Indian phone number")
    return p


async def add_watcher(listing_id: str, phone: str) -> dict:
    if not ObjectId.is_valid(listing_id):
        raise HTTPException(400, "Invalid listing id")
    phone = _validate_phone(phone)
    db = get_db()
    listing = await db.listings.find_one({"_id": ObjectId(listing_id), "is_deleted": {"$ne": True}})
    if not listing:
        raise HTTPException(404, "Listing not found")
    now = datetime.now(timezone.utc).isoformat()
    # Dedup by phone
    existing_phones = {w.get("phone") for w in (listing.get("watchers") or [])}
    if phone not in existing_phones:
        await db.listings.update_one(
            {"_id": ObjectId(listing_id)},
            {"$push": {"watchers": {"phone": phone, "added_at": now}}},
        )
    doc = await db.listings.find_one({"_id": ObjectId(listing_id)}, {"watchers": 1})
    return {"ok": True, "count": len(doc.get("watchers") or [])}
