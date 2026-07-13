"""Platform Settings service — DB-backed integration credentials.

Stores a singleton doc (`platform_settings`) with per-integration config. Runtime
lookups read from the DB first and fall back to environment variables so the
existing .env-based deployment keeps working during the transition.

Cache: 60s in-process TTL to avoid hitting Mongo on every OTP send / upload.
Sync callers use `get_integration_sync(name)` which returns the last cached
snapshot; the cache is refreshed on write and by a background refresh in the
async accessor. Startup MUST call `initialize_defaults_on_startup()` once so
the sync cache is warm before any synchronous is_dev_mode() call fires.
"""
from __future__ import annotations

import os
import time
import logging
from datetime import datetime, timezone
from typing import Any

from database import get_db

logger = logging.getLogger(__name__)

SINGLETON_ID = "singleton"
CACHE_TTL_SECONDS = 60.0

# In-process snapshot — {integration_name: {...values}}
_cache: dict[str, dict[str, Any]] = {}
_cache_loaded_at: float = 0.0

INTEGRATIONS = ("msg91", "cloudinary", "razorpay", "fcm", "ai_content")

# Secret fields that must NEVER be sent to the client verbatim.
SECRET_FIELDS: dict[str, tuple[str, ...]] = {
    "msg91": ("auth_key",),
    "cloudinary": ("api_secret",),
    "razorpay": ("key_secret", "webhook_secret"),
    "fcm": ("service_account_json",),
    "ai_content": ("api_key",),
}


def _env_bool(name: str, default: bool = False) -> bool:
    v = os.environ.get(name)
    if v is None:
        return default
    return v.strip().lower() in ("1", "true", "yes")


def _env_defaults() -> dict[str, dict[str, Any]]:
    """Seed values pulled from current .env — used only on first-ever startup."""
    return {
        "msg91": {
            "auth_key": os.environ.get("MSG91_AUTH_KEY", "").strip(),
            "template_id": os.environ.get("MSG91_TEMPLATE_ID", "").strip(),
            "sender_id": os.environ.get("MSG91_SENDER_ID", "").strip(),
            "txn_template_id": os.environ.get("MSG91_TXN_TEMPLATE_ID", "").strip(),
            "dev_mode": _env_bool("OTP_DEV_MODE", True),
        },
        "cloudinary": {
            "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME", "").strip(),
            "api_key": os.environ.get("CLOUDINARY_API_KEY", "").strip(),
            "api_secret": os.environ.get("CLOUDINARY_API_SECRET", "").strip(),
            "upload_preset": os.environ.get("CLOUDINARY_UPLOAD_PRESET", "").strip(),
            "dev_mode": _env_bool("CLOUDINARY_DEV_MODE", True),
        },
        "razorpay": {
            "key_id": os.environ.get("RAZORPAY_KEY_ID", "").strip(),
            "key_secret": os.environ.get("RAZORPAY_KEY_SECRET", "").strip(),
            "webhook_secret": os.environ.get("RAZORPAY_WEBHOOK_SECRET", "").strip(),
            "dev_mode": _env_bool("RAZORPAY_DEV_MODE", True),
        },
        "fcm": {
            "service_account_json": os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip(),
            "dev_mode": _env_bool("FCM_DEV_MODE", True),
        },
        "ai_content": {
            "provider": os.environ.get("AI_PROVIDER", "openai").strip(),
            "model": os.environ.get("AI_MODEL", "gpt-5.4").strip(),
            "api_key": "",  # fall back to EMERGENT_LLM_KEY env if empty
            "enabled": os.environ.get("AI_DEV_MODE", "false").lower() not in ("1", "true", "yes"),
        },
    }


def _apply_to_cache(doc: dict) -> None:
    global _cache, _cache_loaded_at
    snap: dict[str, dict[str, Any]] = {}
    for name in INTEGRATIONS:
        snap[name] = dict(doc.get(name) or {})
    _cache = snap
    _cache_loaded_at = time.time()


