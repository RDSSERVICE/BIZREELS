"""Listing service: create/read/update/delete + validation per type."""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from typing import Any
from bson import ObjectId
from fastapi import HTTPException
from slugify import slugify

from database import get_db
from models.listing import Listing
from utils.test_data import not_test_filter

logger = logging.getLogger(__name__)

MAX_IMAGES = 10
MAX_REEL_DURATION = 30.0  # seconds


def _serialize(doc: dict) -> dict:
    """Convert Mongo doc to API response shape."""
    if not doc:
        return doc
    out = dict(doc)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    for k in ("vendor_id", "category_id", "sub_category_id"):
        if out.get(k):
            out[k] = str(out[k])
    out.pop("is_deleted", None)
    return out


def _validate_type_fields(type_: str, body: dict) -> None:
    if type_ == "new_product":
        if body.get("stock") is None or body["stock"] < 0:
            raise HTTPException(400, "new_product: stock (>=0) is required")
        if body.get("condition") is not None:
            raise HTTPException(400, "new_product: condition must be omitted")
    elif type_ == "old_product":
        if not body.get("condition"):
            raise HTTPException(400, "old_product: condition is required")
        if body.get("stock") is not None:
            raise HTTPException(400, "old_product: stock must be omitted")
    elif type_ == "service":
        if not body.get("service_charges_type"):
            raise HTTPException(400, "service: service_charges_type is required")
        for f in ("stock", "condition", "warranty"):
            if body.get(f) is not None:
                raise HTTPException(400, f"service: {f} must be omitted")
    else:
        raise HTTPException(400, f"Invalid listing type: {type_}")


def _validate_prices(price: float, offer_price: float | None) -> None:
    if price <= 0:
        raise HTTPException(400, "price must be > 0")
    if offer_price is not None and offer_price >= price:
        raise HTTPException(400, "offer_price must be less than price")


def _validate_location(loc: dict) -> None:
    for f in ("area", "city", "pincode"):
        if not loc.get(f):
            raise HTTPException(400, f"location.{f} is required")


def _validate_media(images: list, reel: dict | None) -> None:
    if len(images) > MAX_IMAGES:
        raise HTTPException(400, f"Max {MAX_IMAGES} images allowed")
    if reel and reel.get("duration") and reel["duration"] > MAX_REEL_DURATION:
        # Soft check — client should already have blocked. Also flagged for
        # server-side hard-enforcement in a later hardening phase.
        raise HTTPException(400, f"Reel duration must be <= {MAX_REEL_DURATION}s")


async def _next_slug(base: str) -> str:
    db = get_db()
    slug = base
    i = 1
    while await db.listings.find_one({"slug": slug}):
        i += 1
        slug = f"{base}-{i}"
    return slug


async def create_listing(vendor_id: str, body: dict) -> dict:
    db = get_db()

    type_ = body.get("type")
    _validate_type_fields(type_, body)
    _validate_prices(body.get("price", 0), body.get("offer_price"))
    location = body.get("location") or {}
    _validate_location(location)
    _validate_media(body.get("images") or [], body.get("reel"))

    # Category validation
    if not body.get("category_id") or not ObjectId.is_valid(body["category_id"]):
        raise HTTPException(400, "Valid category_id required")
    cat = await db.categories.find_one({"_id": ObjectId(body["category_id"])})
    if not cat:
        raise HTTPException(400, "Category not found")

    if body.get("sub_category_id"):
        if not ObjectId.is_valid(body["sub_category_id"]):
            raise HTTPException(400, "Invalid sub_category_id")
        sub = await db.categories.find_one({"_id": ObjectId(body["sub_category_id"])})
        if not sub or str(sub.get("parent_id")) != body["category_id"]:
            raise HTTPException(400, "sub_category_id must be a child of category_id")

    # GeoJSON point
    if location.get("lat") is not None and location.get("lng") is not None:
        location["geo"] = {"type": "Point", "coordinates": [location["lng"], location["lat"]]}

    slug = await _next_slug(slugify(body["title"])[:60] or "listing")

    listing = Listing(
        vendor_id=vendor_id,
        type=type_,
        title=body["title"].strip(),
        slug=slug,
        description=body.get("description"),
        category_id=body["category_id"],
        sub_category_id=body.get("sub_category_id"),
        price=float(body["price"]),
        offer_price=body.get("offer_price"),
        is_negotiable=bool(body.get("is_negotiable", False)),
        bulk_price=body.get("bulk_price"),
        stock=body.get("stock"),
        condition=body.get("condition"),
        warranty=body.get("warranty"),
        service_charges_type=body.get("service_charges_type"),
        experience_years=body.get("experience_years"),
        service_area_km=body.get("service_area_km"),
        images=body.get("images") or [],
        reel=body.get("reel"),
        location=location,
        tags=[t.strip() for t in (body.get("tags") or []) if t.strip()],
    )
    doc = listing.to_mongo()
    res = await db.listings.insert_one(doc)
    doc["_id"] = res.inserted_id
    # Referral trigger: award pending referral if this is user's first listing
    try:
        from services import referral_service
        await referral_service.maybe_award_on_listing(vendor_id)
    except Exception:  # noqa: BLE001
        pass
    return _serialize(doc)


