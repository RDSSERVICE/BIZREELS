"""Category routes."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from middleware.auth_middleware import require_auth
from services import category_service

router = APIRouter(prefix="/v1/categories", tags=["categories"])


class CategoryCreateBody(BaseModel):
    name: str
    parent_id: str | None = None
    icon_url: str | None = None


class CategoryUpdateBody(BaseModel):
    name: str | None = None
    icon_url: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


def _require_admin(user):
    if "admin" not in (user.roles or []):
        raise HTTPException(403, "Admin only")


@router.get("/")
async def list_categories(
    parent_id: str | None = Query(None),
    top_level: bool = Query(False),
    tree: bool = Query(False),
):
    items = await category_service.list_categories(
        parent_id=parent_id, only_top_level=top_level, as_tree=tree
    )
    return {"items": items}


@router.get("/{slug}")
async def get_category(slug: str):
    cat = await category_service.get_by_slug(slug)
    if not cat:
        raise HTTPException(404, "Category not found")
    return cat


@router.post("/")
async def create_category(body: CategoryCreateBody, user=Depends(require_auth)):
    _require_admin(user)
    return await category_service.create_category(
        name=body.name, parent_id=body.parent_id, icon_url=body.icon_url
    )


@router.patch("/{cid}")
async def update_category(cid: str, body: CategoryUpdateBody, user=Depends(require_auth)):
    _require_admin(user)
    return await category_service.update_category(cid, body.model_dump(exclude_none=True))


@router.delete("/{cid}")
async def delete_category(cid: str, user=Depends(require_auth)):
    _require_admin(user)
    await category_service.soft_delete_category(cid)
    return {"success": True}
