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
