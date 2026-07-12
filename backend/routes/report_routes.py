"""Report routes — end-user submit + admin queue."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import Literal

from middleware.auth_middleware import require_auth
from services import report_service
from utils.rate_limit import check_and_record

router = APIRouter(prefix="/v1", tags=["reports"])


ReportTargetType = Literal["listing", "user", "review", "message"]
ReportReason = Literal["spam", "offensive", "scam", "wrong_category", "other"]


class ReportBody(BaseModel):
    target_type: ReportTargetType
    target_id: str
    reason: ReportReason
    description: str | None = Field(None, max_length=1000)


class ResolveBody(BaseModel):
    action: Literal["takedown", "warn", "ban", "none"] = "none"
    note: str | None = None


class DismissBody(BaseModel):
    reason: str | None = None


def _require_admin(u):
    if "admin" not in (u.roles or []):
        raise HTTPException(403, "Admin only")


@router.post("/reports")
async def create_report(body: ReportBody, request: Request, user=Depends(require_auth)):
    # Rate limit 10 / hour / user
    allowed, reset_in = check_and_record(f"report:{user.id}", limit=10, window_seconds=3600)
    if not allowed:
        raise HTTPException(429, f"Too many reports. Try again in {reset_in} seconds.")
    return await report_service.create_report(user.id, body.model_dump(exclude_none=True))


@router.get("/admin/reports")
async def admin_list_reports(
    status: str | None = None,
    target_type: str | None = None,
    cursor: str | None = None,
    limit: int = Query(30, ge=1, le=100),
    user=Depends(require_auth),
):
    _require_admin(user)
    return await report_service.list_reports(status, target_type, cursor, limit)


@router.post("/admin/reports/{rid}/resolve")
async def admin_resolve(rid: str, body: ResolveBody, user=Depends(require_auth)):
    _require_admin(user)
    return await report_service.resolve_report(rid, user.id, body.action, body.note)


@router.post("/admin/reports/{rid}/dismiss")
async def admin_dismiss(rid: str, body: DismissBody | None = None, user=Depends(require_auth)):
    _require_admin(user)
    reason = body.reason if body else None
    return await report_service.dismiss_report(rid, user.id, reason)
