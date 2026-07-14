"""Auth service: OTP flow, user creation, token issuance."""
from __future__ import annotations
import hmac
import logging
import os
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from fastapi import HTTPException, status

from database import get_db
from models.user import User
from models.otp import OtpRequest
from models.token import RefreshToken
from utils.otp_utils import generate_otp, hash_otp
from utils.jwt_utils import (
    create_access_token,
    create_refresh_token_pair,
    hash_refresh_token,
)
from services.msg91_service import send_otp_sms, is_dev_mode, Msg91ConfigError

logger = logging.getLogger(__name__)

OTP_TTL_MINUTES = 5
MAX_OTP_ATTEMPTS = 5
VALID_ROLES = {"customer", "vendor", "creator"}  # admin only via seed


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "phone": user.phone,
        "name": user.name,
        "email": user.email,
        "roles": user.roles,
        "current_role": user.current_role,
        "kyc_status": user.kyc_status,
        "profile_pic": user.profile_pic,
        "gender": user.gender,
        "dob": user.dob,
        "is_active": user.is_active,
        # Phase 4a additions
        "is_subscribed_verified": bool(getattr(user, "is_subscribed_verified", False)),
        "verified_badge": bool(getattr(user, "is_subscribed_verified", False)) and user.kyc_status == "approved",
        "rating_avg": getattr(user, "rating_avg", 0.0),
        "rating_count": getattr(user, "rating_count", 0),
        "trust_score": getattr(user, "trust_score", None),
        "city": getattr(user, "city", None),
        # Phase 5 additions
        "referral_code": getattr(user, "referral_code", None),
        "avg_response_time_seconds": getattr(user, "avg_response_time_seconds", None),
        "chat_response_rate": getattr(user, "chat_response_rate", 0.0),
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


def _validate_phone(phone: str) -> str:
    p = phone.strip()
    if not p.isdigit() or len(p) != 10 or p[0] not in "6789":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Indian phone number. Provide a 10-digit number starting 6-9.",
        )
    return p


async def request_otp(phone: str) -> dict:
    """Generate OTP, persist hash + TTL, send via MSG91 (or mock)."""
    phone = _validate_phone(phone)
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)

    doc = OtpRequest(
        phone=phone,
        otp_hash=hash_otp(otp),
        purpose="login",
        expires_at=expires_at,
    ).to_mongo()

    db = get_db()
    # Invalidate previous unverified OTPs for this phone
    await db.otp_requests.delete_many({"phone": phone, "verified": False})
    await db.otp_requests.insert_one(doc)

    try:
        await send_otp_sms(phone, otp)
    except Msg91ConfigError as exc:
        logger.exception("MSG91 not configured and dev mode disabled")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMS service temporarily unavailable. Please try again later.",
        ) from exc

    response = {
        "success": True,
        "message": "OTP sent successfully",
        "expires_in_seconds": OTP_TTL_MINUTES * 60,
    }
    # SEC-001: dev_otp is echoed ONLY when dev mode is on AND the phone is NOT
    # an admin phone. Admin logins always require reading the OTP from server
    # logs (or a real SMS in prod). This closes the "hard-coded admin phone +
    # public dev_otp = account takeover" vector.
    if is_dev_mode():
        response["dev_mode"] = True
        from services import admin_phone_service
        if not admin_phone_service.is_otp_hidden(phone):
            response["dev_otp"] = otp
        else:
            response["dev_otp_hidden"] = True  # tell the client to check logs
            logger.info("[MSG91 DEV MODE] Admin OTP for %s: %s (not echoed to HTTP client)", phone, otp)
    return response


