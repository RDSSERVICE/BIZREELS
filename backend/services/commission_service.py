"""Commission service — platform earnings on completed deals.

Phase 7f (CHANGE 5). When a deal completes, we accrue a commission record
against the seller. Admin can view / mark_paid / update rate. Rate is
configurable: global default (5%) with optional per-category overrides in
`platform_settings.commission_rules`.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from bson import ObjectId

from database import get_db

logger = logging.getLogger(__name__)

_DEFAULT_RATE = 0.05  # 5% platform commission


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _resolve_rate(category_id: str | None) -> float:
    """Global rate unless a per-category override exists in platform_settings."""
    db = get_db()
    s = await db.platform_settings.find_one({"_id": "singleton"}, {"commission_rules": 1})
    rules = (s or {}).get("commission_rules") or {}
    if category_id and rules.get("per_category", {}).get(category_id) is not None:
        try:
            return float(rules["per_category"][category_id])
        except (TypeError, ValueError):
            pass
    try:
        return float(rules.get("global_rate", _DEFAULT_RATE))
    except (TypeError, ValueError):
        return _DEFAULT_RATE


async def accrue_on_deal_complete(deal: dict) -> dict | None:
    """Insert one accrued commission for the completed deal, idempotent by deal_id."""
    if not deal:
        return None
    db = get_db()
    deal_id = str(deal["_id"])
    if await db.commissions.find_one({"deal_id": deal_id, "is_deleted": {"$ne": True}}):
        return None  # already accrued
    amount = int(deal.get("final_amount") or deal.get("current_offer") or deal.get("asking_price") or 0)
    if amount <= 0:
        return None
    # Look up category for potential per-category rate
    cat_id = None
    lid = deal.get("listing_id")
    if lid and ObjectId.is_valid(str(lid)):
        lst = await db.listings.find_one({"_id": ObjectId(str(lid))}, {"category_id": 1})
        cat_id = str((lst or {}).get("category_id") or "") or None
    rate = await _resolve_rate(cat_id)
    commission_paise = int(round(amount * rate * 100))  # amount is INR; store in paise
    doc = {
        "deal_id": deal_id,
        "vendor_id": str(deal.get("seller_id") or ""),
        "buyer_id": str(deal.get("buyer_id") or ""),
        "listing_id": str(lid) if lid else None,
        "category_id": cat_id,
        "deal_amount_inr": amount,
        "amount_paise": commission_paise,
        "rate": rate,
        "status": "accrued",
        "created_at": _now(),
        "is_deleted": False,
    }
    res = await db.commissions.insert_one(doc)
    doc["_id"] = res.inserted_id
    return doc


def _serialize(c: dict) -> dict:
    if not c:
        return None
    return {
        "id": str(c["_id"]),
        "deal_id": c.get("deal_id"),
        "vendor_id": c.get("vendor_id"),
        "buyer_id": c.get("buyer_id"),
        "listing_id": c.get("listing_id"),
        "category_id": c.get("category_id"),
        "deal_amount_inr": c.get("deal_amount_inr"),
        "amount_paise": c.get("amount_paise"),
        "amount_inr": round((c.get("amount_paise") or 0) / 100, 2),
        "rate": c.get("rate"),
        "status": c.get("status"),
        "created_at": c.get("created_at").isoformat() if c.get("created_at") else None,
        "paid_out_at": c.get("paid_out_at").isoformat() if c.get("paid_out_at") else None,
    }


async def list_commissions(status: str | None = None, vendor_id: str | None = None,
                           limit: int = 50) -> dict:
    db = get_db()
    q: dict = {"is_deleted": {"$ne": True}}
    if status:
        q["status"] = status
    if vendor_id:
        q["vendor_id"] = vendor_id
    docs = await db.commissions.find(q).sort([("_id", -1)]).limit(limit).to_list(limit)
    return {"items": [_serialize(c) for c in docs], "count": len(docs)}


async def summary(period_days: int = 30) -> dict:
    from datetime import timedelta
    db = get_db()
    since = _now() - timedelta(days=period_days)
    pipeline = [
        {"$match": {"is_deleted": {"$ne": True}, "created_at": {"$gte": since}}},
        {"$group": {"_id": "$status", "total": {"$sum": "$amount_paise"}, "count": {"$sum": 1}}},
    ]
    rows = await db.commissions.aggregate(pipeline).to_list(50)
    agg = {r["_id"]: {"total_paise": r["total"], "count": r["count"]} for r in rows}
    total_paise = sum(v["total_paise"] for v in agg.values())
    return {
        "period_days": period_days,
        "total_earned_inr": round(total_paise / 100, 2),
        "by_status": agg,
    }


async def mark_paid(commission_id: str) -> dict:
    if not ObjectId.is_valid(commission_id):
        return None
    db = get_db()
    now = _now()
    await db.commissions.update_one(
        {"_id": ObjectId(commission_id), "is_deleted": {"$ne": True}},
        {"$set": {"status": "paid_out", "paid_out_at": now}},
    )
    doc = await db.commissions.find_one({"_id": ObjectId(commission_id)})
    return _serialize(doc)


async def set_global_rate(rate: float) -> dict:
    """Update platform_settings.commission_rules.global_rate."""
    if not 0 <= rate <= 1:
        raise ValueError("rate must be 0..1")
    db = get_db()
    await db.platform_settings.update_one(
        {"_id": "singleton"},
        {"$set": {"commission_rules.global_rate": rate,
                  "commission_rules.updated_at": _now()}},
        upsert=True,
    )
    return {"global_rate": rate}


async def set_category_rate(category_id: str, rate: float) -> dict:
    if not 0 <= rate <= 1:
        raise ValueError("rate must be 0..1")
    db = get_db()
    await db.platform_settings.update_one(
        {"_id": "singleton"},
        {"$set": {f"commission_rules.per_category.{category_id}": rate,
                  "commission_rules.updated_at": _now()}},
        upsert=True,
    )
    return {"category_id": category_id, "rate": rate}
