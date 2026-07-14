"""User routes: profile CRUD, role switch, add role."""
from __future__ import annotations
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Literal

from database import get_db
from middleware.auth_middleware import require_auth
from services import user_service, phase4_service, follow_service

router = APIRouter(prefix="/v1/users", tags=["users"])

Role = Literal["customer", "vendor", "creator", "admin"]


class ProfileUpdateBody(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    profile_pic: str | None = None
    gender: str | None = None
    dob: str | None = None
    current_role: Role | None = None
    city: str | None = None


class RoleBody(BaseModel):
    role: Role


@router.get("/me")
async def get_me(user=Depends(require_auth)):
    # Lazy-reconcile is_subscribed_verified against actual sub expiry.
    try:
        current = bool(getattr(user, "is_subscribed_verified", False))
        active = await phase4_service._has_active_verified_sub(user.id)
        if current != active:
            db = get_db()
            await db.users.update_one(
                {"_id": ObjectId(user.id)},
                {"$set": {"is_subscribed_verified": active}},
            )
            user.is_subscribed_verified = active
    except Exception:  # noqa: BLE001
        pass
    return {"user": user_service.serialize(user)}


@router.patch("/me")
async def update_me(body: ProfileUpdateBody, user=Depends(require_auth)):
    updated = await user_service.update_profile(user.id, body.model_dump(exclude_none=True))
    return {"user": user_service.serialize(updated)}


@router.post("/me/switch-role")
async def switch_role(body: RoleBody, user=Depends(require_auth)):
    updated = await user_service.switch_role(user.id, body.role)
    return {"user": user_service.serialize(updated)}


@router.post("/me/add-role")
async def add_role(body: RoleBody, user=Depends(require_auth)):
    updated = await user_service.add_role(user.id, body.role)
    return {"user": user_service.serialize(updated)}


# ============= Phase 4b: FCM Tokens =============
from pydantic import BaseModel as _BM


class FcmTokenBody(_BM):
    token: str
    platform: Literal["web", "android", "ios"] = "web"


@router.post("/me/fcm-token")
async def register_fcm_token(body: FcmTokenBody, user=Depends(require_auth)):
    from services import fcm_service
    if not body.token or len(body.token) < 10:
        raise HTTPException(400, "Invalid token")
    return await fcm_service.register_token(user.id, body.token, body.platform)


@router.delete("/me/fcm-token/{token}")
async def remove_fcm_token(token: str, user=Depends(require_auth)):
    from services import fcm_service
    return await fcm_service.remove_token(user.id, token)


@router.get("/me/role-activity")
async def get_role_activity(user=Depends(require_auth)):
    """Return unread counters per role so RoleSwitcherChip can show a dot
    when the OTHER role has pending activity."""
    db = get_db()
    uid = str(user.id)
    out: dict = {"current_role": user.current_role, "roles": user.roles or []}
    # Vendor-side unread: chat threads where user is vendor
    if "vendor" in (user.roles or []):
        out["vendor"] = {
            "chat_unread": await db.messages.count_documents({
                "thread_id": {"$in": [str(t["_id"]) async for t in db.chat_threads.find(
                    {"vendor_id": uid, "is_deleted": {"$ne": True}}, {"_id": 1})]},
                "sender_id": {"$ne": uid},
                "read_by": {"$ne": uid},
            }),
            "pending_deals": await db.deals.count_documents({
                "vendor_id": uid, "status": "negotiating", "is_deleted": {"$ne": True},
            }),
        }
    if "customer" in (user.roles or []):
        out["customer"] = {
            "chat_unread": await db.messages.count_documents({
                "thread_id": {"$in": [str(t["_id"]) async for t in db.chat_threads.find(
                    {"customer_id": uid, "is_deleted": {"$ne": True}}, {"_id": 1})]},
                "sender_id": {"$ne": uid},
                "read_by": {"$ne": uid},
            }),
        }
    if "creator" in (user.roles or []):
        out["creator"] = {
            "open_requirements": await db.requirements.count_documents({
                "status": "open", "is_deleted": {"$ne": True},
            }),
        }
    return out




# Public read-only profile: safe fields only. NO phone/email/dob/full KYC.
@router.get("/{user_id}")
async def get_public_profile(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user id")
    db = get_db()
    u = await db.users.find_one({"_id": ObjectId(user_id), "is_deleted": {"$ne": True}})
    if not u:
        raise HTTPException(404, "User not found")
    is_sub = bool(u.get("is_subscribed_verified"))
    kyc = u.get("kyc_status", "unverified")
    try:
        followers = await follow_service.followers_count(user_id)
    except Exception:  # noqa: BLE001
        followers = 0
    tier = None
    try:
        ts = await phase4_service.trust_score(user_id)
        tier = ts.get("tier")
    except Exception:  # noqa: BLE001
        tier = None
    return {
        "id": str(u["_id"]),
        "name": u.get("name"),
        "roles": u.get("roles", []),
        "profile_pic": u.get("profile_pic"),
        "city": u.get("city"),
        "kyc_status": kyc,
        "is_subscribed_verified": is_sub,
        "verified_badge": is_sub and kyc == "approved",
        "rating_avg": u.get("rating_avg", 0.0),
        "rating_count": u.get("rating_count", 0),
        "followers_count": followers,
        "trust_score_tier": tier,
        "created_at": u.get("created_at"),
    }
