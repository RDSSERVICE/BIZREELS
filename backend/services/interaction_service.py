"""Like / save interaction service. Denormalizes counts on the listing."""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from database import get_db


COUNT_FIELD = {"like": "likes_count", "save": "saves_count"}


async def toggle(user_id: str, listing_id: str, type_: str) -> dict:
    if type_ not in ("like", "save"):
        raise HTTPException(400, "Invalid interaction type")
    if not ObjectId.is_valid(listing_id):
        raise HTTPException(400, "Invalid listing id")

    db = get_db()
    listing = await db.listings.find_one({"_id": ObjectId(listing_id), "is_deleted": {"$ne": True}})
    if not listing:
        raise HTTPException(404, "Listing not found")

    existing = await db.interactions.find_one({"user_id": user_id, "listing_id": listing_id, "type": type_})
    field = COUNT_FIELD[type_]
    if existing:
        await db.interactions.delete_one({"_id": existing["_id"]})
        await db.listings.update_one({"_id": ObjectId(listing_id)}, {"$inc": {field: -1}})
        active = False
    else:
        await db.interactions.insert_one({
            "user_id": user_id,
            "listing_id": listing_id,
            "type": type_,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.listings.update_one({"_id": ObjectId(listing_id)}, {"$inc": {field: 1}})
        active = True

    updated = await db.listings.find_one({"_id": ObjectId(listing_id)})
    return {"active": active, "count": updated.get(field, 0), "type": type_}


async def my_listings_by_type(user_id: str, type_: str, limit: int = 50) -> list[dict]:
    if type_ not in ("like", "save"):
        raise HTTPException(400, "Invalid type")
    db = get_db()
    inters = await db.interactions.find({"user_id": user_id, "type": type_}).sort([("_id", -1)]).limit(limit).to_list(limit)
    if not inters:
        return []
    ids = [ObjectId(i["listing_id"]) for i in inters if ObjectId.is_valid(i["listing_id"])]
    listings = await db.listings.find({"_id": {"$in": ids}, "is_deleted": {"$ne": True}}).to_list(limit)
    # preserve interaction ordering
    order = {str(i["listing_id"]): idx for idx, i in enumerate(inters)}
    listings.sort(key=lambda l: order.get(str(l["_id"]), 999))
    from services.listing_service import _serialize  # local import to avoid cycles
    return [_serialize(l) for l in listings]


async def user_interaction_state(user_id: str, listing_ids: list[str]) -> dict:
    """Return per-listing {liked, saved} state for the given user."""
    db = get_db()
    if not user_id or not listing_ids:
        return {}
    inters = await db.interactions.find({
        "user_id": user_id,
        "listing_id": {"$in": listing_ids},
    }).to_list(len(listing_ids) * 2)
    state: dict[str, dict] = {lid: {"liked": False, "saved": False} for lid in listing_ids}
    for i in inters:
        s = state.setdefault(i["listing_id"], {"liked": False, "saved": False})
        s[f"{i['type']}d"] = True
    return state
