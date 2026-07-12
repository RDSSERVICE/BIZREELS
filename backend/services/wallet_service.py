"""Wallet + credit/balance + transactions service."""
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import HTTPException

from database import get_db

CREDIT_RULES = {
    "signup": 50,
    "first_listing": 100,
    "deal_completed": 25,
    "verified_purchase_review": 10,
    "referral": 200,
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def get_or_create(user_id: str) -> dict:
    db = get_db()
    w = await db.wallets.find_one({"user_id": user_id})
    if w:
        return _s(w)
    doc = {
        "user_id": user_id, "credits": 0, "balance_inr_paise": 0,
        "lifetime_earned_credits": 0, "lifetime_spent_credits": 0,
        "lifetime_deposited_paise": 0, "lifetime_spent_paise": 0,
        "is_frozen": False, "created_at": _now(), "updated_at": _now(),
    }
    res = await db.wallets.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _s(doc)


def _s(d: dict) -> dict:
    out = dict(d)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    return out


async def _record(user_id: str, wallet_id, ttype: str, bucket: str, amount: int, balance_after: int, reason: str, ref_type: str | None = None, ref_id: str | None = None, extra: dict | None = None) -> None:
    db = get_db()
    doc = {
        "wallet_id": str(wallet_id), "user_id": user_id,
        "type": ttype, "bucket": bucket, "amount": int(amount),
        "balance_after": int(balance_after),
        "reason": reason, "ref_type": ref_type, "ref_id": ref_id,
        "status": "success", "created_at": _now(),
        **(extra or {}),
    }
    await db.wallet_transactions.insert_one(doc)


async def earn_credits(user_id: str, amount: int, reason: str, ref_type: str = None, ref_id: str = None) -> dict:
    if amount <= 0:
        return {}
    db = get_db()
    await get_or_create(user_id)
    res = await db.wallets.find_one_and_update(
        {"user_id": user_id},
        {"$inc": {"credits": amount, "lifetime_earned_credits": amount}, "$set": {"updated_at": _now()}},
        return_document=True,
    )
    await _record(user_id, res["_id"], "credit_earn", "credits", amount, res["credits"], reason, ref_type, ref_id)
    return _s(res)


async def spend_credits(user_id: str, amount: int, reason: str, ref_type: str = None, ref_id: str = None) -> dict:
    db = get_db()
    w = await db.wallets.find_one({"user_id": user_id})
    if not w or w.get("credits", 0) < amount:
        raise HTTPException(400, "Insufficient credits")
    res = await db.wallets.find_one_and_update(
        {"user_id": user_id, "credits": {"$gte": amount}},
        {"$inc": {"credits": -amount, "lifetime_spent_credits": amount}, "$set": {"updated_at": _now()}},
        return_document=True,
    )
    await _record(user_id, res["_id"], "credit_spend", "credits", amount, res["credits"], reason, ref_type, ref_id)
    return _s(res)


async def deposit_inr(user_id: str, paise: int, reason: str, payment_id: str | None = None, razorpay_payment_id: str | None = None) -> dict:
    db = get_db()
    await get_or_create(user_id)
    # Frozen wallets cannot accept credits
    w_curr = await db.wallets.find_one({"user_id": user_id})
    if w_curr and w_curr.get("is_frozen"):
        raise HTTPException(403, "Wallet is frozen")
    res = await db.wallets.find_one_and_update(
        {"user_id": user_id},
        {"$inc": {"balance_inr_paise": paise, "lifetime_deposited_paise": paise}, "$set": {"updated_at": _now()}},
        return_document=True,
    )
    await _record(user_id, res["_id"], "deposit", "balance_inr", paise, res["balance_inr_paise"], reason, "razorpay", payment_id, {"razorpay_payment_id": razorpay_payment_id})
    # Phase 4b: first-topup bonus (+50 credits) if within 24h of signup and ≥ ₹200 and not yet granted
    try:
        await _maybe_first_topup_bonus(user_id, paise)
    except Exception:  # noqa: BLE001
        pass
    return _s(res)


FIRST_TOPUP_BONUS_CREDITS = 50
FIRST_TOPUP_MIN_PAISE = 20000  # ₹200
FIRST_TOPUP_WINDOW_HOURS = 24


async def _maybe_first_topup_bonus(user_id: str, paise: int) -> None:
    if paise < FIRST_TOPUP_MIN_PAISE:
        return
    db = get_db()
    u = await db.users.find_one({"_id": ObjectId(user_id)}, {"created_at": 1, "has_received_first_topup_bonus": 1})
    if not u or u.get("has_received_first_topup_bonus"):
        return
    try:
        created = datetime.fromisoformat(str(u.get("created_at", "")).replace("Z", "+00:00"))
        if (datetime.now(timezone.utc) - created) > timedelta(hours=FIRST_TOPUP_WINDOW_HOURS):
            return
    except Exception:  # noqa: BLE001
        return
    # Mark first so no double-grant on races
    marker = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id), "has_received_first_topup_bonus": {"$ne": True}},
        {"$set": {"has_received_first_topup_bonus": True, "updated_at": _now()}},
    )
    if not marker:
        return
    await earn_credits(user_id, FIRST_TOPUP_BONUS_CREDITS,
                       "First topup bonus", "first_topup_bonus", user_id)
    try:
        from services import notification_service
        await notification_service.create(
            user_id=user_id, type_="reward",
            title=f"+{FIRST_TOPUP_BONUS_CREDITS} bonus credits!",
            body="Welcome bonus for your first ₹200+ topup.",
            action_url="/wallet",
        )
    except Exception:  # noqa: BLE001
        pass


async def purchase_inr(user_id: str, paise: int, reason: str, ref_type: str, ref_id: str, payment_id: str | None = None) -> dict:
    """Direct spend from balance (not via topup). If insufficient, raises."""
    db = get_db()
    w = await db.wallets.find_one({"user_id": user_id})
    if not w or w.get("balance_inr_paise", 0) < paise:
        raise HTTPException(400, "Insufficient balance")
    res = await db.wallets.find_one_and_update(
        {"user_id": user_id, "balance_inr_paise": {"$gte": paise}},
        {"$inc": {"balance_inr_paise": -paise, "lifetime_spent_paise": paise}, "$set": {"updated_at": _now()}},
        return_document=True,
    )
    await _record(user_id, res["_id"], "purchase", "balance_inr", paise, res["balance_inr_paise"], reason, ref_type, ref_id, {"payment_id": payment_id})
    return _s(res)


async def list_transactions(user_id: str, limit: int = 50) -> list[dict]:
    db = get_db()
    docs = await db.wallet_transactions.find({"user_id": user_id}).sort([("_id", -1)]).limit(limit).to_list(limit)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


async def backfill_all() -> None:
    """Ensure every existing user has a wallet — run on startup."""
    db = get_db()
    users = db.users.find({"is_deleted": {"$ne": True}}, {"_id": 1})
    async for u in users:
        exists = await db.wallets.find_one({"user_id": str(u["_id"])})
        if not exists:
            await get_or_create(str(u["_id"]))
