"""Onboarding routes."""
from __future__ import annotations
from fastapi import APIRouter, Depends

from middleware.auth_middleware import require_auth
from services import onboarding_service

router = APIRouter(prefix="/v1/users/me/onboarding-checklist", tags=["onboarding"])


@router.get("")
async def get_state(user=Depends(require_auth)):
    # Also attempt to grant the bonus lazily if all steps complete
    return await onboarding_service.maybe_grant_bonus(user.id)
