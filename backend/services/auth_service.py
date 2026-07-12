"""Auth service: OTP flow, user creation, token issuance."""
from __future__ import annotations
import logging
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
    decode_access_token,
)
from services.msg91_service import send_otp_sms

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

    provider = await send_otp_sms(phone, otp)

    response = {
        "success": True,
        "message": "OTP sent successfully",
        "expires_in_seconds": OTP_TTL_MINUTES * 60,
    }
    if provider.get("mock"):
        response["dev_otp"] = otp
        response["dev_mode"] = True
    return response


async def verify_otp_and_login(
    phone: str, otp: str, name: str | None = None, roles: list[str] | None = None
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

    if hash_otp(otp) != record["otp_hash"]:
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

    # Upsert user
    user_doc = await db.users.find_one({"phone": phone, "is_deleted": {"$ne": True}})
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
    else:
        # Existing user: optionally update name if not set and provided
        updates: dict = {"updated_at": now_iso}
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
    db = get_db()
    token_hash = hash_refresh_token(refresh_token)
    rec = await db.refresh_tokens.find_one({"token_hash": token_hash, "revoked": False})
    if not rec:
        raise HTTPException(401, "Invalid or revoked refresh token")

    expires_at = rec.get("expires_at")
    if isinstance(expires_at, datetime):
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(401, "Refresh token expired")

    user_doc = await db.users.find_one({"_id": ObjectId(rec["user_id"])})
    if not user_doc or user_doc.get("is_deleted"):
        raise HTTPException(401, "User not found")

    user = User.from_mongo(user_doc)
    new_access = create_access_token(user.id, user.roles, user.current_role)
    return {"access_token": new_access, "token_type": "bearer"}


async def revoke_refresh_token(refresh_token: str) -> None:
    db = get_db()
    token_hash = hash_refresh_token(refresh_token)
    await db.refresh_tokens.update_one(
        {"token_hash": token_hash}, {"$set": {"revoked": True}}
    )


async def seed_admin_user() -> None:
    db = get_db()
    existing = await db.users.find_one({"phone": "9999999999"})
    if existing:
        return
    admin = User(
        phone="9999999999",
        name="Admin",
        roles=["admin", "customer"],
        current_role="admin",
    )
    await db.users.insert_one(admin.to_mongo())
    logger.info("Seeded admin user with phone 9999999999")
