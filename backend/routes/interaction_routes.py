"""Like / save + saved-listings routes."""
from __future__ import annotations
from fastapi import APIRouter, Depends

from middleware.auth_middleware import require_auth
from services import interaction_service

router = APIRouter(prefix="/v1", tags=["interactions"])


@router.post("/listings/{listing_id}/like")
async def toggle_like(listing_id: str, user=Depends(require_auth)):
    return await interaction_service.toggle(user.id, listing_id, "like")


@router.post("/listings/{listing_id}/save")
async def toggle_save(listing_id: str, user=Depends(require_auth)):
    return await interaction_service.toggle(user.id, listing_id, "save")


@router.get("/interactions/me/saved")
async def my_saved(user=Depends(require_auth)):
    items = await interaction_service.my_listings_by_type(user.id, "save")
    return {"items": items}


@router.get("/interactions/me/liked")
async def my_liked(user=Depends(require_auth)):
    items = await interaction_service.my_listings_by_type(user.id, "like")
    return {"items": items}
