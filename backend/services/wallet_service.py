"""Wallet + credit/balance + transactions service."""
from __future__ import annotations
from datetime import datetime, timezone
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
    res = await db.wallets.find_one_and_update(
        {"user_id": user_id},
        {"$inc": {"balance_inr_paise": paise, "lifetime_deposited_paise": paise}, "$set": {"updated_at": _now()}},
        return_document=True,
    )
    await _record(user_id, res["_id"], "deposit", "balance_inr", paise, res["balance_inr_paise"], reason, "razorpay", payment_id, {"razorpay_payment_id": razorpay_payment_id})
    return _s(res)


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
