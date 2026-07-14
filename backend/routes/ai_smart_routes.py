"""AI Smart Feature routes — Phase 7d (Gemini-powered).

6 new endpoints under /api/v1/ai:
  POST /generate-title       (vendor)  → title suggestions
  POST /detect-category      (any-auth)→ category detection
  POST /parse-demand         (any-auth)→ buyer intent parsing
  POST /match-vendors        (any-auth)→ AI-ranked vendor matches
  POST /suggest-price        (vendor)  → market-aware price suggestion
  POST /negotiate            (any-auth)→ chat negotiation helper

Rate limits: 20/hr for light endpoints (title/category/price),
             10/hr for heavy ones (demand/match/negotiate).
Global daily token cap inherited from ai_content_service.
"""
from __future__ import annotations

import logging

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from database import get_db
from middleware.auth_middleware import require_auth
from services import ai_smart_service
from utils.rate_limit import check_and_record

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/ai", tags=["ai-smart"])

LIGHT_LIMIT = 20  # /hr
HEAVY_LIMIT = 10  # /hr
WINDOW = 3600     # 1h


def _rate(user_id: str, bucket: str, limit: int) -> None:
    ok, retry = check_and_record(f"ai:{bucket}:{user_id}", limit, WINDOW)
    if not ok:
        raise HTTPException(429, f"AI rate limit hit ({bucket}) — try again in {retry}s")


def _require_vendor(user):
    roles = user.roles or []
    if "vendor" not in roles and "admin" not in roles:
        raise HTTPException(403, "Vendor role required")


# ============================================================ FEATURE 1: titles
class TitleBody(BaseModel):
    listing_type: str = Field(pattern="^(new_product|old_product|service)$")
    description: str | None = Field(default=None, max_length=2000)
    category_hint: str | None = Field(default=None, max_length=120)
    image_urls: list[str] | None = Field(default=None, max_length=6)


@router.post("/generate-title")
async def generate_title(body: TitleBody, user=Depends(require_auth)):
    _require_vendor(user)
    _rate(str(user.id), "title", LIGHT_LIMIT)
    return await ai_smart_service.generate_titles(
        description=(body.description or "").strip() or None,
        category_hint=(body.category_hint or "").strip() or None,
        listing_type=body.listing_type,
        image_urls=body.image_urls or None,
    )


# ============================================================ FEATURE 2: category
class CategoryBody(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    image_urls: list[str] | None = Field(default=None, max_length=6)


@router.post("/detect-category")
async def detect_category(body: CategoryBody, user=Depends(require_auth)):
    _rate(str(user.id), "category", LIGHT_LIMIT)
    if not (body.title or body.description or body.image_urls):
        raise HTTPException(400, "Provide title, description, or image_urls")
    return await ai_smart_service.detect_category(
        title=(body.title or "").strip() or None,
        description=(body.description or "").strip() or None,
        image_urls=body.image_urls or None,
    )


# ============================================================ FEATURE 3: demand
class DemandBody(BaseModel):
    text: str = Field(min_length=3, max_length=1000)


@router.post("/parse-demand")
async def parse_demand(body: DemandBody, user=Depends(require_auth)):
    _rate(str(user.id), "demand", HEAVY_LIMIT)
    return await ai_smart_service.parse_demand(body.text.strip())


# ============================================================ FEATURE 4: match
class MatchBody(BaseModel):
    requirement_id: str | None = None
    category_id: str | None = None
    sub_category_id: str | None = None
    city: str | None = None
    price_max: int | None = Field(default=None, ge=0, le=100_000_000)
    must_have_features: list[str] | None = None
    description: str | None = Field(default=None, max_length=1000)
    limit: int = Field(default=10, ge=1, le=20)


@router.post("/match-vendors")
async def match_vendors(body: MatchBody, user=Depends(require_auth)):
    _rate(str(user.id), "match", HEAVY_LIMIT)
    # If requirement_id given, fetch and enrich
    cat_id = body.category_id
    sub_id = body.sub_category_id
    city = body.city
    price_max = body.price_max
    must_have = body.must_have_features or []
    description = (body.description or "").strip()

    if body.requirement_id and ObjectId.is_valid(body.requirement_id):
        db = get_db()
        r = await db.requirements.find_one({"_id": ObjectId(body.requirement_id),
                                            "is_deleted": {"$ne": True}})
        if not r:
            raise HTTPException(404, "Requirement not found")
        cat_id = cat_id or r.get("category_id")
        sub_id = sub_id or r.get("sub_category_id")
        city = city or (r.get("location") or {}).get("city") or r.get("city")
        price_max = price_max or (r.get("budget_max") or r.get("budget"))
        must_have = must_have or r.get("must_have_features") or []
        description = description or (r.get("description") or r.get("title") or "")

    if not description:
        raise HTTPException(400, "description or requirement_id required")

    return await ai_smart_service.match_vendors(
        category_id=cat_id, sub_category_id=sub_id, city=city,
        price_max=price_max, must_have_features=must_have,
        description=description, limit=body.limit,
    )


# ============================================================ FEATURE 5: price
class PriceBody(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(default="", max_length=2000)
    category_id: str | None = None
    sub_category_id: str | None = None
    condition: str | None = Field(default=None, max_length=40)
    city: str | None = Field(default=None, max_length=80)
    listing_type: str = Field(pattern="^(new_product|old_product|service)$")


@router.post("/suggest-price")
async def suggest_price(body: PriceBody, user=Depends(require_auth)):
    _rate(str(user.id), "price", LIGHT_LIMIT)
    return await ai_smart_service.suggest_price(
        title=body.title.strip(),
        description=(body.description or "").strip(),
        category_id=body.category_id, sub_category_id=body.sub_category_id,
        condition=body.condition, city=body.city, listing_type=body.listing_type,
    )


# ============================================================ FEATURE 6: negotiate
class NegotiateBody(BaseModel):
    deal_id: str | None = None
    thread_id: str | None = None
    direction: str = Field(default="buyer", pattern="^(buyer|seller)$")
    ask: str = Field(default="write_message",
                     pattern="^(suggest_counter|write_message|analyze_situation)$")


@router.post("/negotiate")
async def negotiate(body: NegotiateBody, user=Depends(require_auth)):
    _rate(str(user.id), "negotiate", HEAVY_LIMIT)
    if not body.deal_id and not body.thread_id:
        raise HTTPException(400, "Provide deal_id or thread_id")
    return await ai_smart_service.negotiation_helper(
        deal_id=body.deal_id, thread_id=body.thread_id,
        direction=body.direction, ask=body.ask, user_id=str(user.id),
    )