async def initialize_defaults_on_startup() -> None:
    """Create the singleton doc if missing (seed from env). Warms the cache.

    Also backfills any INTEGRATIONS blocks that are missing from an older doc
    (e.g., `ai_content` added post-seed) so `get_masked()` returns the full set.
    """
    db = get_db()
    doc = await db.platform_settings.find_one({"_id": SINGLETON_ID})
    if not doc:
        now_iso = datetime.now(timezone.utc).isoformat()
        doc = {"_id": SINGLETON_ID, **_env_defaults(),
               "updated_at": now_iso, "updated_by": None}
        try:
            await db.platform_settings.insert_one(doc)
            logger.info("platform_settings: seeded singleton from env defaults")
        except Exception:  # duplicate key on race — read the winner
            doc = await db.platform_settings.find_one({"_id": SINGLETON_ID})
    else:
        # Backfill any missing integration blocks (schema evolution over time)
        defaults = _env_defaults()
        missing = {name: defaults[name] for name in INTEGRATIONS if not doc.get(name)}
        if missing:
            await db.platform_settings.update_one(
                {"_id": SINGLETON_ID},
                {"$set": {**missing,
                          "updated_at": datetime.now(timezone.utc).isoformat()}},
            )
            doc = await db.platform_settings.find_one({"_id": SINGLETON_ID})
            logger.info("platform_settings: backfilled missing blocks: %s", list(missing.keys()))
    _apply_to_cache(doc)


async def _refresh_cache() -> None:
    db = get_db()
    doc = await db.platform_settings.find_one({"_id": SINGLETON_ID})
    if doc:
        _apply_to_cache(doc)


async def get_full_doc() -> dict:
    """Async accessor — refreshes cache if stale."""
    if time.time() - _cache_loaded_at > CACHE_TTL_SECONDS:
        await _refresh_cache()
    db = get_db()
    doc = await db.platform_settings.find_one({"_id": SINGLETON_ID}) or {}
    return doc


def get_integration_sync(name: str) -> dict[str, Any]:
    """Sync accessor for hot-path callers (is_dev_mode etc.).

    Returns the last cached snapshot. Never blocks. If the cache is empty (e.g.
    called before startup finished), returns {} — callers must fall back to env.
    """
    return dict(_cache.get(name, {}))


def get_value(integration: str, key: str, env_fallback: str | None = None) -> str:
    """Return a string value: settings-doc first, else env, else empty string."""
    v = get_integration_sync(integration).get(key)
    if v:
        return str(v).strip()
    if env_fallback:
        return os.environ.get(env_fallback, "").strip()
    return ""


def get_bool(integration: str, key: str, env_fallback: str, default: bool = False) -> bool:
    snap = get_integration_sync(integration)
    if key in snap and snap[key] is not None:
        val = snap[key]
        if isinstance(val, bool):
            return val
        return str(val).strip().lower() in ("1", "true", "yes")
    v = os.environ.get(env_fallback)
    if v is None:
        return default
    return v.strip().lower() in ("1", "true", "yes")


# ============ Admin API layer ============
def _mask(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "****"
    return f"****{value[-4:]}"


async def get_masked() -> dict:
    """Return settings with all secret fields masked. Safe to send to admin UI."""
    doc = await get_full_doc()
    out: dict = {"updated_at": doc.get("updated_at"), "updated_by": doc.get("updated_by")}
    for name in INTEGRATIONS:
        block = dict(doc.get(name) or {})
        for secret_key in SECRET_FIELDS.get(name, ()):
            if block.get(secret_key):
                block[secret_key] = _mask(str(block[secret_key]))
        out[name] = block
    return out


async def update_settings(patch: dict, updated_by: str | None) -> dict:
    """Merge `patch` into the singleton doc.

    Rules:
      - Only the four known integration blocks are accepted.
      - Fields whose value is `"****"` or `""` (empty string) are IGNORED — this
        lets the UI submit only the fields the admin actually changed.
      - Booleans (dev_mode) and non-secret text fields are always overwritten
        when present in the patch (including empty string clears for text).
    """
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    update_doc: dict[str, Any] = {"updated_at": now_iso, "updated_by": updated_by}

    for name in INTEGRATIONS:
        if name not in patch or not isinstance(patch[name], dict):
            continue
        block_patch = patch[name]
        current = await _current_block(name)
        merged = dict(current)
        for k, v in block_patch.items():
            if k in SECRET_FIELDS.get(name, ()):
                # Skip masked / empty secret updates (preserve existing value).
                if isinstance(v, str) and (v == "" or v.startswith("****")):
                    continue
                merged[k] = v
            else:
                merged[k] = v
        update_doc[name] = merged

    await db.platform_settings.update_one(
        {"_id": SINGLETON_ID},
        {"$set": update_doc},
        upsert=True,
    )
    await _refresh_cache()
    return await get_masked()


async def _current_block(name: str) -> dict:
    db = get_db()
    doc = await db.platform_settings.find_one({"_id": SINGLETON_ID}) or {}
    return dict(doc.get(name) or {})
