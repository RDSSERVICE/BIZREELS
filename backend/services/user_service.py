"""User profile + role management service."""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from database import get_db
from models.user import User

VALID_ROLES = {"customer", "vendor", "creator"}  # admin only via seed


async def get_user_by_id(user_id: str) -> User | None:
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(user_id), "is_deleted": {"$ne": True}})
    return User.from_mongo(doc)


async def update_profile(user_id: str, updates: dict) -> User:
    db = get_db()
    allowed = {"name", "email", "profile_pic", "gender", "dob", "current_role", "city"}
    clean = {k: v for k, v in updates.items() if k in allowed and v is not None}
    if not clean:
        raise HTTPException(400, "No updatable fields provided")

    if "current_role" in clean:
        user = await get_user_by_id(user_id)
        if not user or clean["current_role"] not in user.roles:
            raise HTTPException(400, "current_role must be one of the user's roles")

    clean["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": clean})
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    return User.from_mongo(doc)


async def switch_role(user_id: str, role: str) -> User:
    if role not in VALID_ROLES and role != "admin":
        raise HTTPException(400, f"Invalid role: {role}")
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if role not in user.roles:
        raise HTTPException(400, "You don't have this role. Add it first.")
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"current_role": role, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    return User.from_mongo(doc)


async def add_role(user_id: str, role: str) -> User:
    if role not in VALID_ROLES:
        raise HTTPException(400, f"Invalid role: {role}. Allowed: {sorted(VALID_ROLES)}")
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if role in user.roles:
        return user
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$addToSet": {"roles": role},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
        },
    )
    doc = await db.users.find_one({"_id": ObjectId(user_id)})
    return User.from_mongo(doc)


def serialize(user: User) -> dict:
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
        "is_subscribed_verified": bool(user.is_subscribed_verified),
        "verified_badge": bool(user.is_subscribed_verified) and user.kyc_status == "approved",
        "rating_avg": user.rating_avg,
        "rating_count": user.rating_count,
        "trust_score": user.trust_score,
        "city": user.city,
        # Phase 5 additions
        "referral_code": getattr(user, "referral_code", None),
        "avg_response_time_seconds": getattr(user, "avg_response_time_seconds", None),
        "chat_response_rate": getattr(user, "chat_response_rate", 0.0),
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }
