"""Boost & Bump nudge — daily background job."""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from database import get_db
from services import notification_service

logger = logging.getLogger(__name__)

NUDGE_MIN_AGE_DAYS = 30
NUDGE_MAX_VIEWS_30D = 100
NUDGE_COOLDOWN_DAYS = 7


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def nudge_once() -> int:
    """Scan eligible listings and create boost_nudge notifications for owners.
    Returns number of nudges emitted.
    """
    db = get_db()
    now = _now()
    age_cutoff = (now - timedelta(days=NUDGE_MIN_AGE_DAYS)).isoformat()
    cooldown_cutoff = (now - timedelta(days=NUDGE_COOLDOWN_DAYS)).isoformat()
    views_cutoff = (now - timedelta(days=30)).isoformat()

    # Candidates: active, not takendown, not currently boosted, created >30d ago,
    # last nudge either never or > cooldown
    candidates = db.listings.find({
        "is_deleted": {"$ne": True},
        "is_takendown": {"$ne": True},
        "status": "active",
        "created_at": {"$lt": age_cutoff},
        "$and": [
            {"$or": [{"boost_expires_at": None}, {"boost_expires_at": {"$lt": now.isoformat()}}]},
            {"$or": [
                {"last_boost_nudge_at": None},
                {"last_boost_nudge_at": {"$exists": False}},
                {"last_boost_nudge_at": {"$lt": cooldown_cutoff}},
            ]},
        ],
    }).limit(500)

    sent = 0
    async for li in candidates:
        listing_id = str(li["_id"])
        # Views in last 30d
        views_30d = await db.listing_events.count_documents({
            "listing_id": listing_id, "event_type": "view",
            "created_at": {"$gte": views_cutoff},
        })
        if views_30d >= NUDGE_MAX_VIEWS_30D:
            continue
        vendor_id = str(li.get("vendor_id"))
        if not vendor_id:
            continue
        title = li.get("title") or "Your listing"
        try:
            await notification_service.create(
                user_id=vendor_id, type_="boost_nudge",
                title=f"Give '{title[:40]}' a boost",
                body=f"Only {views_30d} views in the last 30 days — a 3-day boost may 12× visibility.",
                action_url=f"/listing/{li.get('slug', listing_id)}?open_boost=1",
                data={"listing_id": listing_id, "views_30d": views_30d},
            )
            await db.listings.update_one(
                {"_id": li["_id"]},
                {"$set": {"last_boost_nudge_at": _now().isoformat()}},
            )
            sent += 1
        except Exception:  # noqa: BLE001
            logger.exception("nudge emit failed for %s", listing_id)
    if sent:
        logger.info("Boost & Bump nudge: emitted %d nudges", sent)
    return sent


async def nudge_loop(interval_seconds: int = 24 * 3600) -> None:
    # Run once at boot after a short delay, then daily
    await asyncio.sleep(30)
    while True:
        try:
            await nudge_once()
        except Exception as e:  # noqa: BLE001
            logger.warning("nudge_loop err: %s", e)
        await asyncio.sleep(interval_seconds)
