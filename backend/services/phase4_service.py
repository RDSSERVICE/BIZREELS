"""Reviews + KYC + Subscription + Trust score services."""
from __future__ import annotations
import secrets
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import HTTPException

from database import get_db
from services import notification_service, wallet_service, razorpay_service


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _s(d: dict) -> dict:
    out = dict(d)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    for k in ("reviewer_id", "target_id", "user_id", "listing_id", "deal_id", "payment_id"):
        if isinstance(out.get(k), ObjectId):
            out[k] = str(out[k])
    out.pop("is_deleted", None)
    return out


# =========== REVIEWS ===========
async def create_review(reviewer_id: str, body: dict) -> dict:
    db = get_db()
    if body.get("rating") not in (1, 2, 3, 4, 5):
        raise HTTPException(400, "rating must be 1-5")
    if body.get("target_type") not in ("vendor", "listing", "service"):
        raise HTTPException(400, "invalid target_type")
    if not ObjectId.is_valid(body.get("target_id", "")):
        raise HTTPException(400, "invalid target_id")

    existing = await db.reviews.find_one({
        "reviewer_id": reviewer_id, "target_type": body["target_type"],
        "target_id": body["target_id"], "is_deleted": {"$ne": True},
    })
    if existing:
        raise HTTPException(409, "You already reviewed this. PATCH to update.")

    is_verified_purchase = False
    deal_id = body.get("deal_id")
    if deal_id:
        if not ObjectId.is_valid(deal_id):
            raise HTTPException(400, "invalid deal_id")
        deal = await db.deals.find_one({"_id": ObjectId(deal_id)})
        if not deal:
            raise HTTPException(404, "Deal not found")
        if deal.get("status") != "completed":
            raise HTTPException(403, "Deal is not completed")
        if reviewer_id not in (str(deal.get("buyer_id")), str(deal.get("seller_id"))):
            raise HTTPException(403, "Only deal participants can post a verified review")
        is_verified_purchase = True
    elif body["target_type"] in ("listing", "service"):
        # Listing / service reviews MUST be deal-gated
        raise HTTPException(403, "deal_id required for listing/service reviews")

    doc = {
        "reviewer_id": reviewer_id, "target_type": body["target_type"], "target_id": body["target_id"],
        "listing_id": body.get("listing_id"), "deal_id": body.get("deal_id"),
        "rating": int(body["rating"]), "comment": body.get("comment"),
        "images": body.get("images") or [], "videos": (body.get("videos") or [])[:2],
        "is_verified_purchase": is_verified_purchase, "helpful_count": 0,
        "reply": None, "is_active": True, "is_deleted": False,
        "created_at": _now(), "updated_at": _now(),
    }
    res = await db.reviews.insert_one(doc)
    doc["_id"] = res.inserted_id

    # Update vendor's denormalized rating (if target is vendor)
    if body["target_type"] == "vendor":
        agg = await db.reviews.aggregate([
            {"$match": {"target_type": "vendor", "target_id": body["target_id"], "is_deleted": {"$ne": True}}},
            {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "n": {"$sum": 1}}},
        ]).to_list(1)
        if agg:
            await db.users.update_one(
                {"_id": ObjectId(body["target_id"])},
                {"$set": {"rating_avg": round(agg[0]["avg"], 2), "rating_count": agg[0]["n"]}},
            )
        # Notify vendor
        await notification_service.create(
            user_id=body["target_id"], type_="review",
            title=f"New {doc['rating']}★ review", body=(doc.get("comment") or "")[:120],
            action_url=f"/vendor/{body['target_id']}",
        )
    elif body["target_type"] in ("listing", "service") and ObjectId.is_valid(body["target_id"]):
        # Notify the listing owner (vendor) for listing/service reviews
        listing = await db.listings.find_one({"_id": ObjectId(body["target_id"])})
        if listing and listing.get("vendor_id"):
            vendor_id = str(listing["vendor_id"])
            if vendor_id != reviewer_id:  # avoid self-notify (shouldn't happen — deal gates it)
                await notification_service.create(
                    user_id=vendor_id, type_="review",
                    title=f"New {doc['rating']}★ review on your listing",
                    body=(doc.get("comment") or listing.get("title") or "")[:120],
                    action_url=f"/listing/{listing.get('slug', body['target_id'])}",
                )

    # Credit for verified purchase review
    if is_verified_purchase:
        await wallet_service.earn_credits(reviewer_id, wallet_service.CREDIT_RULES["verified_purchase_review"], "Verified purchase review", "review", str(res.inserted_id))

    return _s(doc)


