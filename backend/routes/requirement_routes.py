"""Requirements + Proposals routes."""
from __future__ import annotations
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Literal

from middleware.auth_middleware import require_auth
from services import requirement_service, proposal_service

router = APIRouter(prefix="/v1", tags=["requirements"])


class LocIn(BaseModel):
    lat: float | None = None
    lng: float | None = None
    area: str
    city: str
    state: str | None = None
    pincode: str


class ReqCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    description: str | None = None
    category_id: str
    sub_category_id: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    photos: list[dict] = Field(default_factory=list)
    video: dict | None = None
    location: LocIn
    urgency: Literal["immediate", "this_week", "this_month", "flexible"] = "flexible"
    is_negotiable: bool = True


class ReqUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    photos: list[dict] | None = None
    video: dict | None = None
    location: LocIn | None = None
    urgency: str | None = None
    is_negotiable: bool | None = None


class ProposalCreate(BaseModel):
    requirement_id: str
    message: str = Field("", max_length=500)
    quoted_price: float | None = None
    attachments: list[dict] = Field(default_factory=list)


@router.post("/requirements/")
async def create_req(body: ReqCreate, user=Depends(require_auth)):
    return await requirement_service.create(user.id, body.model_dump(exclude_none=True))


@router.get("/requirements/")
async def list_req(
    category_id: str | None = Query(None),
    city: str | None = Query(None),
    urgency: str | None = Query(None),
    budget_max: float | None = Query(None),
    q: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
):
    return await requirement_service.list_requirements(
        {"category_id": category_id, "city": city, "urgency": urgency, "budget_max": budget_max, "q": q},
        limit=limit, cursor=cursor,
    )


@router.get("/requirements/me/posted")
async def my_posted(user=Depends(require_auth)):
    return {"items": await requirement_service.my_posted(user.id)}


@router.get("/requirements/{req_id}")
async def get_req(req_id: str, background: BackgroundTasks):
    r = await requirement_service.get_by_id(req_id)
    background.add_task(requirement_service.increment_views, req_id)
    return r


@router.patch("/requirements/{req_id}")
async def patch_req(req_id: str, body: ReqUpdate, user=Depends(require_auth)):
    return await requirement_service.update(req_id, user.id, body.model_dump(exclude_none=True))


@router.delete("/requirements/{req_id}")
async def del_req(req_id: str, user=Depends(require_auth)):
    await requirement_service.soft_delete(req_id, user.id)
    return {"success": True}


@router.post("/requirements/{req_id}/close")
async def close_req(req_id: str, user=Depends(require_auth)):
    return await requirement_service.close_requirement(req_id, user.id)


@router.get("/requirements/{req_id}/proposals")
async def list_proposals(req_id: str, user=Depends(require_auth)):
    return {"items": await proposal_service.list_by_requirement(req_id, user.id)}


# ---- Proposals ----
@router.post("/proposals/")
async def create_proposal(body: ProposalCreate, user=Depends(require_auth)):
    if "vendor" not in (user.roles or []):
        raise HTTPException(403, "Vendor role required")
    return await proposal_service.create(user.id, body.model_dump(exclude_none=True))


@router.get("/proposals/me/sent")
async def my_proposals(user=Depends(require_auth)):
    return {"items": await proposal_service.my_sent(user.id)}


@router.post("/proposals/{pid}/shortlist")
async def shortlist(pid: str, user=Depends(require_auth)):
    return await proposal_service.shortlist(pid, user.id)


@router.post("/proposals/{pid}/reject")
async def reject_proposal(pid: str, user=Depends(require_auth)):
    return await proposal_service.reject(pid, user.id)


@router.post("/proposals/{pid}/accept")
async def accept_proposal(pid: str, user=Depends(require_auth)):
    return await proposal_service.accept(pid, user.id)
