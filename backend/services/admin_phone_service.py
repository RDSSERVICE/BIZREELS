"""Admin phone helpers.

Phase 7b: The literal `9999999999` seed phone was public knowledge (documented
in test_credentials + demo scripts + audit reports). This module randomises
the admin seed phone on first boot, persists it to the DB and to the .env
file, and exposes helpers that other services use to (a) suppress the dev-OTP
echo for admin phones and (b) rotate the phone at will via an admin endpoint.

Storage of truth: `platform_settings.admin_phones: list[str]` — every phone
currently attached to any user in the DB with `admin` role. Cached in-process
for hot-path (`request_otp` → `is_admin_phone`).
"""
from __future__ import annotations

import logging
import os
import random
import time
from pathlib import Path

from database import get_db

logger = logging.getLogger(__name__)

_CACHE_TTL = 30.0
_cache: dict = {"phones": set(), "loaded_at": 0.0}
ENV_PATH = Path(__file__).parent.parent / ".env"


def _random_indian_phone() -> str:
    """Generate a random 10-digit Indian phone starting with 6-9."""
    return random.choice("6789") + "".join(str(random.randint(0, 9)) for _ in range(9))


async def _load_admin_phones_from_db() -> set[str]:
    db = get_db()
    docs = await db.users.find(
        {"roles": "admin", "is_deleted": {"$ne": True}, "phone": {"$exists": True}},
        {"phone": 1},
    ).to_list(length=100)
    return {d["phone"] for d in docs if d.get("phone")}


async def refresh_cache() -> None:
    _cache["phones"] = await _load_admin_phones_from_db()
    _cache["loaded_at"] = time.time()


async def get_admin_phones() -> set[str]:
    if time.time() - _cache["loaded_at"] > _CACHE_TTL:
        await refresh_cache()
    return set(_cache["phones"])


def is_admin_phone_sync(phone: str) -> bool:
    """Hot-path — sync check against the last-refreshed cache. Never blocks."""
    return phone in _cache["phones"]


def _persist_env_var(key: str, value: str) -> None:
    """Idempotently write / update KEY=VALUE in /app/backend/.env."""
    try:
        lines: list[str] = []
        if ENV_PATH.exists():
            lines = ENV_PATH.read_text().splitlines()
        found = False
        for i, ln in enumerate(lines):
            if ln.startswith(f"{key}="):
                lines[i] = f"{key}={value}"
                found = True
                break
        if not found:
            lines.append(f"{key}={value}")
        ENV_PATH.write_text("\n".join(lines) + "\n")
    except Exception:  # noqa: BLE001
        logger.exception("Failed to persist %s to .env", key)


def _persist_test_credentials(phone: str) -> None:
    """Write a small hint file with the current admin phone so testers/agents
    can find it. This is NOT the OTP — just the phone number that receives it.
    """
    try:
        cred_path = Path("/app/memory/admin_phone.txt")
        cred_path.parent.mkdir(parents=True, exist_ok=True)
        cred_path.write_text(
            f"# Current admin phone (auto-rotated). OTP is dev-mode only and\n"
            f"# is NOT echoed in HTTP responses for admin phones — grep the\n"
            f"# backend logs for 'Mock OTP for {phone}' to fetch it.\n"
            f"{phone}\n"
        )
    except Exception:  # noqa: BLE001
        logger.exception("Failed to write admin_phone.txt")


async def ensure_admin_seed() -> str:
    """Idempotent admin seed. Returns the admin phone currently on record.

    Behaviour:
      • If any admin user already exists → keep it; return its phone.
      • Else use `ADMIN_SEED_PHONE` from env, or generate a random one if unset.
      • Persist the (possibly new) phone to /app/backend/.env and admin_phone.txt.
    """
    if os.environ.get("SEED_ADMIN_ON_STARTUP", "false").lower() not in ("1", "true", "yes"):
        await refresh_cache()
        return ""

    db = get_db()
    existing = await db.users.find_one(
        {"roles": "admin", "is_deleted": {"$ne": True}},
        sort=[("created_at", 1)],
    )
    if existing:
        phone = existing.get("phone", "")
        await refresh_cache()
        return phone

    phone = os.environ.get("ADMIN_SEED_PHONE", "").strip() or _random_indian_phone()
    from models.user import User
    admin = User(
        phone=phone, name="Admin",
        roles=["admin", "customer"], current_role="admin",
    )
    await db.users.insert_one(admin.to_mongo())
    _persist_env_var("ADMIN_SEED_PHONE", phone)
    _persist_test_credentials(phone)
    logger.info("Seeded admin user with randomised phone: %s", phone)
    await refresh_cache()
    return phone


async def rotate_admin_phone(admin_user_id: str, new_phone: str | None = None) -> dict:
    """Rotate the current admin's phone to a new random (or supplied) value.

    - Existing JWTs remain valid (they encode user_id, not phone).
    - Fails if new_phone collides with any existing user's phone.
    """
    db = get_db()
    from bson import ObjectId
    from services.auth_service import _validate_phone

    if new_phone:
        new_phone = _validate_phone(new_phone)
    else:
        # Random until we find one that doesn't collide (usually 1 try)
        for _ in range(10):
            candidate = _random_indian_phone()
            if not await db.users.find_one({"phone": candidate}):
                new_phone = candidate
                break
        else:
            raise RuntimeError("Could not find a free random phone after 10 tries")

    if await db.users.find_one({"phone": new_phone, "_id": {"$ne": ObjectId(admin_user_id)}}):
        raise ValueError("Phone already in use by another account")

    result = await db.users.update_one(
        {"_id": ObjectId(admin_user_id)},
        {"$set": {"phone": new_phone}},
    )
    if result.matched_count == 0:
        raise ValueError("Admin user not found")

    _persist_env_var("ADMIN_SEED_PHONE", new_phone)
    _persist_test_credentials(new_phone)
    await refresh_cache()
    logger.info("Rotated admin phone → %s", new_phone)
    return {"ok": True, "new_admin_phone": new_phone}
