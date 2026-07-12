"""Listing Boost service — pay with credits or INR, feed weighting, auto-expiry."""
from __future__ import annotations
import logging
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import HTTPException

from database import get_db
from services import wallet_service, phase4_service

logger = logging.getLogger(__name__)

# Cost table
BOOST_PLANS = {
    3:  {"credits": 300,  "paise": 9900},   # ₹99
    7:  {"credits": 600,  "paise": 19900},  # ₹199
    14: {"credits": 1000, "paise": 34900},  # ₹349
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _validate_plan(duration_days: int) -> dict:
    plan = BOOST_PLANS.get(int(duration_days))
    if not plan:
        raise HTTPException(400, f"Invalid duration_days. Allowed: {list(BOOST_PLANS)}")
    return plan


async def _get_owned_listing(listing_id: str, vendor_id: str) -> dict:
    db = get_db()
    if not ObjectId.is_valid(listing_id):
        raise HTTPException(400, "Invalid listing id")
    listing = await db.listings.find_one({"_id": ObjectId(listing_id), "is_deleted": {"$ne": True}})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if str(listing.get("vendor_id")) != vendor_id:
        raise HTTPException(403, "Only the listing owner can boost")
    if listing.get("is_takendown"):
        raise HTTPException(403, "Listing is under admin review")
    return listing


async def _apply_boost(listing_id: str, duration_days: int) -> dict:
    """Set boost_expires_at on the listing. Extends if already boosted."""
    db = get_db()
    now = datetime.now(timezone.utc)
    listing = await db.listings.find_one({"_id": ObjectId(listing_id)})
    current_expiry_str = listing.get("boost_expires_at")
    base_from = now
    if current_expiry_str:
        try:
            current_expiry = datetime.fromisoformat(str(current_expiry_str).replace("Z", "+00:00"))
            if current_expiry > now:
                base_from = current_expiry
        except Exception:  # noqa: BLE001
            pass
    new_expiry = base_from + timedelta(days=duration_days)
    await db.listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": {
            "boost_expires_at": new_expiry.isoformat(),
            "boost_duration_days": int(duration_days),
            "boost_activated_at": _now_iso(),
            "updated_at": _now_iso(),
        }},
    )
    updated = await db.listings.find_one({"_id": ObjectId(listing_id)})
    return {
        "listing_id": listing_id,
        "boost_expires_at": updated["boost_expires_at"],
        "boost_duration_days": updated["boost_duration_days"],
        "active": True,
    }


async def boost_with_credits(vendor_id: str, listing_id: str, duration_days: int) -> dict:
    plan = _validate_plan(duration_days)
    listing = await _get_owned_listing(listing_id, vendor_id)
    await wallet_service.spend_credits(
        vendor_id, plan["credits"],
        f"Boost listing {duration_days}d", "boost_listing", listing_id,
    )
    boost = await _apply_boost(listing_id, duration_days)
    # Notify vendor of activation
    from services import notification_service
    await notification_service.create(
        user_id=vendor_id, type_="boost",
        title="Listing boosted!",
        body=f"'{listing.get('title')}' is boosted for {duration_days} days.",
        action_url=f"/listing/{listing.get('slug')}",
    )
    return {"listing_id": listing_id, "boost": boost, "payment_method": "credits"}


async def boost_with_inr(vendor_id: str, listing_id: str, duration_days: int) -> dict:
    """Create a payment order. On simulate-success (or webhook), boost is activated."""
    plan = _validate_plan(duration_days)
    listing = await _get_owned_listing(listing_id, vendor_id)
    order = await phase4_service.create_payment_order(
        user_id=vendor_id,
        purpose="listing_boost",
        amount_paise=plan["paise"],
        ref_id=f"{listing_id}:{duration_days}",
    )
    return {
        "listing_id": listing_id,
        "payment": order,
        "payment_method": "inr",
        "duration_days": duration_days,
    }


async def activate_boost_from_payment(payment: dict) -> dict | None:
    """Called after successful payment for a listing_boost purpose."""
    ref = payment.get("ref_id") or ""
    if ":" not in ref:
        return None
    listing_id, dur = ref.split(":", 1)
    try:
        duration_days = int(dur)
    except ValueError:
        return None
    if not ObjectId.is_valid(listing_id):
        return None
    boost = await _apply_boost(listing_id, duration_days)
    from services import notification_service
    await notification_service.create(
        user_id=str(payment["user_id"]), type_="boost",
        title="Boost activated",
        body=f"Your listing is now boosted for {duration_days} days.",
        action_url="/vendor/dashboard",
    )
    return boost


async def list_my_boosted(vendor_id: str) -> list[dict]:
    db = get_db()
    now_iso = _now_iso()
    docs = await db.listings.find({
        "vendor_id": vendor_id, "is_deleted": {"$ne": True},
        "boost_expires_at": {"$gt": now_iso},
    }).sort([("boost_expires_at", 1)]).to_list(50)
    from services.listing_service import _serialize as _ls
    return [_ls(d) for d in docs]


async def expire_boosts_once() -> int:
    """Sweep expired boosts. Clear boost_expires_at & boost_duration_days when past."""
    db = get_db()
    now_iso = _now_iso()
    res = await db.listings.update_many(
        {"boost_expires_at": {"$lte": now_iso, "$ne": None}},
        {"$set": {"boost_expires_at": None, "boost_duration_days": None, "updated_at": now_iso}},
    )
    return res.modified_count


async def expire_boosts_loop(interval_seconds: int = 900) -> None:
    """Every 15 min: clear expired boosts."""
    import asyncio
    while True:
        try:
            n = await expire_boosts_once()
            if n:
                logger.info("Expired %d boost(s)", n)
        except Exception as e:  # noqa: BLE001
            logger.warning("boost expire loop err: %s", e)
        await asyncio.sleep(interval_seconds)
