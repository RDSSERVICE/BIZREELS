"""Chat threads + messages service."""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from database import get_db
from models.phase3 import ChatThread, ChatMessage


def _t(d: dict) -> dict:
    if not d:
        return d
    out = dict(d)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    if out.get("context_id"):
        out["context_id"] = str(out["context_id"])
    return out


def _m(d: dict) -> dict:
    if not d:
        return d
    out = dict(d)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    for k in ("thread_id", "sender_id", "receiver_id", "shared_listing_id"):
        if out.get(k):
            out[k] = str(out[k])
    out.pop("is_deleted", None)
    return out


async def get_or_create_thread(user_a: str, user_b: str, thread_type: str, context_id: str | None) -> dict:
    if user_a == user_b:
        raise HTTPException(400, "Cannot chat with yourself")
    if thread_type not in ("listing", "requirement", "direct"):
        raise HTTPException(400, "Invalid thread_type")
    if thread_type != "direct" and not context_id:
        raise HTTPException(400, "context_id required for typed threads")
    db = get_db()
    participants = sorted([user_a, user_b])
    q = {"participants": participants, "thread_type": thread_type, "context_id": context_id}
    existing = await db.chat_threads.find_one(q)
    if existing:
        return _t(existing)
    t = ChatThread(participants=participants, thread_type=thread_type, context_id=context_id, unread_count={user_a: 0, user_b: 0})
    doc = t.to_mongo()
    res = await db.chat_threads.insert_one(doc)
    doc["_id"] = res.inserted_id
    # Emit chat_start event for listing threads (analytics)
    if thread_type == "listing" and context_id:
        try:
            from services import event_service
            await event_service.emit(
                listing_id=context_id, vendor_id=None,
                event_type="chat_start", user_id=user_a,
                meta={"thread_id": str(res.inserted_id)},
            )
        except Exception:  # noqa: BLE001
            pass
    return _t(doc)


async def list_my_threads(user_id: str) -> list[dict]:
    db = get_db()
    docs = await db.chat_threads.find({"participants": user_id}).sort([("updated_at", -1)]).limit(100).to_list(100)
    ids = {p for d in docs for p in d["participants"]}
    ids.discard(user_id)
    users = await db.users.find({"_id": {"$in": [ObjectId(i) for i in ids if ObjectId.is_valid(i)]}}).to_list(len(ids)) if ids else []
    umap = {str(u["_id"]): u for u in users}
    out = []
    for d in docs:
        item = _t(d)
        peer_id = next((p for p in d["participants"] if p != user_id), None)
        peer = umap.get(peer_id, {})
        item["peer"] = {"id": peer_id, "name": peer.get("name"), "profile_pic": peer.get("profile_pic")}
        item["my_unread"] = (item.get("unread_count") or {}).get(user_id, 0)
        out.append(item)
    return out


async def get_thread(thread_id: str, user_id: str) -> dict:
    db = get_db()
    if not ObjectId.is_valid(thread_id):
        raise HTTPException(400, "Invalid thread id")
    doc = await db.chat_threads.find_one({"_id": ObjectId(thread_id)})
    if not doc or user_id not in doc.get("participants", []):
        raise HTTPException(404, "Thread not found")
    return _t(doc)


async def list_messages(thread_id: str, user_id: str, cursor: str | None = None, limit: int = 50) -> dict:
    db = get_db()
    _ = await get_thread(thread_id, user_id)
    q: dict = {"thread_id": thread_id, "is_deleted": {"$ne": True}}
    if cursor and ObjectId.is_valid(cursor):
        q["_id"] = {"$lt": ObjectId(cursor)}
    docs = await db.messages.find(q).sort([("_id", -1)]).limit(limit + 1).to_list(limit + 1)
    has_more = len(docs) > limit
    docs = docs[:limit]
    # Return newest-first here; frontend can reverse for display
    return {
        "items": [_m(d) for d in docs],
        "next_cursor": str(docs[-1]["_id"]) if has_more and docs else None,
        "has_more": has_more,
    }