async def list_reviews(target_type: str, target_id: str, sort: str = "recent", cursor: str | None = None, limit: int = 20) -> dict:
    db = get_db()
    q: dict = {"target_type": target_type, "target_id": target_id, "is_deleted": {"$ne": True}}
    if cursor and ObjectId.is_valid(cursor):
        q["_id"] = {"$lt": ObjectId(cursor)}
    sort_spec = {"recent": [("_id", -1)], "helpful": [("helpful_count", -1), ("_id", -1)],
                 "rating_high": [("rating", -1), ("_id", -1)], "rating_low": [("rating", 1), ("_id", -1)]}.get(sort, [("_id", -1)])
    docs = await db.reviews.find(q).sort(sort_spec).limit(limit + 1).to_list(limit + 1)
    has_more = len(docs) > limit
    docs = docs[:limit]
    # Attach reviewer basic info
    rids = list({d["reviewer_id"] for d in docs})
    users = await db.users.find({"_id": {"$in": [ObjectId(r) for r in rids if ObjectId.is_valid(r)]}}).to_list(len(rids)) if rids else []
    umap = {str(u["_id"]): u for u in users}
    items = []
    for d in docs:
        item = _s(d)
        u = umap.get(item["reviewer_id"], {})
        item["reviewer"] = {"id": item["reviewer_id"], "name": u.get("name"), "profile_pic": u.get("profile_pic")}
        items.append(item)
    return {"items": items, "next_cursor": items[-1]["id"] if has_more and items else None, "has_more": has_more}


async def summary(target_type: str, target_id: str) -> dict:
    db = get_db()
    agg = await db.reviews.aggregate([
        {"$match": {"target_type": target_type, "target_id": target_id, "is_deleted": {"$ne": True}}},
        {"$group": {"_id": "$rating", "n": {"$sum": 1}}},
    ]).to_list(10)
    dist = {i: 0 for i in range(1, 6)}
    total = 0
    total_rating = 0
    for row in agg:
        dist[int(row["_id"])] = row["n"]
        total += row["n"]
        total_rating += row["_id"] * row["n"]
    vp = await db.reviews.count_documents({"target_type": target_type, "target_id": target_id, "is_deleted": {"$ne": True}, "is_verified_purchase": True})
    return {
        "avg_rating": round(total_rating / total, 2) if total else 0.0,
        "total_reviews": total, "distribution": dist, "verified_purchase_count": vp,
    }


async def reply_to_review(review_id: str, replier_id: str, text: str) -> dict:
    db = get_db()
    r = await db.reviews.find_one({"_id": ObjectId(review_id), "is_deleted": {"$ne": True}})
    if not r:
        raise HTTPException(404, "Review not found")
    # Vendor whose id matches target OR listing's vendor
    ok = (r["target_type"] == "vendor" and r["target_id"] == replier_id)
    if not ok and r.get("listing_id"):
        listing = await db.listings.find_one({"_id": ObjectId(r["listing_id"])})
        if listing and str(listing.get("vendor_id")) == replier_id:
            ok = True
    if not ok:
        raise HTTPException(403, "Only the reviewed vendor can reply")
    reply = {"text": text.strip()[:500], "replied_at": _now()}
    await db.reviews.update_one({"_id": ObjectId(review_id)}, {"$set": {"reply": reply, "updated_at": _now()}})
    return {"ok": True, "reply": reply}


async def update_review(review_id: str, reviewer_id: str, body: dict) -> dict:
    db = get_db()
    r = await db.reviews.find_one({"_id": ObjectId(review_id)})
    if not r or str(r["reviewer_id"]) != reviewer_id:
        raise HTTPException(403, "Not your review")
    allowed = {"rating", "comment", "images", "videos"}
    clean = {k: v for k, v in body.items() if k in allowed and v is not None}
    if "rating" in clean and clean["rating"] not in (1, 2, 3, 4, 5):
        raise HTTPException(400, "invalid rating")
    clean["updated_at"] = _now()
    await db.reviews.update_one({"_id": ObjectId(review_id)}, {"$set": clean})
    return _s(await db.reviews.find_one({"_id": ObjectId(review_id)}))


