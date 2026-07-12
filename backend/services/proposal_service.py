"""Proposal service."""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from database import get_db
from models.phase3 import Proposal


def _serialize(d: dict) -> dict:
    if not d:
        return d
    out = dict(d)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    for k in ("requirement_id", "vendor_id"):
        if out.get(k):
            out[k] = str(out[k])
    out.pop("is_deleted", None)
    return out


async def create(vendor_id: str, body: dict) -> dict:
    db = get_db()
    rid = body.get("requirement_id")
    if not rid or not ObjectId.is_valid(rid):
        raise HTTPException(400, "requirement_id required")
    req = await db.requirements.find_one({"_id": ObjectId(rid), "is_deleted": {"$ne": True}})
    if not req:
        raise HTTPException(404, "Requirement not found")
    if req.get("status") != "open":
        raise HTTPException(400, "Requirement is no longer open")
    if str(req["customer_id"]) == vendor_id:
        raise HTTPException(400, "You can't propose on your own requirement")
    p = Proposal(
        requirement_id=rid,
        vendor_id=vendor_id,
        message=body.get("message", "").strip() or "I can help with this.",
        quoted_price=body.get("quoted_price"),
        attachments=body.get("attachments") or [],
    )
    res = await db.proposals.insert_one(p.to_mongo())
    await db.requirements.update_one({"_id": ObjectId(rid)}, {"$inc": {"proposals_count": 1}})
    doc = await db.proposals.find_one({"_id": res.inserted_id})
    return _serialize(doc)


async def list_by_requirement(req_id: str, customer_id: str) -> list[dict]:
    db = get_db()
    req = await db.requirements.find_one({"_id": ObjectId(req_id)})
    if not req or str(req["customer_id"]) != customer_id:
        raise HTTPException(403, "Only requirement owner can view proposals")
    docs = await db.proposals.find({"requirement_id": req_id, "is_deleted": {"$ne": True}}).sort([("_id", -1)]).to_list(200)
    # Enrich with vendor info
    vids = list({d["vendor_id"] for d in docs})
    vendors = await db.users.find({"_id": {"$in": [ObjectId(v) for v in vids]}}).to_list(len(vids)) if vids else []
    vmap = {str(v["_id"]): v for v in vendors}
    out = []
    for d in docs:
        item = _serialize(d)
        v = vmap.get(item["vendor_id"])
        if v:
            item["vendor"] = {"id": str(v["_id"]), "name": v.get("name"), "profile_pic": v.get("profile_pic"), "phone": v.get("phone")}
        out.append(item)
    return out


async def my_sent(vendor_id: str) -> list[dict]:
    db = get_db()
    docs = await db.proposals.find({"vendor_id": vendor_id, "is_deleted": {"$ne": True}}).sort([("_id", -1)]).limit(100).to_list(100)
    return [_serialize(d) for d in docs]


async def _update_status(pid: str, customer_id: str, new_status: str, auto_thread: bool = False) -> dict:
    db = get_db()
    if not ObjectId.is_valid(pid):
        raise HTTPException(400, "Invalid id")
    p = await db.proposals.find_one({"_id": ObjectId(pid)})
    if not p:
        raise HTTPException(404, "Proposal not found")
    req = await db.requirements.find_one({"_id": ObjectId(p["requirement_id"])})
    if not req or str(req["customer_id"]) != customer_id:
        raise HTTPException(403, "Not your requirement")
    await db.proposals.update_one({"_id": ObjectId(pid)}, {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    result = {"status": new_status}
    if new_status == "accepted" and auto_thread:
        from services import chat_service
        thread = await chat_service.get_or_create_thread(
            user_a=customer_id,
            user_b=str(p["vendor_id"]),
            thread_type="requirement",
            context_id=str(p["requirement_id"]),
        )
        # System message
        await chat_service.send_message(
            thread_id=thread["id"],
            sender_id=customer_id,
            body={"type": "system", "text": "Proposal accepted. Chat opened."},
        )
        result["thread_id"] = thread["id"]
    return result


async def shortlist(pid: str, customer_id: str) -> dict:
    return await _update_status(pid, customer_id, "shortlisted")


async def reject(pid: str, customer_id: str) -> dict:
    return await _update_status(pid, customer_id, "rejected")


async def accept(pid: str, customer_id: str) -> dict:
    return await _update_status(pid, customer_id, "accepted", auto_thread=True)
