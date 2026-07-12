"""Requirement service: CRUD + proposals count management."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any
from bson import ObjectId
from fastapi import HTTPException
from slugify import slugify

from database import get_db
from models.phase3 import Requirement


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    out = dict(doc)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    for k in ("customer_id", "category_id", "sub_category_id"):
        if out.get(k):
            out[k] = str(out[k])
    out.pop("is_deleted", None)
    return out


async def create(customer_id: str, body: dict) -> dict:
    db = get_db()
    if not body.get("title") or len(body["title"]) < 3:
        raise HTTPException(400, "Title required")
    if not body.get("category_id") or not ObjectId.is_valid(body["category_id"]):
        raise HTTPException(400, "Valid category_id required")
    loc = body.get("location") or {}
    for f in ("area", "city", "pincode"):
        if not loc.get(f):
            raise HTTPException(400, f"location.{f} required")
    if loc.get("lat") is not None and loc.get("lng") is not None:
        loc["geo"] = {"type": "Point", "coordinates": [loc["lng"], loc["lat"]]}
    req = Requirement(
        customer_id=customer_id,
        title=body["title"].strip(),
        description=body.get("description"),
        category_id=body["category_id"],
        sub_category_id=body.get("sub_category_id"),
        budget_min=body.get("budget_min"),
        budget_max=body.get("budget_max"),
        photos=body.get("photos") or [],
        video=body.get("video"),
        location=loc,
        urgency=body.get("urgency", "flexible"),
        is_negotiable=bool(body.get("is_negotiable", True)),
    )
    doc = req.to_mongo()
    res = await db.requirements.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)


async def list_requirements(filters: dict, limit: int = 20, cursor: str | None = None) -> dict:
    db = get_db()
    q: dict[str, Any] = {"is_deleted": {"$ne": True}, "status": "open"}
    if filters.get("category_id"):
        q["category_id"] = filters["category_id"]
    if filters.get("city"):
        q["location.city"] = {"$regex": f"^{filters['city']}$", "$options": "i"}
    if filters.get("urgency"):
        q["urgency"] = filters["urgency"]
    if filters.get("budget_max"):
        q["$or"] = [
            {"budget_max": None},
            {"budget_max": {"$lte": float(filters["budget_max"])}},
        ]
    if filters.get("q"):
        q["$text"] = {"$search": filters["q"]}
    if cursor:
        q["_id"] = {"$lt": ObjectId(cursor)}
    docs = await db.requirements.find(q).sort([("_id", -1)]).limit(limit + 1).to_list(limit + 1)
    has_more = len(docs) > limit
    docs = docs[:limit]
    return {
        "items": [_serialize(d) for d in docs],
        "next_cursor": str(docs[-1]["_id"]) if has_more and docs else None,
        "has_more": has_more,
    }


async def get_by_id(req_id: str) -> dict:
    db = get_db()
    if not ObjectId.is_valid(req_id):
        raise HTTPException(400, "Invalid id")
    doc = await db.requirements.find_one({"_id": ObjectId(req_id), "is_deleted": {"$ne": True}})
    if not doc:
        raise HTTPException(404, "Requirement not found")
    r = _serialize(doc)
    # Attach customer basic
    cust = await db.users.find_one({"_id": ObjectId(r["customer_id"])})
    if cust:
        r["customer"] = {"id": str(cust["_id"]), "name": cust.get("name"), "profile_pic": cust.get("profile_pic")}
    cat = await db.categories.find_one({"_id": ObjectId(r["category_id"])}) if r.get("category_id") else None
    if cat:
        r["category"] = {"id": str(cat["_id"]), "name": cat.get("name"), "slug": cat.get("slug")}
    return r


async def increment_views(req_id: str) -> None:
    db = get_db()
    await db.requirements.update_one({"_id": ObjectId(req_id)}, {"$inc": {"views_count": 1}})


async def update(req_id: str, customer_id: str, body: dict) -> dict:
    db = get_db()
    doc = await db.requirements.find_one({"_id": ObjectId(req_id), "is_deleted": {"$ne": True}})
    if not doc:
        raise HTTPException(404, "Requirement not found")
    if str(doc["customer_id"]) != customer_id:
        raise HTTPException(403, "Not yours")
    allowed = {"title", "description", "budget_min", "budget_max", "photos", "video", "location", "urgency", "is_negotiable"}
    clean = {k: v for k, v in body.items() if k in allowed and v is not None}
    if "location" in clean:
        loc = clean["location"]
        if loc.get("lat") is not None and loc.get("lng") is not None:
            loc["geo"] = {"type": "Point", "coordinates": [loc["lng"], loc["lat"]]}
    if not clean:
        raise HTTPException(400, "No updatable fields")
    clean["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.requirements.update_one({"_id": ObjectId(req_id)}, {"$set": clean})
    return _serialize(await db.requirements.find_one({"_id": ObjectId(req_id)}))


async def soft_delete(req_id: str, customer_id: str) -> None:
    db = get_db()
    doc = await db.requirements.find_one({"_id": ObjectId(req_id)})
    if not doc:
        raise HTTPException(404, "Not found")
    if str(doc["customer_id"]) != customer_id:
        raise HTTPException(403, "Not yours")
    await db.requirements.update_one({"_id": ObjectId(req_id)}, {"$set": {"is_deleted": True}})


async def close_requirement(req_id: str, customer_id: str) -> dict:
    db = get_db()
    doc = await db.requirements.find_one({"_id": ObjectId(req_id)})
    if not doc:
        raise HTTPException(404, "Not found")
    if str(doc["customer_id"]) != customer_id:
        raise HTTPException(403, "Not yours")
    await db.requirements.update_one({"_id": ObjectId(req_id)}, {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return _serialize(await db.requirements.find_one({"_id": ObjectId(req_id)}))


async def my_posted(customer_id: str) -> list[dict]:
    db = get_db()
    docs = await db.requirements.find({"customer_id": customer_id, "is_deleted": {"$ne": True}}).sort([("_id", -1)]).limit(100).to_list(100)
    return [_serialize(d) for d in docs]
