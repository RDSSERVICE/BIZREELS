"""User routes: profile CRUD, role switch, add role."""
from __future__ import annotations
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from typing import Literal

from middleware.auth_middleware import require_auth
from services import user_service

router = APIRouter(prefix="/v1/users", tags=["users"])

Role = Literal["customer", "vendor", "creator", "admin"]


class ProfileUpdateBody(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    profile_pic: str | None = None
    gender: str | None = None
    dob: str | None = None
    current_role: Role | None = None


class RoleBody(BaseModel):
    role: Role


@router.get("/me")
async def get_me(user=Depends(require_auth)):
    return {"user": user_service.serialize(user)}


@router.patch("/me")
async def update_me(body: ProfileUpdateBody, user=Depends(require_auth)):
    updated = await user_service.update_profile(user.id, body.model_dump(exclude_none=True))
    return {"user": user_service.serialize(updated)}


@router.post("/me/switch-role")
async def switch_role(body: RoleBody, user=Depends(require_auth)):
    updated = await user_service.switch_role(user.id, body.role)
    return {"user": user_service.serialize(updated)}


@router.post("/me/add-role")
async def add_role(body: RoleBody, user=Depends(require_auth)):
    updated = await user_service.add_role(user.id, body.role)
    return {"user": user_service.serialize(updated)}