async def soft_delete_review(review_id: str, reviewer_id: str, is_admin: bool = False) -> None:
    db = get_db()
    r = await db.reviews.find_one({"_id": ObjectId(review_id)})
    if not r:
        raise HTTPException(404, "Not found")
    if not is_admin and str(r["reviewer_id"]) != reviewer_id:
        raise HTTPException(403, "Not yours")
    await db.reviews.update_one({"_id": ObjectId(review_id)}, {"$set": {"is_deleted": True}})


async def toggle_helpful(review_id: str, user_id: str) -> dict:
    """Toggle helpful flag on a review. Unique per (user, review). Updates denormalized count."""
    db = get_db()
    if not ObjectId.is_valid(review_id):
        raise HTTPException(400, "Invalid id")
    r = await db.reviews.find_one({"_id": ObjectId(review_id), "is_deleted": {"$ne": True}})
    if not r:
        raise HTTPException(404, "Review not found")
    if str(r.get("reviewer_id")) == user_id:
        raise HTTPException(403, "You can't mark your own review helpful")
    existing = await db.interactions.find_one({
        "user_id": user_id, "review_id": review_id, "type": "helpful",
    })
    if existing:
        await db.interactions.delete_one({"_id": existing["_id"]})
        await db.reviews.update_one({"_id": ObjectId(review_id)}, {"$inc": {"helpful_count": -1}})
        marked = False
    else:
        # NB: interactions unique index is (user_id, listing_id, type). We use a distinct
        # 'review_id' field here; no listing_id so it won't collide.
        try:
            await db.interactions.insert_one({
                "user_id": user_id, "review_id": review_id, "type": "helpful",
                "created_at": _now(),
            })
        except Exception:  # noqa: BLE001
            pass
        await db.reviews.update_one({"_id": ObjectId(review_id)}, {"$inc": {"helpful_count": 1}})
        marked = True
    updated = await db.reviews.find_one({"_id": ObjectId(review_id)}, {"helpful_count": 1})
    return {"ok": True, "marked_helpful": marked, "helpful_count": int(updated.get("helpful_count", 0))}


# =========== KYC ===========
async def kyc_submit(user_id: str, body: dict) -> dict:
    db = get_db()
    existing = await db.kyc_documents.find_one({"user_id": user_id, "status": "pending", "is_deleted": {"$ne": True}})
    if existing:
        raise HTTPException(409, "You have a KYC pending review")
    if body.get("doc_type") not in ("aadhaar", "pan", "driving_license", "passport"):
        raise HTTPException(400, "Invalid doc_type")
    doc = {
        "user_id": user_id, "doc_type": body["doc_type"], "doc_number": body["doc_number"],
        "doc_url": body["doc_url"], "selfie_url": body.get("selfie_url"),
        "status": "pending", "submitted_at": _now(), "is_deleted": False,
    }
    res = await db.kyc_documents.insert_one(doc)
    doc["_id"] = res.inserted_id
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"kyc_status": "pending"}})
    return _s(doc)


async def my_kyc(user_id: str) -> dict | None:
    db = get_db()
    doc = await db.kyc_documents.find_one({"user_id": user_id, "is_deleted": {"$ne": True}}, sort=[("_id", -1)])
    if not doc:
        return None
    out = _s(doc)
    out["doc_number"] = ("X" * max(0, len(out["doc_number"]) - 4)) + out["doc_number"][-4:]
    return out


async def kyc_queue() -> list[dict]:
    db = get_db()
    docs = await db.kyc_documents.find({"status": "pending", "is_deleted": {"$ne": True}}).sort([("_id", 1)]).to_list(100)
    return [_s(d) for d in docs]


