"""Deals / negotiation service."""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from database import get_db
from models.phase3 import Deal
from services import chat_service

logger = logging.getLogger(__name__)


def _s(d: dict) -> dict:
    if not d:
        return d
    out = dict(d)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    for k in ("thread_id", "listing_id", "requirement_id", "buyer_id", "seller_id"):
        if out.get(k):
            out[k] = str(out[k])
    return out


async def create_deal(buyer_id: str, body: dict) -> dict:
    db = get_db()
    thread_id = body.get("thread_id")
    listing_id = body.get("listing_id")
    requirement_id = body.get("requirement_id")
    amount = body.get("initial_offer")
    if not thread_id or not ObjectId.is_valid(thread_id):
        raise HTTPException(400, "thread_id required")
    if not amount or amount <= 0:
        raise HTTPException(400, "initial_offer must be > 0")

    thread = await db.chat_threads.find_one({"_id": ObjectId(thread_id)})
    if not thread or buyer_id not in thread.get("participants", []):
        raise HTTPException(404, "Thread not found")
    seller_id = next(p for p in thread["participants"] if p != buyer_id)

    now = datetime.now(timezone.utc).isoformat()
    deal = Deal(
        thread_id=thread_id, listing_id=listing_id, requirement_id=requirement_id,
        buyer_id=buyer_id, seller_id=seller_id,
        initial_offer=float(amount), current_offer=float(amount),
        offers_history=[{"by": buyer_id, "amount": float(amount), "note": body.get("note"), "at": now}],
    )
    doc = deal.to_mongo()
    res = await db.deals.insert_one(doc)
    doc["_id"] = res.inserted_id

    # Also send a quote message in the thread
    await chat_service.send_message(
        thread_id=thread_id, sender_id=buyer_id,
        body={"type": "quote", "text": body.get("note"),
              "quote": {"deal_id": str(res.inserted_id), "amount": float(amount), "note": body.get("note"), "status": "pending"}},
    )
    return _s(doc)


async def _get_owned(deal_id: str, user_id: str, admin: bool = False) -> dict:
    db = get_db()
    if not ObjectId.is_valid(deal_id):
        raise HTTPException(400, "Invalid id")
    d = await db.deals.find_one({"_id": ObjectId(deal_id)})
    if not d:
        raise HTTPException(404, "Deal not found")
    if not admin and user_id not in (d.get("buyer_id"), d.get("seller_id")):
        raise HTTPException(403, "Not a participant")
    return d


async def counter(deal_id: str, user_id: str, amount: float, note: str | None) -> dict:
    db = get_db()
    d = await _get_owned(deal_id, user_id)
    if d.get("status") != "negotiating":
        raise HTTPException(400, "Deal is not negotiating")
    if amount <= 0:
        raise HTTPException(400, "amount must be > 0")
    now = datetime.now(timezone.utc).isoformat()
    hist = d.get("offers_history") or []
    hist.append({"by": user_id, "amount": float(amount), "note": note, "at": now})
    await db.deals.update_one(
        {"_id": ObjectId(deal_id)},
        {"$set": {"current_offer": float(amount), "offers_history": hist, "updated_at": now}},
    )
    await chat_service.send_message(
        thread_id=str(d["thread_id"]), sender_id=user_id,
        body={"type": "quote", "text": note,
              "quote": {"deal_id": deal_id, "amount": float(amount), "note": note, "status": "pending"}},
    )
    updated = await db.deals.find_one({"_id": ObjectId(deal_id)})
    try:
        from services.socket_service import sio, user_room
        peer = d["seller_id"] if user_id == d["buyer_id"] else d["buyer_id"]
        await sio.emit("deal:updated", _s(updated), room=user_room(peer))
    except Exception:  # noqa: BLE001
        pass
    return _s(updated)


async def _set_status(deal_id: str, user_id: str, new_status: str, system_text: str) -> dict:
    db = get_db()
    d = await _get_owned(deal_id, user_id)
    now = datetime.now(timezone.utc).isoformat()
    await db.deals.update_one({"_id": ObjectId(deal_id)}, {"$set": {"status": new_status, "updated_at": now}})
    await chat_service.send_message(
        thread_id=str(d["thread_id"]), sender_id=user_id,
        body={"type": "system", "text": system_text},
    )
    updated = await db.deals.find_one({"_id": ObjectId(deal_id)})
    try:
        from services.socket_service import sio, user_room
        peer = d["seller_id"] if user_id == d["buyer_id"] else d["buyer_id"]
        await sio.emit("deal:updated", _s(updated), room=user_room(peer))
    except Exception:  # noqa: BLE001
        pass
    return _s(updated)


async def accept(deal_id: str, user_id: str) -> dict:
    return await _set_status(deal_id, user_id, "accepted", "Deal accepted 🎉")


async def reject(deal_id: str, user_id: str) -> dict:
    return await _set_status(deal_id, user_id, "rejected", "Deal rejected")


async def cancel(deal_id: str, user_id: str) -> dict:
    return await _set_status(deal_id, user_id, "cancelled", "Deal cancelled")


async def complete(deal_id: str, user_id: str) -> dict:
    db = get_db()
    d = await _get_owned(deal_id, user_id)
    now = datetime.now(timezone.utc).isoformat()
    pending_from = d.get("completion_pending_from")
    if not pending_from:
        # First party requests completion
        await db.deals.update_one({"_id": ObjectId(deal_id)}, {"$set": {"completion_pending_from": user_id, "updated_at": now}})
        await chat_service.send_message(
            thread_id=str(d["thread_id"]), sender_id=user_id,
            body={"type": "system", "text": "Completion requested. Waiting for other party to confirm."},
        )
    elif pending_from != user_id:
        # Other party confirms
        await db.deals.update_one({"_id": ObjectId(deal_id)}, {"$set": {"status": "completed", "updated_at": now}})
        await chat_service.send_message(
            thread_id=str(d["thread_id"]), sender_id=user_id,
            body={"type": "system", "text": "Deal completed ✅"},
        )
    return _s(await db.deals.find_one({"_id": ObjectId(deal_id)}))


async def my_deals(user_id: str, status: str | None = None) -> dict:
    db = get_db()
    q: dict = {"$or": [{"buyer_id": user_id}, {"seller_id": user_id}]}
    if status:
        q["status"] = status
    docs = await db.deals.find(q).sort([("_id", -1)]).limit(100).to_list(100)
    return {"items": [_s(d) for d in docs]}


async def get_by_id(deal_id: str, user_id: str) -> dict:
    d = await _get_owned(deal_id, user_id)
    return _s(d)


async def expire_task_loop(interval_seconds: int = 300) -> None:
    """Background loop to expire deals past their expires_at."""
    while True:
        try:
            db = get_db()
            now = datetime.now(timezone.utc).isoformat()
            res = await db.deals.update_many(
                {"status": "negotiating", "expires_at": {"$lt": now}},
                {"$set": {"status": "expired", "updated_at": now}},
            )
            if res.modified_count:
                logger.info("Expired %d deals", res.modified_count)
        except Exception as e:  # noqa: BLE001
            logger.warning("expire loop error: %s", e)
        await asyncio.sleep(interval_seconds)
