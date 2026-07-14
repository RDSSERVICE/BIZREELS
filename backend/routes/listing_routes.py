"""Listing routes."""
from __future__ import annotations
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import Literal

from middleware.auth_middleware import require_auth
from services import listing_service, user_service, watch_service
from utils.rate_limit import check_and_record

router = APIRouter(prefix="/v1/listings", tags=["listings"])

ListingType = Literal["new_product", "old_product", "service"]
Condition = Literal["new", "like_new", "good", "fair"]
ServiceChargesType = Literal["fixed", "hourly", "per_visit"]
ListingStatus = Literal["active", "paused", "sold", "expired"]


class ListingImageIn(BaseModel):
    url: str
    public_id: str
    width: int | None = None
    height: int | None = None


class ListingReelIn(BaseModel):
    url: str
    public_id: str
    thumbnail_url: str | None = None
    duration: float | None = None


class LocationIn(BaseModel):
    lat: float | None = None
    lng: float | None = None
    address: str | None = None
    area: str
    city: str
    state: str | None = None
    pincode: str


class ListingVariantIn(BaseModel):
    name: str = Field(min_length=1, max_length=32)
    type: Literal["size", "color", "material", "tier", "custom"] = "custom"
    options: list[str] = Field(default_factory=list)
    prices: dict[str, float] | None = None
    price_hint_inr: float | None = None
    features: list[str] = Field(default_factory=list)


class ListingCreateBody(BaseModel):
    type: ListingType
    title: str = Field(..., min_length=3, max_length=120)
    description: str | None = None
    category_id: str
    sub_category_id: str | None = None
    price: float
    offer_price: float | None = None
    is_negotiable: bool = False
    bulk_price: float | None = None
    stock: int | None = None
    condition: Condition | None = None
    warranty: str | None = None
    service_charges_type: ServiceChargesType | None = None
    experience_years: int | None = None
    service_area_km: float | None = None
    images: list[ListingImageIn] = Field(default_factory=list)
    reel: ListingReelIn | None = None
    location: LocationIn
    tags: list[str] = Field(default_factory=list)
    # Phase 7a — AI content extras
    short_description: str | None = Field(default=None, max_length=200)
    features: list[str] = Field(default_factory=list)
    variants: list[ListingVariantIn] = Field(default_factory=list)


class ListingUpdateBody(BaseModel):
    title: str | None = None
    description: str | None = None
    price: float | None = None
    offer_price: float | None = None
    is_negotiable: bool | None = None
    bulk_price: float | None = None
    stock: int | None = None
    condition: Condition | None = None
    warranty: str | None = None
    service_charges_type: ServiceChargesType | None = None
    experience_years: int | None = None
    service_area_km: float | None = None
    images: list[ListingImageIn] | None = None
    reel: ListingReelIn | None = None
    location: LocationIn | None = None
    tags: list[str] | None = None
    status: ListingStatus | None = None
    short_description: str | None = None
    features: list[str] | None = None
    variants: list[ListingVariantIn] | None = None


class StatusBody(BaseModel):
    status: ListingStatus


def _is_vendor(user) -> bool:
    return "vendor" in (user.roles or [])


def _is_admin(user) -> bool:
    return "admin" in (user.roles or [])


@router.post("/")
async def create_listing(
    body: ListingCreateBody,
    become_vendor: bool = Query(False),
    user=Depends(require_auth),
):
    if not _is_vendor(user):
        if not become_vendor:
            raise HTTPException(
                403,
                "Add vendor role first. Retry with ?become_vendor=true to auto-add.",
            )
        # Auto-add vendor role (explicit user opt-in via query flag)
        await user_service.add_role(user.id, "vendor")
        user.roles = list({*user.roles, "vendor"})
    return await listing_service.create_listing(vendor_id=user.id, body=body.model_dump(exclude_none=True))


@router.get("/")
async def list_listings(
    type: str | None = Query(None),
    category_id: str | None = Query(None),
    sub_category_id: str | None = Query(None),
    vendor_id: str | None = Query(None),
    status: str | None = Query(None),
    q: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
):
    filters = {
        "type": type,
        "category_id": category_id,
        "sub_category_id": sub_category_id,
        "vendor_id": vendor_id,
        "status": status,
        "q": q,
    }
    return await listing_service.list_listings(filters, limit=limit, cursor=cursor)


