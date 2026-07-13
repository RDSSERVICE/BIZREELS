"""Listing model — supports new_product / old_product / service types."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field
from .base import BaseDocument, PyObjectId

ListingType = Literal["new_product", "old_product", "service"]
ListingStatus = Literal["active", "paused", "sold", "expired"]
Condition = Literal["new", "like_new", "good", "fair"]
ServiceChargesType = Literal["fixed", "hourly", "per_visit"]


class ListingImage(BaseModel):
    url: str
    public_id: str
    width: int | None = None
    height: int | None = None


class ListingReel(BaseModel):
    url: str
    public_id: str
    thumbnail_url: str | None = None
    duration: float | None = None  # seconds


class GeoPoint(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: list[float]  # [lng, lat]


VariantType = Literal["size", "color", "material", "tier", "custom"]


class ListingVariant(BaseModel):
    name: str
    type: VariantType = "custom"
    options: list[str] = Field(default_factory=list)
    prices: dict[str, float] | None = None  # optional per-option price in INR
    # For service tiers (used when type is 'tier')
    price_hint_inr: float | None = None
    features: list[str] = Field(default_factory=list)


class ListingLocation(BaseModel):
    lat: float | None = None
    lng: float | None = None
    address: str | None = None
    area: str
    city: str
    state: str | None = None
    pincode: str
    geo: GeoPoint | None = None


class Listing(BaseDocument):
    vendor_id: PyObjectId
    type: ListingType
    title: str
    slug: str
    description: str | None = None
    category_id: PyObjectId
    sub_category_id: PyObjectId | None = None
    price: float
    offer_price: float | None = None
    is_negotiable: bool = False
    bulk_price: float | None = None
    stock: int | None = None  # new_product
    condition: Condition | None = None  # old_product
    warranty: str | None = None  # new_product
    service_charges_type: ServiceChargesType | None = None  # service
    experience_years: int | None = None  # service
    service_area_km: float | None = None  # service
    images: list[ListingImage] = Field(default_factory=list)
    reel: ListingReel | None = None
    location: ListingLocation
    tags: list[str] = Field(default_factory=list)
    # Phase 7a: AI-assisted content extras (all optional, backwards-compatible)
    short_description: str | None = None
    features: list[str] = Field(default_factory=list)
    variants: list[ListingVariant] = Field(default_factory=list)
    status: ListingStatus = "active"
    views_count: int = 0
    saves_count: int = 0
    # Phase 4b additions
    boost_expires_at: str | None = None
    boost_duration_days: int | None = None
    boost_activated_at: str | None = None
    is_takendown: bool = False
    is_active: bool = True
    is_deleted: bool = False
    # Phase 6c: excludes automated-test / seed-harness listings from public output.
    is_test_data: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
