"""Contact reveal service — SEC-002 hardening.

The public `/api/v1/vendors/{id}` endpoint no longer returns phone numbers.
Callers must go through this reveal flow, which enforces a per-user daily
rate limit + one of three unlock conditions:

  1. The caller shares an active chat thread OR a deal with the vendor.
  2. The caller has `verified_badge` (KYC-approved + verified subscription).
  3. The caller spends 5 wallet credits.

Every reveal is logged into `contact_reveals` for audit.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from bson import ObjectId

from database import get_db

logger = logging.getLogger(__name__)

REVEAL_CREDIT_COST = 5
DAILY_REVEAL_LIMIT = 5


async def _daily_count(user_id: str) -> int:
    db = get_db()
    since = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    return await db.contact_reveals.count_documents({
        "requester_id": user_id, "created_at": {"$gte": since},
    })


async def _has_active_relationship(requester_id: str, vendor_id: str) -> bool:
    db = get_db()
    if await db.chat_threads.count_documents({
        "customer_id": requester_id, "vendor_id": vendor_id,
        "is_deleted": {"$ne": True},
    }):
        return True
    if await db.deals.count_documents({
        "buyer_id": requester_id, "seller_id": vendor_id,
        "status": {"$in": ["accepted", "completed"]},
    }):
        return True
    return False


async def _has_verified_badge(user_doc: dict) -> bool:
    return bool(user_doc.get("is_subscribed_verified")) and user_doc.get("kyc_status") == "approved"


async def reveal_contact(requester_id: str, vendor_id: str) -> dict:
    """Return {phone, whatsapp_url} for the vendor, gated by the rules above."""
    from fastapi import HTTPException

    if requester_id == vendor_id:
        raise HTTPException(400, "Cannot reveal your own contact")

    db = get_db()
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(400, "Invalid vendor id")

    vendor = await db.users.find_one({"_id": ObjectId(vendor_id), "is_deleted": {"$ne": True}})
    if not vendor:
        raise HTTPException(404, "Vendor not found")

    requester = await db.users.find_one({"_id": ObjectId(requester_id)})
    if not requester:
        raise HTTPException(401, "Requester not found")

    # Daily throttle
    used_today = await _daily_count(requester_id)
    if used_today >= DAILY_REVEAL_LIMIT:
        raise HTTPException(
            429,
            f"Daily reveal limit ({DAILY_REVEAL_LIMIT}) reached. Try again after midnight.",
        )

    # Gate: relationship OR verified OR pay credits
    relationship = await _has_active_relationship(requester_id, vendor_id)
    verified = await _has_verified_badge(requester)
    credits_spent = 0

    if not relationship and not verified:
        # Charge wallet
        try:
            from services import wallet_service
            wallet = await wallet_service.get_or_create(requester_id)
            balance = int(wallet.get("credits", 0))
            if balance < REVEAL_CREDIT_COST:
                raise HTTPException(
                    402,
                    f"Not enough credits ({balance} available; {REVEAL_CREDIT_COST} needed). "
                    "Start a chat with the vendor or subscribe for free reveals.",
                )
            await wallet_service.spend_credits(
                requester_id, REVEAL_CREDIT_COST,
                reason="contact_reveal", ref_type="contact_reveal", ref_id=vendor_id,
            )
            credits_spent = REVEAL_CREDIT_COST
        except HTTPException:
            raise
        except Exception:  # noqa: BLE001
            logger.exception("Wallet spend failed on reveal")
            raise HTTPException(500, "Payment failed. Please try again.")

    phone = vendor.get("phone", "")
    unlock = "relationship" if relationship else ("verified" if verified else "credits")

    await db.contact_reveals.insert_one({
        "requester_id": requester_id,
        "vendor_id": vendor_id,
        "unlock_reason": unlock,
        "credits_spent": credits_spent,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    whatsapp_url = f"https://wa.me/91{phone}" if phone else None
    return {
        "phone": phone,
        "whatsapp_url": whatsapp_url,
        "unlock_reason": unlock,
        "credits_spent": credits_spent,
        "reveals_used_today": used_today + 1,
        "reveals_remaining_today": DAILY_REVEAL_LIMIT - used_today - 1,
    }