async def list_listings(
    filters: dict,
    limit: int = 20,
    cursor: str | None = None,
) -> dict:
    """Paginated list. Uses created_at descending + _id tie-break for cursor pagination."""
    db = get_db()
    q: dict[str, Any] = {"is_deleted": {"$ne": True}, "is_takendown": {"$ne": True},
                          **not_test_filter("title")}
    for k in ("type", "category_id", "sub_category_id", "vendor_id", "status"):
        v = filters.get(k)
        if v:
            if k.endswith("_id"):
                if not ObjectId.is_valid(v):
                    raise HTTPException(400, f"Invalid {k}")
                q[k] = v
            else:
                q[k] = v
    if not filters.get("include_inactive"):
        q.setdefault("status", "active")
    text_q = filters.get("q")
    if text_q:
        q["$text"] = {"$search": text_q}
    if cursor:
        try:
            q["_id"] = {"$lt": ObjectId(cursor)}
        except Exception:  # noqa: BLE001
            raise HTTPException(400, "Invalid cursor")

    total = await db.listings.count_documents(q) if not cursor else None
    docs = await db.listings.find(q).sort([("_id", -1)]).limit(limit + 1).to_list(length=limit + 1)
    has_more = len(docs) > limit
    docs = docs[:limit]
    return {
        "items": [_serialize(d) for d in docs],
        "next_cursor": str(docs[-1]["_id"]) if has_more and docs else None,
        "has_more": has_more,
        "total": total,
    }


async def get_by_slug(slug: str, incr_views: bool = True) -> dict:
    db = get_db()
    doc = await db.listings.find_one({"slug": slug, "is_deleted": {"$ne": True}})
    if not doc:
        raise HTTPException(404, "Listing not found")
    if incr_views:
        # Fire-and-forget: don't await; but Motor doesn't allow true fire-and-forget
        # without asyncio.create_task; do it after we prepare the response.
        pass
    result = _serialize(doc)
    # Attach vendor basic info
    vendor = await db.users.find_one({"_id": ObjectId(result["vendor_id"])})
    if vendor:
        result["vendor"] = {
            "id": str(vendor["_id"]),
            "name": vendor.get("name"),
            "profile_pic": vendor.get("profile_pic"),
            "phone": vendor.get("phone"),
        }
    # Attach category names
    cat = await db.categories.find_one({"_id": ObjectId(result["category_id"])})
    if cat:
        result["category"] = {"id": str(cat["_id"]), "name": cat["name"], "slug": cat["slug"]}
    if result.get("sub_category_id"):
        sub = await db.categories.find_one({"_id": ObjectId(result["sub_category_id"])})
        if sub:
            result["sub_category"] = {"id": str(sub["_id"]), "name": sub["name"], "slug": sub["slug"]}
    return result


async def increment_views(slug: str) -> None:
    db = get_db()
    doc = await db.listings.find_one_and_update(
        {"slug": slug}, {"$inc": {"views_count": 1}},
    )
    # Emit `view` analytics event
    if doc:
        try:
            from services import event_service
            await event_service.emit(
                listing_id=str(doc["_id"]),
                vendor_id=str(doc.get("vendor_id")) if doc.get("vendor_id") else None,
                event_type="view", user_id=None,
                meta={"slug": slug},
            )
        except Exception:  # noqa: BLE001
            pass


