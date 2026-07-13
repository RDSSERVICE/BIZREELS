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


@router.post("/dev/rotate-admin-phone")
async def rotate_admin_phone_route(new_phone: str | None = None, user=Depends(require_auth)):
    """SEC-001: rotate the admin user's phone. Admin-only + dev-mode gated.

    Body-less endpoint — pass `?new_phone=<10digits>` to set a specific number,
    or omit to auto-generate a random Indian phone. Returns the new phone.
    """
    _require_admin(user)
    import os as _os
    if _os.environ.get("OTP_DEV_MODE", "").lower() not in ("1", "true", "yes"):
        raise HTTPException(403, "Dev-only endpoint. Enable OTP_DEV_MODE=true.")
    from services import admin_phone_service
    try:
        return await admin_phone_service.rotate_admin_phone(str(user.id), new_phone)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(500, f"Rotate failed: {e}")


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


# ============ Phase 6c: Integration Settings (admin panel) ============
class IntegrationsPatch(BaseModel):
    msg91: dict | None = None
    cloudinary: dict | None = None
    razorpay: dict | None = None
    fcm: dict | None = None
    ai_content: dict | None = None


@router.get("/settings/integrations")
async def get_integration_settings(user=Depends(require_auth)):
    """Admin-only. Returns current integration config with secrets MASKED."""
    _require_admin(user)
    from services import settings_service
    return await settings_service.get_masked()


@router.patch("/settings/integrations")
async def patch_integration_settings(body: IntegrationsPatch, user=Depends(require_auth)):
    """Admin-only. Partial update. Fields whose value equals `"****"` or `""`
    are left unchanged (used to preserve secrets that the UI can't display).
    """
    _require_admin(user)
    from services import settings_service
    patch = {k: v for k, v in body.model_dump(exclude_none=True).items()
             if k in settings_service.INTEGRATIONS}
    return await settings_service.update_settings(patch, updated_by=str(user.id))


@router.post("/settings/integrations/test")
async def test_integration(integration: str = Query(...), user=Depends(require_auth)):
    """Admin-only. Live-tests the current creds for the chosen integration."""
    _require_admin(user)
    # P3 hardening: throttle 20/hr per admin to prevent credential brute-force
    from utils.rate_limit import check_and_record
    ok, retry_in = check_and_record(f"admin_test:{user.id}", 20, 3600)
    if not ok:
        raise HTTPException(429, f"Too many test calls. Retry in {retry_in}s.")
    integration = (integration or "").strip().lower()
    if integration not in ("msg91", "cloudinary", "razorpay", "fcm", "ai_content"):
        raise HTTPException(400, "Unknown integration")

    try:
        if integration == "msg91":
            from services import msg91_service
            import secrets
            otp = f"{secrets.randbelow(10**6):06d}"
            res = await msg91_service.send_otp_sms(user.phone, otp)
            return {"ok": True, "integration": "msg91",
                    "dev_mode": msg91_service.is_dev_mode(),
                    "sent_to": user.phone, "provider_response": res}

        if integration == "cloudinary":
            from services import cloudinary_service
            if cloudinary_service.is_dev_mode():
                return {"ok": True, "integration": "cloudinary", "dev_mode": True,
                        "note": "Dev mode active — uploads go to local disk. Toggle dev_mode off to test real keys."}
            if not cloudinary_service._has_credentials():
                raise HTTPException(400, "Cloudinary keys missing")
            cloudinary_service._configure_sdk()
            import cloudinary.api  # type: ignore
            info = cloudinary.api.ping()
            return {"ok": True, "integration": "cloudinary", "dev_mode": False,
                    "provider_response": info}

        if integration == "razorpay":
            from services import razorpay_service
            order = razorpay_service.create_order(100, receipt=f"admin-test-{user.id[:6]}",
                                                   notes={"purpose": "admin_test"})
            return {"ok": True, "integration": "razorpay",
                    "dev_mode": razorpay_service.is_dev_mode(),
                    "order": {"id": order.get("id"), "amount": order.get("amount"),
                              "status": order.get("status"), "mock": order.get("mock", False)}}

        # fcm
        from services import fcm_service
        if integration == "fcm":
            if fcm_service._dev_mode():
                return {"ok": True, "integration": "fcm", "dev_mode": True,
                        "note": "Dev mode active — pushes are log-only. Toggle dev_mode off to init firebase-admin."}
            app_obj = fcm_service._get_firebase_app()
            if not app_obj:
                raise HTTPException(400, "firebase-admin init failed (check service_account_json)")
            return {"ok": True, "integration": "fcm", "dev_mode": False,
                    "project_id": getattr(app_obj, "project_id", None) or "initialized"}

        # ai_content
        from services import ai_content_service
        res = await ai_content_service.ping()
        return {"integration": "ai_content", **res}

    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "integration": integration, "error": str(exc)[:400]}


# (marker removed)
