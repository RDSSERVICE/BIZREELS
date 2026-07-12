"""Referral routes."""
from __future__ import annotations
from fastapi import APIRouter, Depends

from middleware.auth_middleware import require_auth
from services import referral_service

router = APIRouter(prefix="/v1/users/me/referrals", tags=["referrals"])


@router.get("/")
async def my_referrals(user=Depends(require_auth)):
    code = await referral_service.ensure_code(user.id)
    lst = await referral_service.list_my_referrals(user.id)
    return {"referral_code": code, **lst}
