"""Vendor analytics routes."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Literal

from middleware.auth_middleware import require_auth
from services import analytics_service

router = APIRouter(prefix="/v1/vendor/analytics", tags=["analytics"])


def _require_vendor(u):
    if "vendor" not in (u.roles or []) and "admin" not in (u.roles or []):
        raise HTTPException(403, "Vendor role required")


@router.get("/overview")
async def overview(
    range: Literal["7d", "30d", "90d", "all"] = "30d",
    user=Depends(require_auth),
):
    _require_vendor(user)
    return await analytics_service.overview(user.id, range)


@router.get("/listings")
async def per_listing(
    range: Literal["7d", "30d", "90d", "all"] = "30d",
    sort: Literal["views", "chats", "deals", "shares"] = "views",
    limit: int = Query(10, ge=1, le=50),
    user=Depends(require_auth),
):
    _require_vendor(user)
    return await analytics_service.per_listing(user.id, range, sort, limit)


@router.get("/timeseries")
async def timeseries(
    range: Literal["7d", "30d", "90d"] = "30d",
    metric: Literal["views", "chats", "deals", "deals_completed"] = "views",
    user=Depends(require_auth),
):
    _require_vendor(user)
    return await analytics_service.timeseries(user.id, range, metric)


@router.get("/boost-roi")
async def boost_roi(
    listing_id: str,
    user=Depends(require_auth),
):
    _require_vendor(user)
    return await analytics_service.boost_roi(user.id, listing_id)
