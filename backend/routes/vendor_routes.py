"""Public vendor profile + follower count routes."""
from __future__ import annotations
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request
import jwt

from database import get_db
from services import follow_service, listing_service
from utils.jwt_utils import decode_access_token

router = APIRouter(prefix="/v1/vendors", tags=["vendors"])


async def _optional_user_id(request: Request) -> str | None:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        return None
    try:
        payload = decode_access_token(auth.split(None, 1)[1])
        return payload.get("sub") if payload.get("type") == "access" else None
    except jwt.InvalidTokenError:
        return None


@router.get("/{user_id}")
async def get_vendor(user_id: str, request: Request):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user id")
    db = get_db()
    u = await db.users.find_one({"_id": ObjectId(user_id), "is_deleted": {"$ne": True}})
    if not u:
        raise HTTPException(404, "User not found")

    followers_count = await follow_service.followers_count(user_id)
    viewer_id = await _optional_user_id(request)
    following = False
    if viewer_id and viewer_id != user_id:
        following = await follow_service.is_following(viewer_id, user_id)

    listings_count = await db.listings.count_documents({
        "vendor_id": user_id, "is_deleted": {"$ne": True}, "status": "active",
    })

    return {
        "id": str(u["_id"]),
        "name": u.get("name"),
        "profile_pic": u.get("profile_pic"),
        "roles": u.get("roles", []),
        "kyc_status": u.get("kyc_status", "unverified"),
        "phone": u.get("phone") if u.get("phone") else None,
        "followers_count": followers_count,
        "listings_count": listings_count,
        "viewer_following": following,
        # Phase 4a/5 additions
        "is_subscribed_verified": bool(u.get("is_subscribed_verified")),
        "verified_badge": bool(u.get("is_subscribed_verified")) and u.get("kyc_status") == "approved",
        "rating_avg": u.get("rating_avg", 0.0),
        "rating_count": u.get("rating_count", 0),
        "trust_score": u.get("trust_score"),
        "city": u.get("city"),
        "avg_response_time_seconds": u.get("avg_response_time_seconds"),
        "chat_response_rate": u.get("chat_response_rate", 0.0),
    }


@router.get("/{user_id}/listings")
async def get_vendor_listings(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user id")
    return {"items": await listing_service.list_by_vendor(user_id, include_inactive=False)}


@router.get("/{user_id}/followers/count")
async def get_followers_count(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user id")
    return {"count": await follow_service.followers_count(user_id)}


@router.get("/leaderboard/fast-responders")
async def leaderboard_fast_responders(city: str | None = None, limit: int = 10):
    """Public leaderboard — vendors with fastest response times who reply >70% within 24h."""
    limit = max(1, min(50, limit))
    db = get_db()
    q: dict = {
        "roles": "vendor", "is_deleted": {"$ne": True}, "is_banned": {"$ne": True},
        "chat_response_rate": {"$gte": 0.7},
        "avg_response_time_seconds": {"$gt": 0, "$ne": None},
    }
    if city:
        q["city"] = {"$regex": f"^{city}$", "$options": "i"}
    docs = await db.users.find(q).sort([
        ("avg_response_time_seconds", 1), ("chat_response_rate", -1),
    ]).limit(limit).to_list(limit)
    items = []
    for u in docs:
        ts = u.get("trust_score") or 0
        tier = "newcomer" if ts < 30 else "trusted" if ts < 60 else "top-rated" if ts < 85 else "elite"
        items.append({
            "id": str(u["_id"]),
            "name": u.get("name"),
            "profile_pic": u.get("profile_pic"),
            "city": u.get("city"),
            "avg_response_time_seconds": u.get("avg_response_time_seconds"),
            "chat_response_rate": u.get("chat_response_rate", 0.0),
            "trust_score": ts,
            "trust_score_tier": tier,
        })
    return {"city": city, "items": items}