async def kyc_review(kid: str, admin_id: str, approve: bool, reason: str | None = None) -> dict:
    db = get_db()
    if not ObjectId.is_valid(kid):
        raise HTTPException(400, "Invalid id")
    doc = await db.kyc_documents.find_one({"_id": ObjectId(kid)})
    if not doc:
        raise HTTPException(404, "Not found")
    new_status = "approved" if approve else "rejected"
    await db.kyc_documents.update_one(
        {"_id": ObjectId(kid)},
        {"$set": {"status": new_status, "reviewed_by": admin_id, "reviewed_at": _now(), "rejection_reason": reason}},
    )
    user_id = str(doc["user_id"])
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"kyc_status": new_status}})
    await notification_service.create(
        user_id=user_id, type_="verification",
        title=f"KYC {new_status}",
        body=reason or ("Your KYC has been approved." if approve else "Please resubmit."),
        action_url="/kyc",
    )
    return {"ok": True, "status": new_status}


# =========== SUBSCRIPTIONS ===========
PLAN_PAISE = {"verified_monthly": 9900, "verified_yearly": 49900}
PLAN_DAYS = {"verified_monthly": 30, "verified_yearly": 365}


async def create_sub_order(user_id: str, plan: str) -> dict:
    if plan not in PLAN_PAISE:
        raise HTTPException(400, "Invalid plan")
    return await create_payment_order(
        user_id=user_id,
        purpose=f"verified_badge_{plan.split('_')[1]}",
        amount_paise=PLAN_PAISE[plan],
        ref_id=plan,
    )


async def activate_subscription_from_payment(payment: dict) -> dict:
    """Called after successful payment for a subscription purpose.
    If user already has an ACTIVE non-expired subscription for the same plan, extend it.
    Otherwise create a new subscription.
    Returns the subscription doc (serialized).
    """
    db = get_db()
    purpose = payment.get("purpose", "")
    plan = None
    if purpose == "verified_badge_monthly":
        plan = "verified_monthly"
    elif purpose == "verified_badge_yearly":
        plan = "verified_yearly"
    if not plan:
        return {}
    user_id = str(payment["user_id"])
    now = datetime.now(timezone.utc)
    add_days = PLAN_DAYS[plan]

    # Look for an active same-plan sub that hasn't expired yet
    active = await db.subscriptions.find_one({
        "user_id": user_id, "plan": plan, "status": "active",
    })
    extended = False
    if active:
        try:
            current_expiry = datetime.fromisoformat(str(active.get("expires_at", "")).replace("Z", "+00:00"))
        except Exception:  # noqa: BLE001
            current_expiry = now
        base_from = current_expiry if current_expiry > now else now
        new_expiry = base_from + timedelta(days=add_days)
        await db.subscriptions.update_one(
            {"_id": active["_id"]},
            {"$set": {
                "expires_at": new_expiry.isoformat(),
                "updated_at": _now(),
                "last_payment_id": str(payment["_id"]),
            }, "$push": {"payment_ids": str(payment["_id"])}},
        )
        sub_doc = await db.subscriptions.find_one({"_id": active["_id"]})
        extended = True
    else:
        expires = now + timedelta(days=add_days)
        sub_doc = {
            "user_id": user_id, "plan": plan, "status": "active",
            "started_at": now.isoformat(), "expires_at": expires.isoformat(),
            "auto_renew": False, "payment_id": str(payment["_id"]),
            "payment_ids": [str(payment["_id"])],
            "created_at": _now(), "updated_at": _now(),
        }
        res = await db.subscriptions.insert_one(sub_doc)
        sub_doc["_id"] = res.inserted_id

    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_subscribed_verified": True}})
    await notification_service.create(
        user_id=user_id, type_="verification",
        title=("Verified subscription extended" if extended else "Verified subscription active"),
        body=f"You're subscribed to {plan}. Verified badge shows when KYC is also approved.",
        action_url="/subscriptions",
    )
    return _s(sub_doc)


async def my_subs(user_id: str) -> list[dict]:
    db = get_db()
    docs = await db.subscriptions.find({"user_id": user_id}).sort([("_id", -1)]).to_list(50)
    return [_s(d) for d in docs]


