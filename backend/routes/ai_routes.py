"""AI content generation routes — listing autofill + description improvement."""
from __future__ import annotations
import logging

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from database import get_db
from middleware.auth_middleware import require_auth
from services import ai_content_service
from utils.rate_limit import check_and_record

router = APIRouter(prefix="/v1/ai", tags=["ai"])
logger = logging.getLogger(__name__)

# Per-vendor rate limit: 10 generations per hour
AI_RATE_LIMIT = 10
AI_WINDOW_SECONDS = 3600


class GenerateBody(BaseModel):
    title: str = Field(min_length=3, max_length=140)
    category_id: str | None = None
    sub_category_id: str | None = None
    type: str = Field(pattern="^(new_product|old_product|service)$")
    hints: str | None = Field(default=None, max_length=500)


class ImproveBody(BaseModel):
    listing_id: str | None = None
    current_description: str | None = Field(default=None, max_length=4000)
    title: str = Field(min_length=1, max_length=200)
    tone: str = Field(default="friendly")


def _require_vendor(user):
    roles = user.roles or []
    if "vendor" not in roles and "admin" not in roles:
        raise HTTPException(403, "Vendor role required")


def _rate_limit(user_id: str) -> None:
    ok, remaining = check_and_record(
        f"ai:{user_id}", AI_RATE_LIMIT, AI_WINDOW_SECONDS,
    )
    if not ok:
        raise HTTPException(429, f"AI rate limit hit — try again in {remaining}s")


@router.post("/generate-listing-content")
async def generate_listing_content(body: GenerateBody, user=Depends(require_auth)):
    _require_vendor(user)
    _rate_limit(str(user.id))

    db = get_db()
    cat_name = sub_name = None
    if body.category_id and ObjectId.is_valid(body.category_id):
        c = await db.categories.find_one({"_id": ObjectId(body.category_id)}, {"name": 1})
        cat_name = c.get("name") if c else None
    if body.sub_category_id and ObjectId.is_valid(body.sub_category_id):
        sc = await db.categories.find_one({"_id": ObjectId(body.sub_category_id)}, {"name": 1})
        sub_name = sc.get("name") if sc else None

    return await ai_content_service.generate_listing_content(
        title=body.title.strip(),
        category_name=cat_name,
        sub_category_name=sub_name,
        listing_type=body.type,
        hints=(body.hints or "").strip() or None,
    )


@router.post("/improve-description")
async def improve_description(body: ImproveBody, user=Depends(require_auth)):
    _require_vendor(user)
    _rate_limit(str(user.id))

    current = (body.current_description or "").strip()
    title = body.title.strip()
    if body.listing_id and ObjectId.is_valid(body.listing_id):
        db = get_db()
        li = await db.listings.find_one(
            {"_id": ObjectId(body.listing_id), "is_deleted": {"$ne": True}},
            {"title": 1, "description": 1, "vendor_id": 1},
        )
        if not li:
            raise HTTPException(404, "Listing not found")
        if "admin" not in (user.roles or []) and str(li.get("vendor_id")) != str(user.id):
            raise HTTPException(403, "Not your listing")
        current = current or (li.get("description") or "")
        title = title or (li.get("title") or "")

    if not current:
        raise HTTPException(400, "No description provided or found on listing")

    return await ai_content_service.improve_description(
        current_description=current, title=title, tone=body.tone,
    )
