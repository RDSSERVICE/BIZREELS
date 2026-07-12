"""Follow service — vendor/user follows."""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from database import get_db


async def follow(follower_id: str, following_id: str) -> dict:
    if follower_id == following_id:
        raise HTTPException(400, "You can't follow yourself")
    db = get_db()
    if not ObjectId.is_valid(following_id):
        raise HTTPException(400, "Invalid user id")
    target = await db.users.find_one({"_id": ObjectId(following_id), "is_deleted": {"$ne": True}})
    if not target:
        raise HTTPException(404, "User not found")
    now = datetime.now(timezone.utc).isoformat()
    await db.follows.update_one(
        {"follower_id": follower_id, "following_id": following_id},
        {"$setOnInsert": {
            "follower_id": follower_id,
            "following_id": following_id,
            "following_type": "user",
            "created_at": now,
        }},
        upsert=True,
    )
    count = await db.follows.count_documents({"following_id": following_id})
    return {"following": True, "followers_count": count}


async def unfollow(follower_id: str, following_id: str) -> dict:
    db = get_db()
    await db.follows.delete_one({"follower_id": follower_id, "following_id": following_id})
    count = await db.follows.count_documents({"following_id": following_id})
    return {"following": False, "followers_count": count}


async def is_following(follower_id: str, following_id: str) -> bool:
    db = get_db()
    doc = await db.follows.find_one({"follower_id": follower_id, "following_id": following_id})
    return bool(doc)


async def following_ids(follower_id: str) -> list[str]:
    db = get_db()
    return [f["following_id"] async for f in db.follows.find({"follower_id": follower_id})]


async def followers_count(user_id: str) -> int:
    db = get_db()
    return await db.follows.count_documents({"following_id": user_id})


async def my_following(follower_id: str) -> list[dict]:
    db = get_db()
    follows = await db.follows.find({"follower_id": follower_id}).to_list(500)
    ids = [ObjectId(f["following_id"]) for f in follows]
    if not ids:
        return []
    users = await db.users.find({"_id": {"$in": ids}, "is_deleted": {"$ne": True}}).to_list(500)
    return [{
        "id": str(u["_id"]),
        "name": u.get("name"),
        "profile_pic": u.get("profile_pic"),
        "roles": u.get("roles", []),
    } for u in users]