async def cancel_sub(sub_id: str, user_id: str) -> dict:
    db = get_db()
    s = await db.subscriptions.find_one({"_id": ObjectId(sub_id), "user_id": user_id})
    if not s:
        raise HTTPException(404, "Not found")
    await db.subscriptions.update_one({"_id": ObjectId(sub_id)}, {"$set": {"auto_renew": False, "updated_at": _now()}})
    return {"ok": True}


# =========== PAYMENTS ===========
async def create_payment_order(user_id: str, purpose: str, amount_paise: int, ref_id: str | None = None) -> dict:
    db = get_db()
    if amount_paise <= 0:
        raise HTTPException(400, "amount must be > 0")
    receipt = f"rcpt_{secrets.token_hex(6)}"
    order = razorpay_service.create_order(amount_paise, receipt, notes={"purpose": purpose, "user_id": user_id})
    doc = {
        "user_id": user_id, "purpose": purpose, "ref_id": ref_id,
        "amount_paise": amount_paise, "currency": "INR",
        "razorpay_order_id": order["id"], "razorpay_payment_id": None, "razorpay_signature": None,
        "status": "created", "receipt": receipt, "notes": order.get("notes", {}),
        "attempts": [], "created_at": _now(), "updated_at": _now(),
    }
    res = await db.payments.insert_one(doc)
    return {
        "payment_id": str(res.inserted_id),
        "razorpay_order_id": order["id"],
        "amount_paise": amount_paise, "currency": "INR",
        "key_id": razorpay_service.public_key_id(),
        "receipt": receipt, "dev_mode": razorpay_service.is_dev_mode(),
    }


