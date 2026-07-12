"""Search + suggestions routes."""
from __future__ import annotations
from fastapi import APIRouter, Query, Request
import jwt

from services import search_service
from utils.jwt_utils import decode_access_token

router = APIRouter(prefix="/v1/search", tags=["search"])


async def _optional_user_id(request: Request) -> str | None:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        return None
    try:
        payload = decode_access_token(auth.split(None, 1)[1])
        return payload.get("sub") if payload.get("type") == "access" else None
    except jwt.InvalidTokenError:
        return None


@router.get("/")
async def search(
    request: Request,
    q: str | None = Query(None),
    category_id: str | None = Query(None),
    sub_category_id: str | None = Query(None),
    type: str | None = Query(None),
    condition: str | None = Query(None),
    price_min: float | None = Query(None),
    price_max: float | None = Query(None),
    is_negotiable: bool | None = Query(None),
    has_offer: bool | None = Query(None),
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    radius: float | None = Query(None),
    sort: str = Query("recent"),
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
):
    user_id = await _optional_user_id(request)
    return await search_service.search_listings(
        q=q,
        category_id=category_id,
        sub_category_id=sub_category_id,
        type_=type,
        condition=condition,
        price_min=price_min,
        price_max=price_max,
        is_negotiable=is_negotiable,
        has_offer=has_offer,
        lat=lat, lng=lng, radius_km=radius,
        sort=sort,
        cursor=cursor,
        limit=limit,
        user_id=user_id,
    )


@router.get("/suggest")
async def suggest(q: str = Query("", min_length=0)):
    return await search_service.suggest(q)