async def verify_otp_and_login(
    phone: str, otp: str, name: str | None = None, roles: list[str] | None = None,
    referral_code: str | None = None,
) -> dict:
    phone = _validate_phone(phone)
    db = get_db()

    record = await db.otp_requests.find_one(
        {"phone": phone, "verified": False},
        sort=[("created_at", -1)],
    )
    if not record:
        raise HTTPException(400, "OTP not requested or already used")

    expires_at = record.get("expires_at")
    if isinstance(expires_at, datetime):
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(400, "OTP expired")

    if record.get("attempts", 0) >= MAX_OTP_ATTEMPTS:
        raise HTTPException(429, "Too many OTP attempts. Please request a new OTP.")

    if not hmac.compare_digest(hash_otp(otp), record["otp_hash"]):
        await db.otp_requests.update_one(
            {"_id": record["_id"]}, {"$inc": {"attempts": 1}}
        )
        raise HTTPException(400, "Invalid OTP")

    # Mark verified
    await db.otp_requests.update_one(
        {"_id": record["_id"]}, {"$set": {"verified": True}}
    )

    # Sanitise roles input
    clean_roles: list[str] = []
    if roles:
        for r in roles:
            if r in VALID_ROLES and r not in clean_roles:
                clean_roles.append(r)
    if not clean_roles:
        clean_roles = ["customer"]

    # Upsert user. Look up BY PHONE without the is_deleted filter so that a
    # previously soft-deleted user (e.g., purged test/demo account whose phone
    # is now being re-signed-up) is revived in place instead of colliding with
    # the unique-phone index.
    user_doc = await db.users.find_one({"phone": phone})
    now_iso = datetime.now(timezone.utc).isoformat()
    if user_doc is None:
        new_user = User(
            phone=phone,
            name=name,
            roles=clean_roles,  # type: ignore[arg-type]
            current_role=clean_roles[0],  # type: ignore[arg-type]
        )
        insert_doc = new_user.to_mongo()
        result = await db.users.insert_one(insert_doc)
        user_doc = await db.users.find_one({"_id": result.inserted_id})
        # Signup bonus: +50 credits, idempotent-per-user (wallet is created fresh)
        try:
            from services import wallet_service
            await wallet_service.earn_credits(
                str(result.inserted_id),
                wallet_service.CREDIT_RULES["signup"],
                "Welcome bonus", "signup", str(result.inserted_id),
            )
        except Exception:  # noqa: BLE001
            logger.exception("Signup bonus credit failed for user %s", result.inserted_id)
        # Generate referral_code + claim if referral_code was passed
        try:
            from services import referral_service
            await referral_service.ensure_code(str(result.inserted_id))
            if referral_code:
                await referral_service.claim_on_signup(str(result.inserted_id), referral_code)
        except Exception:  # noqa: BLE001
            logger.exception("Referral setup failed for user %s", result.inserted_id)
        user_doc = await db.users.find_one({"_id": result.inserted_id})
    else:
        # Existing user: revive if previously soft-deleted (purge or self-delete)
        # and optionally set name if not set and provided.
        updates: dict = {"updated_at": now_iso}
        if user_doc.get("is_deleted"):
            updates["is_deleted"] = False
            updates["is_active"] = True
            updates["is_test_data"] = False
        if name and not user_doc.get("name"):
            updates["name"] = name
        if updates:
            await db.users.update_one({"_id": user_doc["_id"]}, {"$set": updates})
            user_doc = await db.users.find_one({"_id": user_doc["_id"]})

    user = User.from_mongo(user_doc)
    tokens = await issue_tokens(user)

    await db.audit_logs.insert_one({
        "user_id": user.id,
        "action": "login",
        "meta": {"phone": phone},
        "created_at": now_iso,
    })

    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
        "user": _serialize_user(user),
    }


async def issue_tokens(user: User) -> dict:
    db = get_db()
    access = create_access_token(user.id, user.roles, user.current_role)
    raw, token_hash, expires_at = create_refresh_token_pair(user.id)
    rt = RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    await db.refresh_tokens.insert_one(rt.to_mongo())
    return {"access_token": access, "refresh_token": raw}


async def refresh_access_token(refresh_token: str) -> dict:
    """Rotate refresh tokens on every /refresh call.

    - Presented token must exist and be non-revoked.
    - On success: revoke the old token, mint a new access + new refresh token pair.
    - Reuse detection: if a client presents an already-revoked (but not yet expired)
      refresh token, treat as compromise and revoke ALL refresh tokens for that user.
    """
    db = get_db()
    token_hash = hash_refresh_token(refresh_token)
    rec = await db.refresh_tokens.find_one({"token_hash": token_hash})
    if not rec:
        raise HTTPException(401, "Invalid refresh token")

    expires_at = rec.get("expires_at")
    if isinstance(expires_at, datetime):
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(401, "Refresh token expired")

    if rec.get("revoked"):
        # Reuse attack — burn the whole family
        await db.refresh_tokens.update_many(
            {"user_id": rec["user_id"], "revoked": False},
            {"$set": {"revoked": True}},
        )
        await db.audit_logs.insert_one({
            "user_id": rec["user_id"],
            "action": "refresh_reuse_detected",
            "meta": {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        raise HTTPException(401, "Refresh token reuse detected. Please sign in again.")

    user_doc = await db.users.find_one({"_id": ObjectId(rec["user_id"])})
    if not user_doc or user_doc.get("is_deleted"):
        raise HTTPException(401, "User not found")

    # Rotate: revoke old, issue new pair
    await db.refresh_tokens.update_one({"_id": rec["_id"]}, {"$set": {"revoked": True}})
    user = User.from_mongo(user_doc)
    new_tokens = await issue_tokens(user)
    return {
        "access_token": new_tokens["access_token"],
        "refresh_token": new_tokens["refresh_token"],
        "token_type": "bearer",
    }


async def revoke_refresh_token(refresh_token: str) -> None:
    db = get_db()
    token_hash = hash_refresh_token(refresh_token)
    await db.refresh_tokens.update_one(
        {"token_hash": token_hash}, {"$set": {"revoked": True}}
    )


async def seed_admin_user() -> None:
    """Backwards-compat wrapper — delegated to admin_phone_service.ensure_admin_seed."""
    from services import admin_phone_service
    await admin_phone_service.ensure_admin_seed()