async def verify_and_capture(user_id: str, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> dict:
    db = get_db()
    payment = await db.payments.find_one({"razorpay_order_id": razorpay_order_id, "user_id": user_id})
    if not payment:
        raise HTTPException(404, "Payment not found")
    if not razorpay_service.verify_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        await db.payments.update_one({"_id": payment["_id"]}, {"$set": {"status": "failed", "updated_at": _now()}})
        raise HTTPException(400, "Invalid signature")
    return await _apply_success(payment, razorpay_payment_id, razorpay_signature)


async def dev_simulate_success(payment_id: str, user_id: str) -> dict:
    if not razorpay_service.is_dev_mode():
        raise HTTPException(403, "Dev-mode only")
    db = get_db()
    payment = await db.payments.find_one({"_id": ObjectId(payment_id), "user_id": user_id})
    if not payment:
        raise HTTPException(404, "Not found")
    fake_pay_id = f"pay_dev_{secrets.token_hex(10)}"
    return await _apply_success(payment, fake_pay_id, "dev_signature")


async def _apply_success(payment: dict, razorpay_payment_id: str, signature: str) -> dict:
    db = get_db()
    if payment.get("status") == "captured":
        # Idempotent — attempt to reattach subscription if applicable
        out = _s(payment)
        if payment.get("purpose", "").startswith("verified_badge"):
            existing = await db.subscriptions.find_one({"payment_id": str(payment["_id"])})
            if existing:
                out["subscription"] = _s(existing)
        return out
    await db.payments.update_one(
        {"_id": payment["_id"]},
        {"$set": {"status": "captured", "razorpay_payment_id": razorpay_payment_id,
                  "razorpay_signature": signature, "updated_at": _now()},
         "$push": {"attempts": {"at": _now(), "event": "captured"}}},
    )
    payment = await db.payments.find_one({"_id": payment["_id"]})
    user_id = str(payment["user_id"])
    purpose = payment["purpose"]
    subscription_out: dict | None = None

    if purpose == "wallet_topup":
        await wallet_service.deposit_inr(user_id, payment["amount_paise"], "Wallet top-up", str(payment["_id"]), razorpay_payment_id)
    elif purpose in ("verified_badge_monthly", "verified_badge_yearly"):
        subscription_out = await activate_subscription_from_payment(payment)
    elif purpose == "listing_boost":
        try:
            from services import boost_service
            await boost_service.activate_boost_from_payment(payment)
        except Exception:  # noqa: BLE001
            pass

    await notification_service.create(
        user_id=user_id, type_="payment",
        title="Payment successful",
        body=f"₹{payment['amount_paise']/100:.2f} · {purpose}",
        action_url="/wallet",
    )
    out = _s(payment)
    if subscription_out:
        out["subscription"] = subscription_out
    return out


async def my_payments(user_id: str) -> list[dict]:
    db = get_db()
    docs = await db.payments.find({"user_id": user_id}).sort([("_id", -1)]).limit(50).to_list(50)
    return [_s(d) for d in docs]


# =========== TRUST SCORE ===========
async def _has_active_verified_sub(user_id: str) -> bool:
    """Check DB directly for an active non-expired verified sub."""
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    sub = await db.subscriptions.find_one({
        "user_id": user_id, "status": "active",
        "plan": {"$in": ["verified_monthly", "verified_yearly"]},
        "expires_at": {"$gt": now_iso},
    })
    return sub is not None


async def trust_score(user_id: str) -> dict:
    db = get_db()
    u = await db.users.find_one({"_id": ObjectId(user_id)})
    if not u:
        raise HTTPException(404, "Not found")

    completed = await db.deals.count_documents({"$or": [{"seller_id": user_id}, {"buyer_id": user_id}], "status": "completed"})

    # Reviews aggregated across ALL surfaces owned by this user:
    #  - target_type="vendor" with target_id=user_id
    #  - target_type in ("listing","service") where the listing's vendor_id=user_id
    listing_ids = [str(li["_id"]) async for li in db.listings.find({"vendor_id": user_id, "is_deleted": {"$ne": True}}, {"_id": 1})]
    review_match = {
        "$or": [
            {"target_type": "vendor", "target_id": user_id},
            {"target_type": {"$in": ["listing", "service"]}, "target_id": {"$in": listing_ids}} if listing_ids else {"_id": None},
        ],
        "is_deleted": {"$ne": True},
    }
    reviews_agg = await db.reviews.aggregate([
        {"$match": review_match},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "n": {"$sum": 1}}},
    ]).to_list(1)
    avg_rating = round(reviews_agg[0]["avg"], 2) if reviews_agg else 0.0
    total_reviews = reviews_agg[0]["n"] if reviews_agg else 0
    verified_purchase_count = await db.reviews.count_documents({
        **review_match, "is_verified_purchase": True,
    })

    # days_since_join
    try:
        created = datetime.fromisoformat(u["created_at"].replace("Z", "+00:00"))
        days = (datetime.now(timezone.utc) - created).days
    except Exception:  # noqa: BLE001
        days = 0

    # chat response rate — simplified: fraction of threads user has sent a message in
    my_threads = await db.chat_threads.count_documents({"participants": user_id})
    my_msg_threads = await db.messages.distinct("thread_id", {"sender_id": user_id})
    chat_rate = (len(my_msg_threads) / my_threads) if my_threads else 0.0

    is_kyc = u.get("kyc_status") == "approved"
    is_sub = await _has_active_verified_sub(user_id)

    base = 30
    deals_pts = min(30, completed * 3)
    rating_pts = max(-20, min(20, (avg_rating - 3) * 10)) if avg_rating else 0
    chat_pts = min(10, chat_rate * 10)
    age_pts = min(10, days / 10)
    kyc_pts = 10 if is_kyc else 0
    subs_pts = 5 if is_sub else 0

    score = max(0, min(100, round(base + deals_pts + rating_pts + chat_pts + age_pts + kyc_pts + subs_pts)))
    tier = "newcomer" if score < 30 else "trusted" if score < 60 else "top-rated" if score < 85 else "elite"

    # Denormalize onto user doc
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"trust_score": int(score), "is_subscribed_verified": bool(is_sub)}})

    return {
        "score": score, "tier": tier,
        "breakdown": {
            "base": base, "deals_completed": completed, "deals_pts": deals_pts,
            "avg_rating": avg_rating, "total_reviews": total_reviews,
            "verified_purchase_count": verified_purchase_count, "rating_pts": rating_pts,
            "chat_response_rate": round(chat_rate, 2), "chat_pts": round(chat_pts, 1),
            "days_since_join": days, "age_pts": round(age_pts, 1),
            "kyc_approved": is_kyc, "kyc_pts": kyc_pts,
            "is_subscribed_verified": is_sub, "subs_pts": subs_pts,
        },
    }
