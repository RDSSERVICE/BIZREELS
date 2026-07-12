"""Socket.IO server: JWT auth on connect + presence tracking."""
from __future__ import annotations
import logging
import socketio
import jwt

from utils.jwt_utils import decode_access_token

logger = logging.getLogger(__name__)

# ASGI-mode server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

# ASGI app to mount at /socket.io
# ASGI app mounted at /api/socket.io (matches server.py mount + frontend path).
# This is required because our K8s ingress only routes /api/* to backend.
socket_asgi = socketio.ASGIApp(sio, socketio_path="/api/socket.io")

# In-memory presence
_sid_to_user: dict[str, str] = {}
_user_sids: dict[str, set[str]] = {}


def user_room(user_id: str) -> str:
    return f"user:{user_id}"


@sio.event
async def connect(sid, environ, auth):
    token = None
    if isinstance(auth, dict):
        token = auth.get("token") or auth.get("access_token")
    if not token:
        # Try query string
        qs = environ.get("QUERY_STRING", "")
        for kv in qs.split("&"):
            if kv.startswith("token="):
                token = kv.split("=", 1)[1]
    if not token:
        logger.info("socket connect denied: no token")
        return False
    try:
        payload = decode_access_token(token)
        if payload.get("type") != "access":
            return False
        user_id = payload.get("sub")
    except jwt.InvalidTokenError as e:
        logger.info("socket auth failure: %s", e)
        return False

    _sid_to_user[sid] = user_id
    _user_sids.setdefault(user_id, set()).add(sid)
    await sio.enter_room(sid, user_room(user_id))
    logger.info("socket connected: user=%s sid=%s", user_id, sid)
    await sio.emit("connected", {"user_id": user_id}, to=sid)


@sio.event
async def disconnect(sid):
    user_id = _sid_to_user.pop(sid, None)
    if user_id and user_id in _user_sids:
        _user_sids[user_id].discard(sid)
        if not _user_sids[user_id]:
            _user_sids.pop(user_id, None)


@sio.on("thread:join")
async def join_thread(sid, data):
    thread_id = (data or {}).get("thread_id")
    if thread_id:
        await sio.enter_room(sid, f"thread:{thread_id}")


@sio.on("thread:leave")
async def leave_thread(sid, data):
    thread_id = (data or {}).get("thread_id")
    if thread_id:
        await sio.leave_room(sid, f"thread:{thread_id}")


@sio.on("typing")
async def typing(sid, data):
    user_id = _sid_to_user.get(sid)
    if not user_id:
        return
    thread_id = (data or {}).get("thread_id")
    is_typing = bool((data or {}).get("is_typing"))
    if thread_id:
        await sio.emit(
            "thread:typing",
            {"thread_id": thread_id, "user_id": user_id, "is_typing": is_typing},
            room=f"thread:{thread_id}",
            skip_sid=sid,
        )


def is_online(user_id: str) -> bool:
    return bool(_user_sids.get(user_id))
