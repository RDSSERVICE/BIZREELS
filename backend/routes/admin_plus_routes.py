"""Admin panel expansion — Phase 7f (CHANGE 5).

Endpoints: transactions unified view, orders view, commissions, audit log,
trust+ badge grant flow. All admin-only (require_roles("admin")).
"""
from __future__ import annotations
import csv
import io
import logging
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel, Field

from database import get_db
from middleware.auth_middleware import require_roles
from services import commission_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/admin", tags=["admin-plus"])


def _iso(v) -> str:
    """Handle both datetime + already-serialized ISO strings."""
    if hasattr(v, "isoformat"):
        return v.isoformat()
    if isinstance(v, str):
        return v
    return datetime.now(timezone.utc).isoformat()


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None


# ========================================================== TRANSACTIONS
@router.get("/transactions")
async def list_transactions(
    _admin=Depends(require_roles("admin")),
    type: str | None = Query(default=None, pattern="^(payment|wallet|all)$"),
    status: str | None = Query(default=None, max_length=32),
    user_id: str | None = Query(default=None, max_length=32),
    from_date: str | None = Query(default=None, alias="from", max_length=40),
    to_date: str | None = Query(default=None, alias="to", max_length=40),
    limit: int = Query(default=50, ge=1, le=200),
):
    """Unified list: payments + wallet transactions. Returns items sorted by created_at desc."""
    db = get_db()
    dt_from = _parse_dt(from_date)
    dt_to = _parse_dt(to_date)
    common = {"is_deleted": {"$ne": True}}
    if status:
        common["status"] = status
    if user_id:
        common["user_id"] = user_id
    if dt_from or dt_to:
        rng: dict = {}
        if dt_from: rng["$gte"] = dt_from
        if dt_to: rng["$lte"] = dt_to
        common["created_at"] = rng

    items: list[dict] = []
    if type in (None, "all", "payment"):
        pays = await db.payment_transactions.find(common).sort([("_id", -1)]).limit(limit).to_list(limit)
        for p in pays:
            items.append({
                "id": str(p["_id"]), "kind": "payment",
                "user_id": p.get("user_id"),
                "amount_paise": p.get("amount_paise") or p.get("amount"),
                "currency": p.get("currency", "INR"),
                "status": p.get("status"),
                "provider": p.get("provider"),
                "reference": p.get("razorpay_order_id") or p.get("reference"),
                "created_at": _iso(p.get("created_at")),
            })
    if type in (None, "all", "wallet"):
        wt = await db.wallet_transactions.find(common).sort([("_id", -1)]).limit(limit).to_list(limit)
        for w in wt:
            items.append({
                "id": str(w["_id"]), "kind": "wallet",
                "user_id": w.get("user_id"),
                "amount_paise": (w.get("amount_credits") or 0) * 100,
                "currency": "CREDITS",
                "status": w.get("status", "posted"),
                "provider": w.get("source"),
                "reference": w.get("ref_id"),
                "created_at": _iso(w.get("created_at")),
            })
    items.sort(key=lambda x: x["created_at"], reverse=True)
    return {"items": items[:limit], "count": min(len(items), limit)}


