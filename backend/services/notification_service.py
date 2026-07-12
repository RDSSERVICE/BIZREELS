"""In-app notifications + Socket.IO emit + FCM stub."""
from __future__ import annotations
import os
import logging
from datetime import datetime, timezone
from bson import ObjectId

from database import get_db

logger = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create(user_id: str, type_: str, title: str, body: str | None = None, data: dict | None = None, action_url: str | None = None) -> dict:
    db = get_db()
    doc = {
        "user_id": user_id, "type": type_, "title": title, "body": body,
        "data": data or {}, "action_url": action_url,
        "is_read": False, "read_at": None, "is_deleted": False, "created_at": _now(),
    }
    res = await db.notifications.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    # Emit via socket
    try:
        from services.socket_service import sio, user_room
        await sio.emit("notification:new", doc, room=user_room(user_id))
    except Exception:  # noqa: BLE001
        pass
    # FCM stub
    await send_push(user_id, title, body or "", data or {})
    return doc


async def list_mine(user_id: str, is_read: bool | None = None, cursor: str | None = None, limit: int = 30) -> dict:
    db = get_db()
    q: dict = {"user_id": user_id, "is_deleted": {"$ne": True}}
    if is_read is not None:
        q["is_read"] = is_read
    if cursor and ObjectId.is_valid(cursor):
        q["_id"] = {"$lt": ObjectId(cursor)}
    docs = await db.notifications.find(q).sort([("_id", -1)]).limit(limit + 1).to_list(limit + 1)
    has_more = len(docs) > limit
    docs = docs[:limit]
    for d in docs:
        d["id"] = str(d.pop("_id"))
        d.pop("is_deleted", None)
    return {"items": docs, "next_cursor": docs[-1]["id"] if has_more and docs else None, "has_more": has_more}


async def unread_count(user_id: str) -> int:
    db = get_db()
    return await db.notifications.count_documents({"user_id": user_id, "is_read": False, "is_deleted": {"$ne": True}})


async def mark_read(nid: str, user_id: str) -> None:
    db = get_db()
    await db.notifications.update_one(
        {"_id": ObjectId(nid), "user_id": user_id},
        {"$set": {"is_read": True, "read_at": _now()}},
    )


async def mark_all_read(user_id: str) -> None:
    db = get_db()
    await db.notifications.update_many({"user_id": user_id, "is_read": False}, {"$set": {"is_read": True, "read_at": _now()}})


async def dismiss(nid: str, user_id: str) -> None:
    db = get_db()
    await db.notifications.update_one({"_id": ObjectId(nid), "user_id": user_id}, {"$set": {"is_deleted": True}})


# ---- FCM stub ----
async def send_push(user_id: str, title: str, body: str, data: dict) -> None:
    """FCM push stub. Real integration deferred to Phase 4b/5.

    FCM keys required from user — currently in DEV MODE with console-only push.
    """
    dev = os.environ.get("FCM_DEV_MODE", "true").lower() in ("1", "true", "yes")
    key = os.environ.get("FCM_SERVER_KEY", "").strip()
    if dev or not key:
        logger.info("[FCM DEV] push user=%s title=%s body=%s data=%s", user_id, title, body, data)
        return
    # Real FCM would go here. TODO(phase-4b): wire firebase-admin / http v1 API.
    logger.info("[FCM] send stub — real integration deferred")