async def get_by_id_for_owner(listing_id: str, vendor_id: str, is_admin: bool = False) -> dict:
    db = get_db()
    if not ObjectId.is_valid(listing_id):
        raise HTTPException(400, "Invalid listing id")
    doc = await db.listings.find_one({"_id": ObjectId(listing_id), "is_deleted": {"$ne": True}})
    if not doc:
        raise HTTPException(404, "Listing not found")
    if not is_admin and str(doc["vendor_id"]) != vendor_id:
        raise HTTPException(403, "Not your listing")
    return doc


async def update_listing(listing_id: str, vendor_id: str, body: dict, is_admin: bool = False) -> dict:
    db = get_db()
    doc = await get_by_id_for_owner(listing_id, vendor_id, is_admin)
    allowed = {
        "title", "description", "price", "offer_price", "is_negotiable", "bulk_price",
        "stock", "condition", "warranty", "service_charges_type", "experience_years",
        "service_area_km", "images", "reel", "location", "tags", "status",
    }
    clean = {k: v for k, v in body.items() if k in allowed}
    # Re-validate when relevant
    if "price" in clean or "offer_price" in clean:
        price = clean.get("price", doc.get("price"))
        offer = clean.get("offer_price", doc.get("offer_price"))
        _validate_prices(price, offer)
    if "images" in clean or "reel" in clean:
        _validate_media(clean.get("images", doc.get("images", [])), clean.get("reel", doc.get("reel")))
    if "location" in clean:
        loc = clean["location"]
        _validate_location(loc)
        if loc.get("lat") is not None and loc.get("lng") is not None:
            loc["geo"] = {"type": "Point", "coordinates": [loc["lng"], loc["lat"]]}
    if "status" in clean and clean["status"] not in ("active", "paused", "sold", "expired"):
        raise HTTPException(400, "Invalid status")
    if not clean:
        raise HTTPException(400, "No updatable fields")
    clean["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Phase 4b: detect price drop / back-in-stock for watcher notifications
    old_price = doc.get("price")
    old_offer = doc.get("offer_price")
    old_stock = doc.get("stock")

    await db.listings.update_one({"_id": ObjectId(listing_id)}, {"$set": clean})
    updated = await db.listings.find_one({"_id": ObjectId(listing_id)})

    # Fire watcher notifications AFTER update commits — fire-and-forget via task
    try:
        new_price = updated.get("price")
        new_offer = updated.get("offer_price")
        new_stock = updated.get("stock")
        price_dropped = (
            (isinstance(new_price, (int, float)) and isinstance(old_price, (int, float)) and new_price < old_price)
            or (new_offer is not None and (old_offer is None or new_offer < old_offer))
        )
        back_in_stock = (isinstance(old_stock, (int, float)) and old_stock == 0
                         and isinstance(new_stock, (int, float)) and new_stock > 0)
        if price_dropped or back_in_stock:
            import asyncio
            from services import watcher_notify_service  # local import to avoid cycles
            asyncio.create_task(watcher_notify_service.notify_watchers(
                listing_id=listing_id,
                title=updated.get("title") or "",
                slug=updated.get("slug"),
                effective_price=(new_offer if new_offer is not None else new_price),
                event="price_drop" if price_dropped else "back_in_stock",
            ))
    except Exception:  # noqa: BLE001
        logger.exception("watcher_notify enqueue failed")

    return _serialize(updated)


async def set_status(listing_id: str, vendor_id: str, status: str, is_admin: bool = False) -> dict:
    if status not in ("active", "paused", "sold", "expired"):
        raise HTTPException(400, "Invalid status")
    return await update_listing(listing_id, vendor_id, {"status": status}, is_admin)


async def soft_delete(listing_id: str, vendor_id: str, is_admin: bool = False) -> None:
    db = get_db()
    await get_by_id_for_owner(listing_id, vendor_id, is_admin)
    await db.listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": {
            "is_deleted": True,
            "is_active": False,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )


async def list_by_vendor(vendor_id: str, include_inactive: bool = True) -> list[dict]:
    db = get_db()
    q = {"vendor_id": vendor_id, "is_deleted": {"$ne": True}}
    docs = await db.listings.find(q).sort([("_id", -1)]).to_list(length=200)
    return [_serialize(d) for d in docs]
