"""Admin routes — users, listings, analytics. KYC + Reports are in their own modules."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Literal

from middleware.auth_middleware import require_auth
from services import admin_service

router = APIRouter(prefix="/v1/admin", tags=["admin"])

Role = Literal["customer", "vendor", "creator"]


def _require_admin(u):
    if "admin" not in (u.roles or []):
        raise HTTPException(403, "Admin only")


class RoleBody(BaseModel):
    role: Role


@router.get("/users")
async def list_users(
    q: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
    kyc_status: str | None = None,
    is_subscribed_verified: bool | None = None,
    cursor: str | None = None,
    limit: int = Query(30, ge=1, le=100),
    user=Depends(require_auth),
):
    _require_admin(user)
    return await admin_service.list_users(q, role, is_active, kyc_status, is_subscribed_verified, cursor, limit)


@router.post("/users/{user_id}/freeze-wallet")
async def freeze_wallet(user_id: str, user=Depends(require_auth)):
    _require_admin(user)
    return await admin_service.freeze_wallet(user_id)


@router.post("/users/{user_id}/unfreeze-wallet")
async def unfreeze_wallet(user_id: str, user=Depends(require_auth)):
    _require_admin(user)
    return await admin_service.unfreeze_wallet(user_id)


@router.post("/users/{user_id}/ban")
async def ban_user(user_id: str, user=Depends(require_auth)):
    _require_admin(user)
    return await admin_service.ban_user(user_id)


@router.post("/users/{user_id}/unban")
async def unban_user(user_id: str, user=Depends(require_auth)):
    _require_admin(user)
    return await admin_service.unban_user(user_id)


@router.post("/users/{user_id}/add-role")
async def add_role(user_id: str, body: RoleBody, user=Depends(require_auth)):
    _require_admin(user)
    return await admin_service.add_role(user_id, body.role)


@router.post("/users/{user_id}/remove-role")
async def remove_role(user_id: str, body: RoleBody, user=Depends(require_auth)):
    _require_admin(user)
    return await admin_service.remove_role(user_id, body.role)


@router.get("/listings")
async def list_listings(
    status: str | None = None,
    flagged: bool | None = None,
    cursor: str | None = None,
    limit: int = Query(30, ge=1, le=100),
    user=Depends(require_auth),
):
    _require_admin(user)
    return await admin_service.list_listings(status, flagged, cursor, limit)


@router.post("/listings/{listing_id}/takedown")
async def takedown_listing(listing_id: str, user=Depends(require_auth)):
    _require_admin(user)
    return await admin_service.takedown_listing(listing_id)


@router.post("/listings/{listing_id}/restore")
async def restore_listing(listing_id: str, user=Depends(require_auth)):
    _require_admin(user)
    return await admin_service.restore_listing(listing_id)


@router.get("/analytics/overview")
async def analytics_overview(user=Depends(require_auth)):
    _require_admin(user)
    return await admin_service.analytics_overview()
