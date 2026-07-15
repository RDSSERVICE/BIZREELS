"""Trust+ badge — Phase 7f trust-badge upsell.

Vendors with ≥2 verified KYC documents get:
  - "Trusted+ Seller" chip on listings (frontend)
  - +100 credits one-time (idempotent via user.has_received_trusted_plus_bonus)
  - Priority boost in AI vendor matcher (+15) and feed ranking (+15)

Everything is a lightweight read + a one-time award. Called from the KYC
approval hot-path so vendors see the badge instantly on 2nd verification.
"""
from __future__ import annotations
import logging
from bson import ObjectId

from database import get_db

logger = logging.getLogger(__name__)

MIN_DOCS_FOR_TRUST_PLUS = 2
BONUS_CREDITS = 100
MATCH_BOOST = 15   # AI matcher score boost
FEED_BOOST = 15    # Feed rank boost


async def compute_status(user_id: str) -> dict:
    """Fast summary — safe to call on every listing/feed hydrate."""
    db = get_db()
    approved = await db.kyc_documents.count_documents({
        "user_id": user_id, "status": "approved", "is_deleted": {"$ne": True},
    })
    u = await db.users.find_one({"_id": ObjectId(user_id)}, {"has_received_trusted_plus_bonus": 1})
    return {
        "verified_doc_count": approved,
        "is_trusted_plus": approved >= MIN_DOCS_FOR_TRUST_PLUS,
        "bonus_awarded": bool((u or {}).get("has_received_trusted_plus_bonus")),
        "min_required": MIN_DOCS_FOR_TRUST_PLUS,
        "match_boost": MATCH_BOOST,
        "feed_boost": FEED_BOOST,
    }


async def maybe_award_bonus(user_id: str) -> dict:
    """Idempotent: if user has ≥2 approved docs and no prior bonus, credit +100."""
    db = get_db()
    approved = await db.kyc_documents.count_documents({
        "user_id": user_id, "status": "approved", "is_deleted": {"$ne": True},
    })
    if approved < MIN_DOCS_FOR_TRUST_PLUS:
        return {"awarded": False, "reason": f"needs {MIN_DOCS_FOR_TRUST_PLUS} verified docs"}
    u = await db.users.find_one({"_id": ObjectId(user_id)})
    if not u or u.get("has_received_trusted_plus_bonus"):
        return {"awarded": False, "reason": "already awarded"}
    # Credit wallet — earn_credits is idempotent-by-ref_id in wallet_service.
    try:
        from services import wallet_service
        await wallet_service.earn_credits(
            user_id, BONUS_CREDITS,
            reason="trust_plus_bonus", ref_type="kyc",
            ref_id=f"trust_plus:{user_id}",
        )
    except Exception as _e:  # noqa: BLE001
        logger.warning("wallet credit failed: %s", _e)
        # Do NOT flip the flag if credit actually failed — otherwise we mint
        # a phantom-awarded state that blocks retry.
        return {"awarded": False, "reason": f"credit error: {_e!s}"}
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"has_received_trusted_plus_bonus": True,
                  "is_trusted_plus": True}},
    )
    return {"awarded": True, "credits": BONUS_CREDITS}
