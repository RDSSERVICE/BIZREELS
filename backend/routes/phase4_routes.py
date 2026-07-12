"""Phase 4a routes — reviews, notifications, wallet, payments, subs, KYC, trust, admin/kyc."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import Literal

from middleware.auth_middleware import require_auth
from services import (
    phase4_service as p4, wallet_service, notification_service, razorpay_service,
)

router = APIRouter(prefix="/v1", tags=["phase4"])


def _require_admin(u):
    if "admin" not in (u.roles or []):
        raise HTTPException(403, "Admin only")


# =============== Reviews ===============
class ReviewBody(BaseModel):
    target_type: Literal["vendor", "listing", "service"]
    target_id: str
    rating: int
    comment: str | None = None
    images: list[dict] = Field(default_factory=list)
    videos: list[dict] = Field(default_factory=list)
    deal_id: str | None = None
    listing_id: str | None = None


class ReviewUpdate(BaseModel):
    rating: int | None = None
    comment: str | None = None
    images: list[dict] | None = None
    videos: list[dict] | None = None


class ReplyBody(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


@router.post("/reviews/")
async def create_review(body: ReviewBody, user=Depends(require_auth)):
    return await p4.create_review(user.id, body.model_dump(exclude_none=True))


@router.get("/reviews/")
async def list_reviews(target_type: str, target_id: str, sort: str = "recent",
                      cursor: str | None = None, limit: int = Query(20, ge=1, le=50)):
    return await p4.list_reviews(target_type, target_id, sort, cursor, limit)


@router.patch("/reviews/{rid}")
async def update_review(rid: str, body: ReviewUpdate, user=Depends(require_auth)):
    from bson import ObjectId
    if not ObjectId.is_valid(rid):
        raise HTTPException(400, "Invalid id")
    return await p4.update_review(rid, user.id, body.model_dump(exclude_none=True))


@router.delete("/reviews/{rid}")
async def delete_review(rid: str, user=Depends(require_auth)):
    from bson import ObjectId
    if not ObjectId.is_valid(rid):
        raise HTTPException(400, "Invalid id")
    await p4.soft_delete_review(rid, user.id, is_admin="admin" in (user.roles or []))
    return {"ok": True}


@router.post("/reviews/{rid}/reply")
async def reply_review(rid: str, body: ReplyBody, user=Depends(require_auth)):
    from bson import ObjectId
    if not ObjectId.is_valid(rid):
        raise HTTPException(400, "Invalid id")
    return await p4.reply_to_review(rid, user.id, body.text)


@router.post("/reviews/{rid}/helpful")
async def helpful_review(rid: str, user=Depends(require_auth)):
    return await p4.toggle_helpful(rid, user.id)


@router.get("/reviews/vendor/{vendor_id}/summary")
async def vendor_review_summary(vendor_id: str):
    return await p4.summary("vendor", vendor_id)


# =============== Notifications ===============
@router.get("/notifications/me")
async def my_notifs(is_read: bool | None = None, cursor: str | None = None,
                    limit: int = Query(30, ge=1, le=100), user=Depends(require_auth)):
    return await notification_service.list_mine(user.id, is_read, cursor, limit)


@router.get("/notifications/me/unread-count")
async def notif_unread(user=Depends(require_auth)):
    return {"count": await notification_service.unread_count(user.id)}


@router.post("/notifications/{nid}/read")
async def read_notif(nid: str, user=Depends(require_auth)):
    await notification_service.mark_read(nid, user.id)
    return {"ok": True}


@router.post("/notifications/me/read-all")
async def read_all(user=Depends(require_auth)):
    await notification_service.mark_all_read(user.id)
    return {"ok": True}


@router.delete("/notifications/{nid}")
async def dismiss(nid: str, user=Depends(require_auth)):
    await notification_service.dismiss(nid, user.id)
    return {"ok": True}


# =============== Wallet ===============
@router.get("/wallet/me")
async def wallet_me(user=Depends(require_auth)):
    w = await wallet_service.get_or_create(user.id)
    txns = await wallet_service.list_transactions(user.id, 20)
    return {"wallet": w, "transactions": txns}


@router.get("/wallet/me/transactions")
async def wallet_txns(limit: int = Query(50, ge=1, le=200), user=Depends(require_auth)):
    return {"items": await wallet_service.list_transactions(user.id, limit)}


class TopupBody(BaseModel):
    amount_paise: int = Field(..., ge=100)


@router.post("/wallet/me/topup")
async def wallet_topup(body: TopupBody, user=Depends(require_auth)):
    return await p4.create_payment_order(user.id, "wallet_topup", body.amount_paise)


# =============== Payments ===============
class PaymentOrderBody(BaseModel):
    purpose: Literal["verified_badge_monthly", "verified_badge_yearly", "wallet_topup", "listing_boost", "other"]
    amount_paise: int | None = None
    ref_id: str | None = None


class VerifyBody(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/payments/order")
async def create_order(body: PaymentOrderBody, user=Depends(require_auth)):
    amt = body.amount_paise
    if body.purpose.startswith("verified_badge"):
        amt = p4.PLAN_PAISE.get(f"verified_{body.purpose.split('_')[-1]}") or amt
    if not amt or amt <= 0:
        raise HTTPException(400, "amount required")
    return await p4.create_payment_order(user.id, body.purpose, amt, body.ref_id)


@router.post("/payments/verify")
async def verify_payment(body: VerifyBody, user=Depends(require_auth)):
    return await p4.verify_and_capture(user.id, body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)


@router.post("/payments/dev/simulate-success")
async def simulate_success(payment_id: str, user=Depends(require_auth)):
    return await p4.dev_simulate_success(payment_id, user.id)


@router.get("/payments/me")
async def my_payments(user=Depends(require_auth)):
    return {"items": await p4.my_payments(user.id)}


@router.post("/payments/webhook")
async def razorpay_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("x-razorpay-signature", "")
    if not razorpay_service.verify_webhook_signature(body, sig):
        raise HTTPException(400, "Invalid webhook signature")
    import json
    try:
        payload = json.loads(body)
    except Exception:  # noqa: BLE001
        raise HTTPException(400, "Bad payload")
    event = payload.get("event", "")
    pay_entity = (payload.get("payload", {}).get("payment") or {}).get("entity") or {}
    order_id = pay_entity.get("order_id")
    if event == "payment.captured" and order_id:
        from database import get_db
        db = get_db()
        pdoc = await db.payments.find_one({"razorpay_order_id": order_id})
        if pdoc and pdoc.get("status") != "captured":
            await p4._apply_success(pdoc, pay_entity.get("id", ""), request.headers.get("x-razorpay-signature", ""))
    return {"ok": True}


# =============== Subscriptions ===============
class SubBody(BaseModel):
    plan: Literal["verified_monthly", "verified_yearly"]


@router.post("/subscriptions/subscribe")
async def subscribe(body: SubBody, user=Depends(require_auth)):
    return await p4.create_sub_order(user.id, body.plan)


@router.get("/subscriptions/me")
async def my_subs(user=Depends(require_auth)):
    return {"items": await p4.my_subs(user.id)}


@router.post("/subscriptions/{sid}/cancel")
async def cancel_sub(sid: str, user=Depends(require_auth)):
    return await p4.cancel_sub(sid, user.id)


# =============== KYC ===============
class KycBody(BaseModel):
    doc_type: Literal["aadhaar", "pan", "driving_license", "passport"]
    doc_number: str = Field(..., min_length=4, max_length=32)
    doc_url: str
    selfie_url: str | None = None


@router.post("/kyc/me/submit")
async def kyc_submit(body: KycBody, user=Depends(require_auth)):
    return await p4.kyc_submit(user.id, body.model_dump(exclude_none=True))


@router.get("/kyc/me")
async def kyc_me(user=Depends(require_auth)):
    return await p4.my_kyc(user.id) or {"status": "unverified"}


# =============== Admin ===============
class KycActionBody(BaseModel):
    reason: str | None = None


@router.get("/admin/kyc")
async def admin_kyc_queue(user=Depends(require_auth)):
    _require_admin(user)
    return {"items": await p4.kyc_queue()}


@router.post("/admin/kyc/{kid}/approve")
async def admin_approve(kid: str, user=Depends(require_auth)):
    _require_admin(user)
    return await p4.kyc_review(kid, user.id, approve=True)


@router.post("/admin/kyc/{kid}/reject")
async def admin_reject(
    kid: str,
    body: KycActionBody | None = None,
    reason: str | None = None,  # query param for backward compat
    user=Depends(require_auth),
):
    _require_admin(user)
    final_reason = (body.reason if body else None) or reason
    return await p4.kyc_review(kid, user.id, approve=False, reason=final_reason)


# =============== Trust Score ===============
@router.get("/users/{user_id}/trust-score")
async def trust(user_id: str):
    return await p4.trust_score(user_id)
