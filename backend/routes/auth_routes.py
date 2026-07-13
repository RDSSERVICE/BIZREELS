"""Auth routes: OTP send/verify, refresh, logout."""
from __future__ import annotations
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Literal

from services import auth_service
from utils.rate_limit import check_and_record

router = APIRouter(prefix="/v1/auth", tags=["auth"])

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
async def verify_otp(body: OtpVerifyBody):
    return await auth_service.verify_otp_and_login(
        phone=body.phone,
        otp=body.otp,
        name=body.name,
        roles=body.roles,
        referral_code=body.referral_code,
    )


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
