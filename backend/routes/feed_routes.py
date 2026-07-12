"""Feed routes — main personalized feed + reels-only feed."""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query, Request

from middleware.auth_middleware import bearer_scheme, require_auth
from services import feed_service
from utils.jwt_utils import decode_access_token
import jwt

router = APIRouter(prefix="/v1/feed", tags=["feed"])


async def _optional_user_id(request: Request) -> str | None:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        return None
    token = auth.split(None, 1)[1]
    try:
        payload = decode_access_token(token)
        if payload.get("type") != "access":
            return None
        return payload.get("sub")
    except jwt.InvalidTokenError:
        return None


@router.get("/")
async def get_feed(
    request: Request,
    type: str = Query("all"),
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    radius: str = Query("10"),
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
):
    user_id = await _optional_user_id(request)
    radius_km: float | None
    if radius.lower() == "any":
        radius_km = None
    else:
        try:
            radius_km = float(radius)
        except ValueError:
            radius_km = 10.0
    return await feed_service.build_feed(
        type_=type,
        lat=lat, lng=lng, radius_km=radius_km,
        cursor=cursor, limit=limit,
        user_id=user_id,
    )


@router.get("/reels")
async def get_reels_feed(
    request: Request,
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    radius: str = Query("any"),
    cursor: str | None = Query(None),
    limit: int = Query(15, ge=1, le=30),
):
    user_id = await _optional_user_id(request)
    radius_km: float | None
    if radius.lower() == "any":
        radius_km = None
    else:
        try:
            radius_km = float(radius)
        except ValueError:
            radius_km = None
    return await feed_service.build_feed(
        type_="all", reels_only=True,
        lat=lat, lng=lng, radius_km=radius_km,
        cursor=cursor, limit=limit,
        user_id=user_id,
    )
