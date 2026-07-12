"""Chat response-time tracking. Updates avg + chat_response_rate on the vendor user."""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from bson import ObjectId

from database import get_db

logger = logging.getLogger(__name__)

RESPONSE_WINDOW_HOURS = 24  # counts as "responded" if reply within 24h


def _parse(dt_str: str) -> datetime | None:
    try:
        return datetime.fromisoformat(str(dt_str).replace("Z", "+00:00"))
    except Exception:  # noqa: BLE001
        return None


async def maybe_track_response(*, thread_id: str, sender_id: str, receiver_id: str) -> None:
    """Called on every message send. If this is `sender_id`'s FIRST reply to a message
    from `receiver_id` in this thread, log the delta and update user's rolling avg.
    Fire-and-forget: never blocks send_message.
    """
    try:
        db = get_db()
        # Find the earliest UNANSWERED-by-me message from receiver, i.e. the first
        # message from receiver where no later message by me exists prior to now.
        # Simple heuristic: earliest message from receiver in this thread whose
        # id is greater than the last message by me (if any) BEFORE this send.
        my_prior_ids = await db.messages.find(
            {"thread_id": thread_id, "sender_id": sender_id, "is_deleted": {"$ne": True}}
        ).sort([("_id", -1)]).limit(2).to_list(2)
        # We just sent one — my_prior_ids[0] is the message we just wrote if same doc.
        # Get the SECOND-latest (if any) as boundary.
        boundary_id = my_prior_ids[1]["_id"] if len(my_prior_ids) > 1 else None

        q = {
            "thread_id": thread_id, "sender_id": receiver_id, "is_deleted": {"$ne": True},
        }
        if boundary_id:
            q["_id"] = {"$gt": boundary_id}
        first_incoming = await db.messages.find(q).sort([("_id", 1)]).limit(1).to_list(1)
        if not first_incoming:
            return  # No incoming waiting for reply — not a "response"
        arrived_at = _parse(first_incoming[0].get("created_at"))
        if not arrived_at:
            return
        reply_at = datetime.now(timezone.utc)
        delta_seconds = max(0, int((reply_at - arrived_at).total_seconds()))

        # De-dup guard: if we already logged a response for this incoming message id, skip.
        marker_id = str(first_incoming[0]["_id"])
        already = await db.response_events.find_one({
            "sender_id": sender_id, "for_message_id": marker_id,
        })
        if already:
            return

        await db.response_events.insert_one({
            "sender_id": sender_id,  # the responder
            "receiver_id": receiver_id,  # original message sender
            "thread_id": thread_id,
            "for_message_id": marker_id,
            "delta_seconds": delta_seconds,
            "within_24h": delta_seconds <= RESPONSE_WINDOW_HOURS * 3600,
            "created_at": reply_at.isoformat(),
        })

        # Recompute rolling stats for sender
        agg = await db.response_events.aggregate([
            {"$match": {"sender_id": sender_id}},
            {"$group": {"_id": None,
                        "n": {"$sum": 1},
                        "avg": {"$avg": "$delta_seconds"},
                        "within": {"$sum": {"$cond": ["$within_24h", 1, 0]}}}},
        ]).to_list(1)
        if agg:
            row = agg[0]
            n = int(row["n"])
            avg = int(row["avg"]) if row.get("avg") else 0
            rate = round(row["within"] / n, 3) if n else 0.0
            await db.users.update_one(
                {"_id": ObjectId(sender_id)},
                {"$set": {
                    "avg_response_time_seconds": avg,
                    "chat_response_rate": rate,
                    "total_conversations_responded": n,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }},
            )
    except Exception:  # noqa: BLE001
        logger.exception("response-time tracking failed (non-fatal)")


def human_response_time(seconds: int | None) -> str:
    if not seconds or seconds <= 0:
        return "New responder"
    if seconds < 60:
        return "Typically responds instantly"
    minutes = seconds // 60
    if minutes < 60:
        return f"Typically responds in ~{minutes}m"
    hours = round(minutes / 60, 1)
    if hours < 24:
        return f"Typically responds in ~{int(hours)}h" if hours == int(hours) else f"Typically responds in ~{hours}h"
    days = round(hours / 24, 1)
    return f"Typically responds in ~{days}d"
