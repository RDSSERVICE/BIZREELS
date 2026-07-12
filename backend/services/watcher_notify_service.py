"""Watcher notification service — fires when a listing has a price drop / back-in-stock.

Handles both registered users (in-app notification) and phone-only watchers (SMS stub).
Dedup: no more than 1 notif per phone per listing per 24h.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from database import get_db
from services import notification_service, msg91_service

logger = logging.getLogger(__name__)

DEDUP_WINDOW_HOURS = 24


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _was_recently_notified(listing_id: str, phone: str) -> bool:
    db = get_db()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=DEDUP_WINDOW_HOURS)).isoformat()
    doc = await db.watcher_notifications.find_one({
        "listing_id": listing_id, "phone": phone, "created_at": {"$gte": cutoff},
    })
    return doc is not None


async def _record_notification(listing_id: str, phone: str, event: str, user_id: str | None) -> None:
    db = get_db()
    await db.watcher_notifications.insert_one({
        "listing_id": listing_id, "phone": phone, "event": event,
        "user_id": user_id, "created_at": _now_iso(),
    })


async def notify_watchers(
    *,
    listing_id: str,
    title: str,
    slug: str | None,
    effective_price: float | None,
    event: str = "price_drop",
) -> dict:
    """Send price-drop or back-in-stock notification to all watchers of a listing."""
    db = get_db()
    if not ObjectId.is_valid(listing_id):
        return {"sent_inapp": 0, "sent_sms": 0}
    listing = await db.listings.find_one({"_id": ObjectId(listing_id)}, {"watchers": 1})
    if not listing:
        return {"sent_inapp": 0, "sent_sms": 0}
    watchers = listing.get("watchers") or []
    sent_inapp = 0
    sent_sms = 0
    action_url = f"/listing/{slug}" if slug else f"/listing/{listing_id}"
    for w in watchers:
        phone = (w.get("phone") or "").strip()
        if not phone:
            continue
        if await _was_recently_notified(listing_id, phone):
            continue

        # Find user by phone
        user = await db.users.find_one({"phone": phone, "is_deleted": {"$ne": True}}, {"_id": 1})
        user_id = str(user["_id"]) if user else None

        if event == "price_drop":
            price_str = f"₹{effective_price:.0f}" if effective_price is not None else "a new price"
            title_txt = f"Price dropped on '{title}'!"
            body_txt = f"Now {price_str}."
        else:
            title_txt = f"'{title}' is back in stock"
            body_txt = "Grab it before it's gone."

        if user_id:
            try:
                await notification_service.create(
                    user_id=user_id, type_="price_drop", title=title_txt,
                    body=body_txt, action_url=action_url,
                    data={"listing_id": listing_id, "event": event},
                )
                sent_inapp += 1
            except Exception:  # noqa: BLE001
                logger.exception("in-app notify failed for user %s", user_id)
        else:
            try:
                # SMS stub — MSG91 send_otp_sms is our current adapter; use generic sms_send helper
                await msg91_service.send_transactional_sms(phone, f"{title_txt} {body_txt}")
                sent_sms += 1
            except Exception:  # noqa: BLE001
                logger.info("[SMS DEV] price-drop watcher notify %s %s: %s %s",
                            listing_id, phone, title_txt, body_txt)
                sent_sms += 1

        await _record_notification(listing_id, phone, event, user_id)

    return {"sent_inapp": sent_inapp, "sent_sms": sent_sms}