@router.get("/vendor/me")
async def my_listings(user=Depends(require_auth)):
    if not _is_vendor(user):
        return {"items": []}
    items = await listing_service.list_by_vendor(user.id)
    return {"items": items}


@router.get("/{slug}")
async def get_listing(slug: str, background: BackgroundTasks):
    data = await listing_service.get_by_slug(slug, incr_views=True)
    # Fire-and-forget view increment
    background.add_task(listing_service.increment_views, slug)
    return data


@router.patch("/{listing_id}")
async def update_listing(listing_id: str, body: ListingUpdateBody, user=Depends(require_auth)):
    return await listing_service.update_listing(
        listing_id, user.id, body.model_dump(exclude_none=True), is_admin=_is_admin(user)
    )


@router.post("/{listing_id}/status")
async def set_status(listing_id: str, body: StatusBody, user=Depends(require_auth)):
    return await listing_service.set_status(
        listing_id, user.id, body.status, is_admin=_is_admin(user)
    )


@router.delete("/{listing_id}")
async def delete_listing(listing_id: str, user=Depends(require_auth)):
    await listing_service.soft_delete(listing_id, user.id, is_admin=_is_admin(user))
    return {"success": True}


class WatchBody(BaseModel):
    phone: str = Field(..., min_length=10, max_length=10)


@router.post("/{listing_id}/watch")
async def watch_listing(listing_id: str, body: WatchBody, request: Request):
    """Anonymous lead capture — no auth required.

    Rate limit: 5 requests per hour per IP (in-memory sliding window).
    """
    ip = request.client.host if request.client else "unknown"
    allowed, reset_in = check_and_record(f"watch:{ip}", limit=5, window_seconds=3600)
    if not allowed:
        raise HTTPException(429, f"Too many requests. Try again in {reset_in} seconds.")
    return await watch_service.add_watcher(listing_id, body.phone)


# ============= Phase 4b: Boost =============
class BoostBody(BaseModel):
    duration_days: Literal[3, 7, 14]
    payment_method: Literal["credits", "inr"] = "credits"


@router.post("/{listing_id}/boost")
async def boost_listing(listing_id: str, body: BoostBody, user=Depends(require_auth)):
    from services import boost_service
    if body.payment_method == "credits":
        return await boost_service.boost_with_credits(user.id, listing_id, body.duration_days)
    return await boost_service.boost_with_inr(user.id, listing_id, body.duration_days)


@router.get("/vendor/me/boosted")
async def my_boosted(user=Depends(require_auth)):
    from services import boost_service
    return {"items": await boost_service.list_my_boosted(user.id)}


# ============= Phase 5: Analytics events =============
class TrackBody(BaseModel):
    event: Literal["share", "wa_click", "save"]


@router.post("/{listing_id}/track")
async def track_listing_event(listing_id: str, body: TrackBody, request: Request):
    """Lightweight anon-friendly analytics event emitter (share / wa_click / save)."""
    from services import event_service
    # No auth strictly required; if auth header present, attribute to user
    user_id = None
    try:
        from middleware.auth_middleware import _decode_optional
        user_id = await _decode_optional(request)
    except Exception:  # noqa: BLE001
        pass
    await event_service.emit(
        listing_id=listing_id, vendor_id=None,
        event_type=body.event, user_id=user_id, meta={},
    )
    return {"ok": True}


@router.get("/vendor/{vendor_id}/related")
async def more_from_vendor(vendor_id: str, exclude_listing_id: str | None = None, limit: int = 12):
    """Public: return this vendor's other active listings (More-from-vendor rail)."""
    from bson import ObjectId
    from database import get_db
    from utils.test_data import not_test_filter
    db = get_db()
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(400, "Invalid vendor id")
    q: dict = {
        "vendor_id": vendor_id, "is_deleted": {"$ne": True},
        "status": "active", "is_takendown": {"$ne": True},
        **not_test_filter("title"),
    }
    if exclude_listing_id and ObjectId.is_valid(exclude_listing_id):
        q["_id"] = {"$ne": ObjectId(exclude_listing_id)}
    limit = max(1, min(24, int(limit)))
    from services.listing_service import _serialize
    docs = await db.listings.find(q).sort([("views_count", -1), ("_id", -1)]).limit(limit).to_list(length=limit)
    return {"items": [_serialize(d) for d in docs], "vendor_id": vendor_id}

