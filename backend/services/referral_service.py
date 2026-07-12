"""Referral system — codes, claim on signup, reward on qualifying action."""
from __future__ import annotations
import logging
import secrets
import string
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from database import get_db

logger = logging.getLogger(__name__)

REFERRER_REWARD = 200      # credits
REFERRED_REWARD = 100      # credits (in addition to signup +50)
CODE_LEN = 6
CODE_ALPHABET = string.ascii_uppercase + string.digits  # e.g., AB12CD


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _new_unique_code(db) -> str:
    for _ in range(10):
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LEN))
        if not await db.users.find_one({"referral_code": code}, {"_id": 1}):
            return code
    # fallback: extend length
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LEN + 2))


async def ensure_code(user_id: str) -> str:
    db = get_db()
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user id")
    u = await db.users.find_one({"_id": ObjectId(user_id)}, {"referral_code": 1})
    if not u:
        raise HTTPException(404, "User not found")
    if u.get("referral_code"):
        return u["referral_code"]
    code = await _new_unique_code(db)
    await db.users.update_one(
        {"_id": ObjectId(user_id), "referral_code": {"$exists": False}},
        {"$set": {"referral_code": code, "updated_at": _now_iso()}},
    )
    fresh = await db.users.find_one({"_id": ObjectId(user_id)}, {"referral_code": 1})
    return fresh.get("referral_code", code)


async def claim_on_signup(new_user_id: str, code: str) -> dict | None:
    """Create a pending referral row. No credit yet — awarded on qualifying action."""
    if not code:
        return None
    db = get_db()
    code = code.strip().upper()
    if len(code) < 4 or len(code) > 16:
        return None
    referrer = await db.users.find_one({"referral_code": code, "is_deleted": {"$ne": True}})
    if not referrer:
        return None
    if str(referrer["_id"]) == new_user_id:
        return None
    # Idempotency: one referral per referred user
    existing = await db.referrals.find_one({"referred_user_id": new_user_id})
    if existing:
        return None
    doc = {
        "referrer_id": str(referrer["_id"]),
        "referred_user_id": new_user_id,
        "code_used": code,
        "status": "pending",
        "referrer_reward": REFERRER_REWARD,
        "referred_reward": REFERRED_REWARD,
        "created_at": _now_iso(),
        "credited_at": None,
    }
    await db.referrals.insert_one(doc)
    return doc


async def _award_pending(referred_user_id: str, event: str) -> None:
    """Credit both users if pending referral exists for referred_user_id."""
    db = get_db()
    ref = await db.referrals.find_one({"referred_user_id": referred_user_id, "status": "pending"})
    if not ref:
        return
    try:
        from services import wallet_service, notification_service
        await wallet_service.earn_credits(
            ref["referrer_id"], ref["referrer_reward"],
            "Referral reward", "referral", ref["referred_user_id"],
        )
        await wallet_service.earn_credits(
            ref["referred_user_id"], ref["referred_reward"],
            "Referral bonus", "referral", ref["referrer_id"],
        )
        await db.referrals.update_one(
            {"_id": ref["_id"]},
            {"$set": {"status": "credited", "credited_at": _now_iso(),
                      "trigger_event": event}},
        )
        # Notify both
        await notification_service.create(
            user_id=ref["referrer_id"], type_="reward",
            title=f"+{ref['referrer_reward']} referral credits!",
            body="A friend you referred just joined the action.",
            action_url="/wallet",
        )
        await notification_service.create(
            user_id=ref["referred_user_id"], type_="reward",
            title=f"+{ref['referred_reward']} bonus credits!",
            body="Referral bonus unlocked.",
            action_url="/wallet",
        )
    except Exception:  # noqa: BLE001
        logger.exception("referral award failed")


async def maybe_award_on_listing(vendor_id: str) -> None:
    """Called when a user creates their first listing."""
    db = get_db()
    # Ensure this is truly the first (non-deleted) listing
    count = await db.listings.count_documents({"vendor_id": vendor_id, "is_deleted": {"$ne": True}})
    if count == 1:
        await _award_pending(vendor_id, "first_listing")


async def maybe_award_on_deal_complete(user_id: str) -> None:
    """Called when a user has their first completed deal (as buyer or seller)."""
    db = get_db()
    completed = await db.deals.count_documents({
        "$or": [{"buyer_id": user_id}, {"seller_id": user_id}], "status": "completed",
    })
    if completed == 1:
        await _award_pending(user_id, "first_deal_complete")


async def list_my_referrals(user_id: str) -> dict:
    db = get_db()
    docs = await db.referrals.find({"referrer_id": user_id}).sort([("_id", -1)]).limit(100).to_list(100)
    # Fetch referred user names
    ids = [ObjectId(d["referred_user_id"]) for d in docs if ObjectId.is_valid(d["referred_user_id"])]
    users = await db.users.find({"_id": {"$in": ids}}, {"name": 1, "phone": 1}).to_list(len(ids)) if ids else []
    umap = {str(u["_id"]): u for u in users}
    items = []
    for d in docs:
        u = umap.get(d["referred_user_id"], {})
        items.append({
            "id": str(d["_id"]),
            "referred_user_id": d["referred_user_id"],
            "referred_name": u.get("name"),
            "referred_phone_masked": (u.get("phone") or "")[:2] + "****" + (u.get("phone") or "")[-2:] if u.get("phone") else None,
            "code_used": d["code_used"],
            "status": d["status"],
            "referrer_reward": d["referrer_reward"],
            "referred_reward": d["referred_reward"],
            "created_at": d["created_at"],
            "credited_at": d.get("credited_at"),
        })
    credited = sum(1 for x in items if x["status"] == "credited")
    pending = sum(1 for x in items if x["status"] == "pending")
    earned = sum(x["referrer_reward"] for x in items if x["status"] == "credited")
    return {
        "items": items,
        "summary": {"total": len(items), "credited": credited, "pending": pending, "credits_earned": earned},
    }