async def send_message(thread_id: str, sender_id: str, body: dict) -> dict:
    db = get_db()
    thread = await db.chat_threads.find_one({"_id": ObjectId(thread_id)})
    if not thread or sender_id not in thread.get("participants", []):
        raise HTTPException(404, "Thread not found")
    receiver_id = next((p for p in thread["participants"] if p != sender_id), None)
    if not receiver_id:
        raise HTTPException(400, "No receiver in thread")

    now_iso = datetime.now(timezone.utc).isoformat()
    msg = ChatMessage(
        thread_id=thread_id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        type=body.get("type", "text"),
        text=body.get("text"),
        media=body.get("media"),
        shared_listing_id=body.get("shared_listing_id"),
        shared_location=body.get("shared_location"),
        quote=body.get("quote"),
    )
    doc = msg.to_mongo()
    res = await db.messages.insert_one(doc)
    doc["_id"] = res.inserted_id

    # Update thread meta
    preview = doc.get("text") or {"image": "📷 Photo", "video": "🎥 Video", "listing_card": "🛍️ Listing", "location": "📍 Location", "quote": "💰 Offer"}.get(doc["type"], "New message")
    unread = thread.get("unread_count") or {}
    unread[receiver_id] = int(unread.get(receiver_id, 0)) + 1
    await db.chat_threads.update_one(
        {"_id": ObjectId(thread_id)},
        {"$set": {
            "last_message": {
                "text": preview if isinstance(preview, str) else "New message",
                "sender_id": sender_id,
                "created_at": now_iso,
                "type": doc["type"],
            },
            "unread_count": unread,
            "updated_at": now_iso,
        }},
    )
    result = _m(doc)

    # Emit socket event (best-effort — service not always initialized in tests)
    try:
        from services.socket_service import sio, user_room
        await sio.emit("message:new", result, room=user_room(receiver_id))
        await sio.emit("message:new", result, room=user_room(sender_id))
    except Exception:  # noqa: BLE001
        pass

    # Response-time tracking: if this is sender's first reply to a pending
    # incoming from receiver, log the delta and update user stats. Fire-and-forget.
    try:
        import asyncio
        from services import response_time_service
        asyncio.create_task(response_time_service.maybe_track_response(
            thread_id=thread_id, sender_id=sender_id, receiver_id=receiver_id,
        ))
    except Exception:  # noqa: BLE001
        pass

    return result


async def mark_read(thread_id: str, user_id: str) -> dict:
    db = get_db()
    thread = await db.chat_threads.find_one({"_id": ObjectId(thread_id)})
    if not thread or user_id not in thread.get("participants", []):
        raise HTTPException(404, "Thread not found")
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.messages.update_many(
        {"thread_id": thread_id, "receiver_id": user_id, "read_at": None},
        {"$set": {"read_at": now_iso}},
    )
    unread = thread.get("unread_count") or {}
    unread[user_id] = 0
    await db.chat_threads.update_one({"_id": ObjectId(thread_id)}, {"$set": {"unread_count": unread}})
    # Emit read event
    try:
        from services.socket_service import sio, user_room
        peer_id = next((p for p in thread["participants"] if p != user_id), None)
        if peer_id:
            await sio.emit("message:read", {"thread_id": thread_id, "reader_id": user_id, "read_at": now_iso}, room=user_room(peer_id))
    except Exception:  # noqa: BLE001
        pass
    return {"ok": True}


async def toggle_archive(thread_id: str, user_id: str) -> dict:
    db = get_db()
    thread = await db.chat_threads.find_one({"_id": ObjectId(thread_id)})
    if not thread or user_id not in thread.get("participants", []):
        raise HTTPException(404, "Thread not found")
    arch = thread.get("is_archived_by") or {}
    arch[user_id] = not bool(arch.get(user_id, False))
    await db.chat_threads.update_one({"_id": ObjectId(thread_id)}, {"$set": {"is_archived_by": arch}})
    return {"archived": arch[user_id]}


async def unread_total(user_id: str) -> int:
    db = get_db()
    threads = await db.chat_threads.find(
        {"participants": user_id},
        {"unread_count": 1},
    ).to_list(500)
    return sum(int((t.get("unread_count") or {}).get(user_id, 0)) for t in threads)
