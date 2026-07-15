"""Onboarding checklist — 5-step vendor onboarding, +30 credits when complete."""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from bson import ObjectId

from database import get_db

logger = logging.getLogger(__name__)

BONUS_CREDITS = 30


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def compute_state(user_id: str) -> dict:
    db = get_db()
    u = await db.users.find_one({"_id": ObjectId(user_id)})
    if not u:
        return {"steps": [], "completed": 0, "total": 3, "reward_granted": False}

    has_pic = bool(u.get("profile_pic"))
    has_city = bool(u.get("city"))
    # verification is done if ANY kyc_document is approved (multi-type support).
    verified_count = await db.kyc_documents.count_documents({
        "user_id": user_id, "status": "approved", "is_deleted": {"$ne": True},
    })
    kyc_ok = verified_count > 0 or u.get("kyc_status") == "approved"
    all_done = has_pic and has_city and kyc_ok
    reward_granted = bool(u.get("has_received_profile_complete_bonus"))

    steps = [
        {"key": "profile_pic", "label": "Add a profile picture", "done": has_pic},
        {"key": "city", "label": "Add your city", "done": has_city},
        {"key": "verification", "label": "Verify at least one ID", "done": kyc_ok},
    ]
    completed = sum(1 for s in steps if s["done"])
    return {
        "steps": steps,
        "completed": completed,
        "total": len(steps),
        "all_done": all_done,
        "reward_granted": reward_granted,
        "reward_credits": BONUS_CREDITS,
    }


async def maybe_grant_bonus(user_id: str) -> dict:
    """Awards +30 credits if all 3 steps done and not previously granted. Idempotent."""
    state = await compute_state(user_id)
    if not state["all_done"] or state["reward_granted"]:
        return state
    db = get_db()
    marker = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id), "has_received_profile_complete_bonus": {"$ne": True}},
        {"$set": {"has_received_profile_complete_bonus": True, "updated_at": _now_iso()}},
    )
    if not marker:
        return await compute_state(user_id)
    try:
        from services import wallet_service, notification_service
        await wallet_service.earn_credits(
            user_id, BONUS_CREDITS,
            "Profile completion bonus", "profile_complete", user_id,
        )
        await notification_service.create(
            user_id=user_id, type_="reward",
            title=f"+{BONUS_CREDITS} profile bonus!",
            body="You've completed all onboarding steps.",
            action_url="/wallet",
        )
    except Exception:  # noqa: BLE001
        logger.exception("profile-complete bonus grant failed")
    return await compute_state(user_id)
