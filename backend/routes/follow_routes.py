"""Follow routes."""
from __future__ import annotations
from fastapi import APIRouter, Depends

from middleware.auth_middleware import require_auth
from services import follow_service

router = APIRouter(prefix="/v1/follows", tags=["follows"])


@router.post("/{user_id}")
async def follow_user(user_id: str, current=Depends(require_auth)):
    return await follow_service.follow(current.id, user_id)


@router.delete("/{user_id}")
async def unfollow_user(user_id: str, current=Depends(require_auth)):
    return await follow_service.unfollow(current.id, user_id)


@router.get("/me/following")
async def my_following(current=Depends(require_auth)):
    items = await follow_service.my_following(current.id)
    return {"items": items, "count": len(items)}
