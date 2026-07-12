"""Feed service — mixed algorithm reverse-chronological with boosts."""
from __future__ import annotations
import math
from datetime import datetime, timezone, timedelta
from typing import Any
from bson import ObjectId
from fastapi import HTTPException

from database import get_db
from services.listing_service import _serialize
from services import follow_service


TYPE_FILTER = {
    "all": None,
    "products": ["new_product", "old_product"],
    "new_products": ["new_product"],
    "old_products": ["old_product"],
    "services": ["service"],
    "reels": None,  # reels handled separately (reel != null)
}


def _score(listing: dict, dist_km: float | None, following_set: set, now: datetime) -> float:
    s = 0.0
    # Freshness < 24h
    created = listing.get("created_at")
    if isinstance(created, str):
        try:
            c = datetime.fromisoformat(created.replace("Z", "+00:00"))
            if (now - c) < timedelta(hours=24):
                s += 20
        except Exception:  # noqa: BLE001
            pass
    # Proximity (linear 30→0)
    if dist_km is not None:
        s += max(0.0, 30.0 - dist_km)
    # Vendor follow boost
    if listing.get("vendor_id") and str(listing["vendor_id"]) in following_set:
        s += 15
    # Has reel
    if listing.get("reel"):
        s += 10
    # Has offer
    if listing.get("offer_price") is not None:
        s += 5
    # Phase 4b: boost
    boost_exp = listing.get("boost_expires_at")
    if boost_exp:
        try:
            bexp = datetime.fromisoformat(str(boost_exp).replace("Z", "+00:00"))
            if bexp > now:
                s += 25
        except Exception:  # noqa: BLE001
            pass
    return s


async def build_feed(
    type_: str = "all",
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float | None = 10.0,
    cursor: str | None = None,
    limit: int = 20,
    user_id: str | None = None,
    reels_only: bool = False,
) -> dict:
    db = get_db()
    q: dict[str, Any] = {"is_deleted": {"$ne": True}, "status": "active", "is_takendown": {"$ne": True},
                          "title": {"$not": {"$regex": "^TEST_"}}}
    types = TYPE_FILTER.get(type_)
    if types:
        q["type"] = {"$in": types}
    if reels_only or type_ == "reels":
        q["reel"] = {"$ne": None}

    # Pool size — we score client-side after fetching a wider pool
    pool_size = max(limit * 5, 40)

    docs: list[dict]
    if lat is not None and lng is not None and radius_km:
        try:
            # $geoNear via aggregation for distances
            pipeline = [
                {"$geoNear": {
                    "near": {"type": "Point", "coordinates": [float(lng), float(lat)]},
                    "distanceField": "distance_meters",
                    "maxDistance": float(radius_km) * 1000.0,
                    "query": q,
                    "spherical": True,
                }},
                {"$sort": {"_id": -1}},
                {"$limit": pool_size},
            ]
            docs = await db.listings.aggregate(pipeline).to_list(pool_size)
        except Exception:  # noqa: BLE001
            # Fall back to non-geo if index missing / bad data
            docs = await db.listings.find(q).sort([("_id", -1)]).limit(pool_size).to_list(pool_size)
    else:
        docs = await db.listings.find(q).sort([("_id", -1)]).limit(pool_size).to_list(pool_size)

    # Following set for the current user (empty for anon)
    following_set: set = set()
    if user_id:
        following_set = set(await follow_service.following_ids(user_id))

    now = datetime.now(timezone.utc)
    scored = []
    for d in docs:
        dist = d.get("distance_meters")
        dist_km = (dist / 1000.0) if dist is not None else None
        scored.append((_score(d, dist_km, following_set, now), d))

    # Sort by score desc, then _id desc as tiebreak (recency)
    scored.sort(key=lambda x: (x[0], str(x[1]["_id"])), reverse=True)

    # Cursor-based pagination: skip until we're past the cursor _id
    if cursor:
        found = False
        filtered = []
        for _, d in scored:
            if str(d["_id"]) == cursor:
                found = True
                continue
            if found:
                filtered.append(d)
        # If cursor not found in pool, fall through
        chosen = filtered[:limit] if found else [d for _, d in scored][:limit]
    else:
        chosen = [d for _, d in scored][:limit]

    # Enrich with vendor mini and interaction state
    result_items = [_serialize(d) for d in chosen]
    vendor_ids = list({r["vendor_id"] for r in result_items if r.get("vendor_id")})
    if vendor_ids:
        vendors = await db.users.find(
            {"_id": {"$in": [ObjectId(v) for v in vendor_ids]}}
        ).to_list(len(vendor_ids))
        vmap = {str(v["_id"]): v for v in vendors}
        for r in result_items:
            v = vmap.get(r.get("vendor_id", ""))
            if v:
                r["vendor"] = {
                    "id": str(v["_id"]),
                    "name": v.get("name"),
                    "profile_pic": v.get("profile_pic"),
                }

    # Interaction state for current user
    if user_id and result_items:
        from services.interaction_service import user_interaction_state
        state = await user_interaction_state(user_id, [r["id"] for r in result_items])
        for r in result_items:
            r["viewer_state"] = state.get(r["id"], {"liked": False, "saved": False})

    return {
        "items": result_items,
        "next_cursor": str(chosen[-1]["_id"]) if len(chosen) == limit else None,
        "has_more": len(chosen) == limit,
    }