@router.get("/transactions.csv")
async def export_transactions_csv(_admin=Depends(require_roles("admin"))):
    data = await list_transactions(_admin=_admin)  # type: ignore[arg-type]
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "kind", "user_id", "amount_paise", "currency", "status", "provider", "reference", "created_at"])
    for r in data["items"]:
        w.writerow([r["id"], r["kind"], r["user_id"], r["amount_paise"], r["currency"],
                    r["status"], r["provider"], r["reference"], r["created_at"]])
    return Response(content=buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=transactions.csv"})


# ========================================================== ORDERS (deals + cart-checkouts)
@router.get("/orders")
async def list_orders(
    _admin=Depends(require_roles("admin")),
    status: str | None = Query(default=None, max_length=32),
    vendor_id: str | None = Query(default=None, max_length=32),
    customer_id: str | None = Query(default=None, max_length=32),
    limit: int = Query(default=50, ge=1, le=200),
):
    db = get_db()
    q: dict = {"is_deleted": {"$ne": True}}
    if status:
        q["status"] = status
    if vendor_id:
        q["seller_id"] = vendor_id
    if customer_id:
        q["buyer_id"] = customer_id
    docs = await db.deals.find(q).sort([("_id", -1)]).limit(limit).to_list(limit)
    return {
        "items": [{
            "id": str(d["_id"]),
            "listing_id": str(d.get("listing_id") or ""),
            "listing_title": d.get("listing_title"),
            "buyer_id": d.get("buyer_id"),
            "seller_id": d.get("seller_id"),
            "status": d.get("status"),
            "current_offer": d.get("current_offer"),
            "final_amount": d.get("final_amount") or d.get("current_offer"),
            "thread_id": str(d.get("thread_id") or ""),
            "created_at": _iso(d.get("created_at")),
        } for d in docs],
        "count": len(docs),
    }


# ========================================================== COMMISSIONS
@router.get("/commissions")
async def list_commissions(
    _admin=Depends(require_roles("admin")),
    status: str | None = Query(default=None, pattern="^(accrued|paid_out|pending)$"),
    vendor_id: str | None = Query(default=None, max_length=32),
    limit: int = Query(default=50, ge=1, le=200),
):
    return await commission_service.list_commissions(status=status, vendor_id=vendor_id, limit=limit)


@router.get("/commissions/summary")
async def commissions_summary(period_days: int = Query(default=30, ge=1, le=365),
                              _admin=Depends(require_roles("admin"))):
    return await commission_service.summary(period_days=period_days)


class GlobalRateBody(BaseModel):
    rate: float = Field(..., ge=0, le=1)


@router.post("/commissions/rate/global")
async def set_global_rate(body: GlobalRateBody, _admin=Depends(require_roles("admin"))):
    return await commission_service.set_global_rate(body.rate)


class CategoryRateBody(BaseModel):
    category_id: str = Field(..., max_length=64)
    rate: float = Field(..., ge=0, le=1)


@router.post("/commissions/rate/category")
async def set_category_rate(body: CategoryRateBody, _admin=Depends(require_roles("admin"))):
    return await commission_service.set_category_rate(body.category_id, body.rate)


@router.post("/commissions/{cid}/mark-paid")
async def mark_commission_paid(cid: str, _admin=Depends(require_roles("admin"))):
    doc = await commission_service.mark_paid(cid)
    return doc or {"error": "not found"}


# ========================================================== AUDIT LOG
@router.get("/audit-log")
async def list_audit(
    _admin=Depends(require_roles("admin")),
    user_id: str | None = Query(default=None, max_length=32),
    action: str | None = Query(default=None, max_length=64),
    from_date: str | None = Query(default=None, alias="from"),
    to_date: str | None = Query(default=None, alias="to"),
    limit: int = Query(default=50, ge=1, le=200),
):
    db = get_db()
    q: dict = {}
    if user_id:
        q["user_id"] = user_id
    if action:
        q["action"] = action
    dt_from = _parse_dt(from_date)
    dt_to = _parse_dt(to_date)
    if dt_from or dt_to:
        rng: dict = {}
        if dt_from: rng["$gte"] = dt_from
        if dt_to: rng["$lte"] = dt_to
        q["created_at"] = rng
    docs = await db.audit_logs.find(q).sort([("_id", -1)]).limit(limit).to_list(limit)
    return {
        "items": [{
            "id": str(d["_id"]),
            "user_id": d.get("user_id"),
            "action": d.get("action"),
            "meta": d.get("meta"),
            "ip": d.get("ip"),
            "created_at": _iso(d.get("created_at")),
        } for d in docs],
        "count": len(docs),
    }
