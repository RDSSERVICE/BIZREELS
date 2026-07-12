"""Search + suggestions service."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any
from bson import ObjectId
from fastapi import HTTPException

from database import get_db
from services.listing_service import _serialize


SORT_MAP = {
    "recent": [("_id", -1)],
    "price_asc": [("price", 1), ("_id", -1)],
    "price_desc": [("price", -1), ("_id", -1)],
}

TYPE_FILTER = {
    "products": ["new_product", "old_product"],
    "new_products": ["new_product"],
    "old_products": ["old_product"],
    "services": ["service"],
    "all": None,
}


async def search_listings(
    q: str | None = None,
    category_id: str | None = None,
    sub_category_id: str | None = None,
    type_: str | None = None,
    condition: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    is_negotiable: bool | None = None,
    has_offer: bool | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float | None = None,
    sort: str = "recent",
    cursor: str | None = None,
    limit: int = 20,
    user_id: str | None = None,
) -> dict:
    db = get_db()
    query: dict[str, Any] = {"is_deleted": {"$ne": True}, "status": "active"}
    if category_id and ObjectId.is_valid(category_id):
        query["category_id"] = category_id
    if sub_category_id and ObjectId.is_valid(sub_category_id):
        query["sub_category_id"] = sub_category_id
    if type_:
        types = TYPE_FILTER.get(type_, [type_])
        if types:
            query["type"] = {"$in": types}
    if condition:
        query["condition"] = condition
    if price_min is not None or price_max is not None:
        rng: dict = {}
        if price_min is not None:
            rng["$gte"] = float(price_min)
        if price_max is not None:
            rng["$lte"] = float(price_max)
        query["price"] = rng
    if is_negotiable is not None:
        query["is_negotiable"] = is_negotiable
    if has_offer:
        query["offer_price"] = {"$ne": None}
    if q:
        query["$text"] = {"$search": q}

    # Log search
    try:
        await db.search_history.insert_one({
            "user_id": user_id,
            "query": q,
            "filters": {k: v for k, v in {
                "category_id": category_id, "sub_category_id": sub_category_id, "type": type_,
                "condition": condition, "price_min": price_min, "price_max": price_max,
                "is_negotiable": is_negotiable, "has_offer": has_offer,
                "lat": lat, "lng": lng, "radius_km": radius_km, "sort": sort,
            }.items() if v is not None},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:  # noqa: BLE001
        pass

    if cursor:
        if not ObjectId.is_valid(cursor):
            raise HTTPException(400, "Invalid cursor")
        query["_id"] = {"$lt": ObjectId(cursor)}

    sort_spec = SORT_MAP.get(sort, SORT_MAP["recent"])

    if lat is not None and lng is not None and radius_km:
        pipeline = [
            {"$geoNear": {
                "near": {"type": "Point", "coordinates": [float(lng), float(lat)]},
                "distanceField": "distance_meters",
                "maxDistance": float(radius_km) * 1000.0,
                "query": query,
                "spherical": True,
            }},
            {"$sort": dict(sort_spec)},
            {"$limit": limit + 1},
        ]
        docs = await db.listings.aggregate(pipeline).to_list(limit + 1)
    else:
        docs = await db.listings.find(query).sort(sort_spec).limit(limit + 1).to_list(limit + 1)

    has_more = len(docs) > limit
    docs = docs[:limit]
    return {
        "items": [_serialize(d) for d in docs],
        "next_cursor": str(docs[-1]["_id"]) if has_more and docs else None,
        "has_more": has_more,
    }


async def suggest(q: str, limit: int = 5) -> dict:
    """Autocomplete suggestions — titles + categories matching prefix/substring."""
    db = get_db()
    q_clean = (q or "").strip()
    if len(q_clean) < 2:
        return {"listings": [], "categories": []}
    rx = {"$regex": q_clean, "$options": "i"}
    listing_docs = await db.listings.find(
        {"title": rx, "is_deleted": {"$ne": True}, "status": "active"},
        {"title": 1, "slug": 1, "images": 1, "price": 1, "offer_price": 1},
    ).limit(limit).to_list(limit)
    cat_docs = await db.categories.find(
        {"name": rx, "is_deleted": {"$ne": True}, "is_active": True},
        {"name": 1, "slug": 1, "icon_url": 1, "parent_id": 1},
    ).limit(3).to_list(3)
    return {
        "listings": [{
            "title": l.get("title"),
            "slug": l.get("slug"),
            "image": (l.get("images") or [{}])[0].get("url"),
            "price": l.get("offer_price") or l.get("price"),
        } for l in listing_docs],
        "categories": [{
            "id": str(c["_id"]),
            "name": c.get("name"),
            "slug": c.get("slug"),
            "icon_url": c.get("icon_url"),
            "is_top_level": c.get("parent_id") is None,
        } for c in cat_docs],
    }
