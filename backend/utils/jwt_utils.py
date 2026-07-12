"""JWT helpers for access + refresh tokens."""
from __future__ import annotations
import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
import jwt


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def _algo() -> str:
    return os.environ.get("JWT_ALGORITHM", "HS256")


def _access_ttl_minutes() -> int:
    return int(os.environ.get("ACCESS_TOKEN_MINUTES", "15"))


def _refresh_ttl_days() -> int:
    return int(os.environ.get("REFRESH_TOKEN_DAYS", "30"))


def create_access_token(user_id: str, roles: list[str], current_role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "roles": roles,
        "role": current_role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=_access_ttl_minutes())).timestamp()),
    }
    return jwt.encode(payload, _secret(), algorithm=_algo())


def create_refresh_token_pair(user_id: str) -> tuple[str, str, datetime]:
    """Return (opaque_refresh_token, sha256_hash, expires_at)."""
    raw = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=_refresh_ttl_days())
    return raw, token_hash, expires_at


def hash_refresh_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, _secret(), algorithms=[_algo()])
