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


# ============= Phase 5 wrap-up: Nudge scan + dev backdate =============
@router.post("/nudge/scan")
async def admin_nudge_scan(user=Depends(require_auth)):
    """Admin-triggered manual run of the Boost & Bump nudge scan."""
    _require_admin(user)
    from services import nudge_service
    nudged = await nudge_service.nudge_once()
    return {
        "ok": True, "nudged_count": int(nudged),
        "min_age_days": nudge_service.NUDGE_MIN_AGE_DAYS,
        "max_views_30d_threshold": nudge_service.NUDGE_MAX_VIEWS_30D,
        "cooldown_days": nudge_service.NUDGE_COOLDOWN_DAYS,
    }


@router.post("/seed/reset-demo")
async def admin_seed_reset_demo(wipe: bool = True, user=Depends(require_auth)):
    """Wipe DEMO_* docs and re-seed a full India-based marketplace state.
    Admin-only, dev-mode gated (any *_DEV_MODE flag must be truthy).
    """
    _require_admin(user)
    import os as _os
    if not any(_os.environ.get(k, "").lower() in ("1", "true", "yes")
               for k in ("OTP_DEV_MODE", "CLOUDINARY_DEV_MODE", "RAZORPAY_DEV_MODE", "FCM_DEV_MODE")):
        raise HTTPException(403, "Dev-only endpoint. Enable a *_DEV_MODE flag.")
    from services import demo_seed_service
    return await demo_seed_service.reset_and_seed(wipe=wipe)


@router.post("/dev/purge-test-data")
async def admin_dev_purge_test_data(dry_run: bool = False, user=Depends(require_auth)):
    """Purge test/pytest-fixture data from the DB. Admin + dev-mode gated.

    Detects docs where `is_test_data == true` OR whose name/title matches the
    regex `^(test\\b|test_|[uv]\\d+ |[uv]\\d+$)` (case-insensitive). For matching
    users it also cascades a soft-delete across every collection with a
    user/vendor/reviewer FK — deals, reviews, messages, chat_threads,
    proposals, requirements, listing_events, interactions, follows, listings,
    notifications, wallets, subscriptions, wallet_transactions.

    Set `dry_run=true` to see what WOULD be purged without modifying data.
    Returns per-collection counts.
    """
    _require_admin(user)
    import os as _os
    if not any(_os.environ.get(k, "").lower() in ("1", "true", "yes")
               for k in ("OTP_DEV_MODE", "CLOUDINARY_DEV_MODE", "RAZORPAY_DEV_MODE", "FCM_DEV_MODE")):
        raise HTTPException(403, "Dev-only endpoint. Enable a *_DEV_MODE flag.")
    from services import admin_service as _svc
    return await _svc.purge_test_data(dry_run=dry_run)


@router.post("/listings/{listing_id}/dev-backdate")
async def admin_dev_backdate_listing(listing_id: str, days: int = 35, user=Depends(require_auth)):
    """Dev-only helper — backdates a listing's `created_at` for demoing time-gated
    features (nudge, tenure, boost-ROI baselines). Enabled only when any *_DEV_MODE flag
    is true. Admin-only.
    """
    _require_admin(user)
    import os as _os
    dev = any(_os.environ.get(k, "").lower() in ("1", "true", "yes")
              for k in ("OTP_DEV_MODE", "CLOUDINARY_DEV_MODE", "RAZORPAY_DEV_MODE", "FCM_DEV_MODE"))
    if not dev:
        raise HTTPException(403, "Dev-only endpoint. Enable a *_DEV_MODE flag.")
    from datetime import datetime, timezone, timedelta
    from bson import ObjectId
    from database import get_db
    if not ObjectId.is_valid(listing_id):
        raise HTTPException(400, "Invalid listing id")
    days = max(1, min(365, int(days)))
    new_created = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    db = get_db()
    res = await db.listings.update_one(
        {"_id": ObjectId(listing_id), "is_deleted": {"$ne": True}},
        {"$set": {"created_at": new_created,
                  "last_boost_nudge_at": None,
                  "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if not res.matched_count:
        raise HTTPException(404, "Listing not found")
    return {"ok": True, "listing_id": listing_id, "created_at": new_created, "backdated_days": days}
