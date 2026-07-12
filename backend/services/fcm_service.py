"""FCM push service — v1 HTTP API stub. Dev mode logs; real path uses firebase-admin.

FCM keys required from user — currently in DEV MODE (`FCM_DEV_MODE=true`).
Real: set `FIREBASE_SERVICE_ACCOUNT_JSON` to path or inline JSON and drop `FCM_DEV_MODE`.
"""
from __future__ import annotations
import json
import logging
import os
from datetime import datetime, timezone
from bson import ObjectId

from database import get_db

logger = logging.getLogger(__name__)

_fb_app = None


def _dev_mode() -> bool:
    return os.environ.get("FCM_DEV_MODE", "true").lower() in ("1", "true", "yes")


def _get_firebase_app():
    """Lazy-load firebase-admin. Returns None if not configured."""
    global _fb_app
    if _fb_app is not None:
        return _fb_app
    if _dev_mode():
        return None
    cfg = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if not cfg:
        return None
    try:
        import firebase_admin  # type: ignore
        from firebase_admin import credentials  # type: ignore
        if cfg.startswith("{"):
            cred = credentials.Certificate(json.loads(cfg))
        else:
            cred = credentials.Certificate(cfg)
        _fb_app = firebase_admin.initialize_app(cred)
        return _fb_app
    except Exception as e:  # noqa: BLE001
        logger.warning("firebase-admin init failed: %s — falling back to dev log mode", e)
        return None


async def register_token(user_id: str, token: str, platform: str) -> dict:
    if platform not in ("web", "android", "ios"):
        platform = "web"
    if not token or len(token) > 4096:
        return {"ok": False, "reason": "invalid_token"}
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    # dedup by token (upsert entry into user.fcm_tokens[])
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"fcm_tokens": {"token": token}}},
    )
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"fcm_tokens": {"token": token, "platform": platform, "added_at": now_iso}}},
    )
    return {"ok": True}


async def remove_token(user_id: str, token: str) -> dict:
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"fcm_tokens": {"token": token}}},
    )
    return {"ok": True}


async def _user_tokens(user_id: str) -> list[str]:
    db = get_db()
    u = await db.users.find_one({"_id": ObjectId(user_id)}, {"fcm_tokens": 1})
    if not u:
        return []
    return [t.get("token") for t in (u.get("fcm_tokens") or []) if t.get("token")]


async def send_push(user_id: str, title: str, body: str, data: dict | None = None) -> dict:
    data = data or {}
    tokens = await _user_tokens(user_id)
    if _dev_mode() or not _get_firebase_app():
        logger.info("[FCM DEV] push user=%s tokens=%d title=%r body=%r data=%s",
                    user_id, len(tokens), title, body, data)
        return {"ok": True, "dev": True, "tokens": len(tokens)}
    # Real path: send via firebase-admin messaging
    try:
        from firebase_admin import messaging  # type: ignore
        if not tokens:
            return {"ok": True, "sent": 0}
        msg = messaging.MulticastMessage(
            tokens=tokens,
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
        )
        res = messaging.send_multicast(msg)
        return {"ok": True, "sent": res.success_count, "failed": res.failure_count}
    except Exception as e:  # noqa: BLE001
        logger.warning("FCM send failed: %s", e)
        return {"ok": False, "error": str(e)}
