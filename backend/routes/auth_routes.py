"""Auth routes: OTP send/verify, refresh, logout."""
from __future__ import annotations
import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Literal

from services import auth_service
from utils.rate_limit import check_and_record

router = APIRouter(prefix="/v1/auth", tags=["auth"])

# SEC-001 gate (2026-07-14): dev-admin-login endpoint is registered ONLY when
# ALLOW_DEV_ADMIN_LOGIN=true. Production deploys MUST leave this unset/false.
_ALLOW_DEV_ADMIN_LOGIN = os.environ.get("ALLOW_DEV_ADMIN_LOGIN", "").strip().lower() == "true"

Role = Literal["customer", "vendor", "creator"]


class OtpSendBody(BaseModel):
    phone: str = Field(..., min_length=10, max_length=10)


class OtpVerifyBody(BaseModel):
    phone: str = Field(..., min_length=10, max_length=10)
    otp: str = Field(..., min_length=6, max_length=6)
    name: str | None = None
    roles: list[Role] | None = None
    referral_code: str | None = Field(None, max_length=16)


class RefreshBody(BaseModel):
    refresh_token: str


class LogoutBody(BaseModel):
    refresh_token: str


@router.post("/otp/send")
async def send_otp(body: OtpSendBody, request: Request):
    # Rate limit: 3 requests per phone per 10 min
    allowed, remaining = check_and_record(f"otp:{body.phone}", limit=3, window_seconds=600)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Too many OTP requests. Try again in {remaining} seconds.",
        )
    return await auth_service.request_otp(body.phone)


@router.post("/otp/verify")
async def verify_otp(body: OtpVerifyBody, request: Request):
    # P3 hardening: per-phone+IP throttle on verify to bound guessing burst.
    # Per-record attempt cap in auth_service is untouched; this is defense-in-depth.
    ip = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip() \
        or (request.client.host if request.client else "unknown")
    allowed, retry = check_and_record(f"otpv:{body.phone}:{ip}", limit=10, window_seconds=3600)
    if not allowed:
        raise HTTPException(429, f"Too many verification attempts. Retry in {retry}s.")
    return await auth_service.verify_otp_and_login(
        phone=body.phone,
        otp=body.otp,
        name=body.name,
        roles=body.roles,
        referral_code=body.referral_code,
    )


class DevAdminLoginBody(BaseModel):
    token: str = Field(..., min_length=8, max_length=256)


# SEC-001 gate: only register the endpoint when the operator explicitly opts in.
# PRODUCTION: MUST SET ALLOW_DEV_ADMIN_LOGIN=false (or leave unset). The route
# will then respond 404 automatically.
if _ALLOW_DEV_ADMIN_LOGIN:
    @router.post("/dev/admin-login")
    async def dev_admin_login(body: DevAdminLoginBody, request: Request):
        """Dev-mode admin login using DEV_ADMIN_OVERRIDE_TOKEN (from /app/memory/admin_phone.txt)."""
        ip = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip() \
             or (request.client.host if request.client else "unknown")
        # Dev-mode gate — permissive limit (30/min/IP) because k8s ingress can
        # collapse many demo users behind a single source IP. Still limited to
        # prevent brute-force of the override token.
        allowed, retry = check_and_record(f"devadmin:{ip}", limit=30, window_seconds=60)
        if not allowed:
            raise HTTPException(429, f"Too many attempts. Retry in {retry}s.")
        from services import admin_phone_service
        return await admin_phone_service.dev_admin_login(body.token.strip())


class GoogleSessionExchangeBody(BaseModel):
    session_id: str = Field(..., min_length=8, max_length=256)


@router.post("/google/session-exchange")
async def google_session_exchange(body: GoogleSessionExchangeBody):
    """SEC-hardened Google signup/login. Body:{session_id} from the Emergent
    OAuth callback URL fragment. Returns our own JWT + refresh tokens so all
    existing endpoints work unchanged. Merges by email if user already exists.
    """
    from services import google_auth_service
    return await google_auth_service.exchange_session_and_login(body.session_id.strip())


@router.post("/refresh")
async def refresh(body: RefreshBody):
    return await auth_service.refresh_access_token(body.refresh_token)


@router.post("/logout")
async def logout(body: LogoutBody):
    await auth_service.revoke_refresh_token(body.refresh_token)
    return {"success": True, "message": "Logged out"}
