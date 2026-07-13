"""Google Sign-in via Emergent-managed OAuth.

Deviation from the stock playbook: instead of storing the Emergent-issued
`session_token` as our auth, we use the /session-data response purely for
identity verification and issue our OWN JWT + refresh tokens — the same
tokens the phone-OTP flow returns. This lets every existing endpoint work
unchanged with either signup path.

REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS,
THIS BREAKS THE AUTH. The frontend derives redirect_url from
`window.location.origin + '/auth/callback'` — see `Login.jsx` + `AppRouter`.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx
from fastapi import HTTPException

from database import get_db
from models.user import User

logger = logging.getLogger(__name__)

EMERGENT_SESSION_DATA_URL = (
    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
)


async def _fetch_google_identity(session_id: str) -> dict:
    """Exchange the one-shot session_id with Emergent for the user identity."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                EMERGENT_SESSION_DATA_URL,
                headers={"X-Session-ID": session_id},
            )
    except httpx.RequestError as e:
        raise HTTPException(502, f"Google auth upstream unreachable: {e}")
    if r.status_code != 200:
        raise HTTPException(401, "Invalid or expired Google session")
    data = r.json()
    if not data.get("email"):
        raise HTTPException(400, "Missing email in Google response")
    return data


async def exchange_session_and_login(session_id: str) -> dict:
    """Full flow: verify session_id, upsert user, issue our own JWT."""
    from services import auth_service, referral_service, wallet_service

    ident = await _fetch_google_identity(session_id)
    email = str(ident["email"]).strip().lower()
    name = str(ident.get("name") or "").strip() or None
    picture = ident.get("picture") or None

    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    existing = await db.users.find_one({"email": email})
    is_new_user = False

    if existing:
        # Link + refresh profile fields
        providers = list(existing.get("auth_providers") or [])
        if not any(p.get("provider") == "google" for p in providers):
            providers.append({"provider": "google", "identifier": email, "linked_at": now_iso})
        updates: dict = {"auth_providers": providers, "updated_at": now_iso}
        if not existing.get("name") and name:
            updates["name"] = name
        if not existing.get("profile_pic") and picture:
            updates["profile_pic"] = picture
        if existing.get("is_deleted"):
            updates["is_deleted"] = False
            updates["is_active"] = True
            updates["is_test_data"] = False
        await db.users.update_one({"_id": existing["_id"]}, {"$set": updates})
        user_doc = await db.users.find_one({"_id": existing["_id"]})
    else:
        is_new_user = True
        user = User(
            phone=None,  # Google user — phone linked later
            name=name,
            email=email,
            profile_pic=picture,
            roles=["customer"],
            current_role="customer",
            auth_providers=[{"provider": "google", "identifier": email, "linked_at": now_iso}],
        )
        res = await db.users.insert_one(user.to_mongo())
        user_doc = await db.users.find_one({"_id": res.inserted_id})
        # Same signup bonus as the OTP flow
        try:
            await wallet_service.get_or_create(str(res.inserted_id))
            await wallet_service.earn_credits(
                str(res.inserted_id), 50,
                reason="google_signup_bonus", ref_type="signup", ref_id=str(res.inserted_id),
            )
        except Exception:  # noqa: BLE001
            logger.exception("signup bonus failed")

    # Issue our own JWT + refresh (reuse the OTP flow helpers)
    user_model = User.from_mongo(user_doc)
    tokens = await auth_service.issue_tokens(user_model)
    user_out = auth_service._serialize_user(user_model)
    return {
        **tokens,
        "user": user_out,
        "is_new_user": is_new_user,
    }
