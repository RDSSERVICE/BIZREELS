"""Identity Verification service — 4 doc types (aadhaar/pan/gst/bank).

Extends the Phase 4 single-doc KYC model to a per-doc-type model where a user
can submit 1 document per type. Each doc is stored in `kyc_documents` with a
`doc_type` field. Dev-mode auto-approves after immediate save; production
mode either waits for admin manual review or delegates to a KYC provider
service (see `services/kyc_provider_service.py` — TODO).
"""
from __future__ import annotations
import hashlib
import logging
import os
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from database import get_db

logger = logging.getLogger(__name__)

DOC_TYPES = ("aadhaar", "pan", "gst", "bank")
_KYC_DEV_MODE = os.environ.get("KYC_DEV_MODE", "true").strip().lower() == "true"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _mask(number: str) -> str:
    """Mask all but the last 4 chars for API responses."""
    if not number:
        return ""
    return ("X" * max(0, len(number) - 4)) + number[-4:]


def _hash(number: str) -> str:
    return hashlib.sha256((number or "").encode()).hexdigest()


def _serialize(doc: dict) -> dict:
    """Trim + mask sensitive fields for API responses."""
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "doc_type": doc.get("doc_type"),
        "doc_number_masked": _mask(doc.get("doc_number", "")),
        "doc_url": doc.get("doc_url"),
        "status": doc.get("status"),
        "verification_method": doc.get("verification_method"),
        "verification_provider": doc.get("verification_provider"),
        "additional_data": {
            k: v for k, v in (doc.get("additional_data") or {}).items()
            if k in ("bank_name", "holder_name", "ifsc_last4")  # never leak account_number
        },
        "submitted_at": doc.get("submitted_at").isoformat() if doc.get("submitted_at") else None,
        "verified_at": doc.get("verified_at").isoformat() if doc.get("verified_at") else None,
        "rejection_reason": doc.get("rejection_reason"),
    }


async def submit_document(
    user_id: str,
    doc_type: str,
    doc_number: str,
    doc_url: str,
    additional_data: dict | None = None,
) -> dict:
    """Insert or update a single doc-per-type per user. Dev mode auto-approves."""
    if doc_type not in DOC_TYPES:
        raise HTTPException(400, f"Invalid doc_type. Allowed: {DOC_TYPES}")
    if not doc_url or len(doc_url) > 800:
        raise HTTPException(400, "doc_url required (max 800 chars)")
    if not doc_number or len(doc_number) > 32:
        raise HTTPException(400, "doc_number required (max 32 chars)")

    db = get_db()
    existing = await db.kyc_documents.find_one({
        "user_id": user_id, "doc_type": doc_type, "is_deleted": {"$ne": True},
    })

    # Bank documents need additional_data (ifsc, account_number, holder_name)
    add = dict(additional_data or {})
    if doc_type == "bank":
        if not add.get("ifsc") or not add.get("account_number") or not add.get("holder_name"):
            raise HTTPException(400, "Bank: ifsc, account_number, holder_name required")
        # Store only ifsc_last4 + hashed account_number in additional_data for privacy.
        add["ifsc_last4"] = add["ifsc"][-4:]
        add["account_number_hash"] = _hash(add["account_number"])
        add.pop("account_number", None)  # never persist raw account number

    now = _now()
    status = "approved" if _KYC_DEV_MODE else "pending"
    doc = {
        "user_id": user_id,
        "doc_type": doc_type,
        "doc_number": doc_number,
        "doc_number_hash": _hash(doc_number),
        "doc_url": doc_url,
        "additional_data": add,
        "status": status,
        "verification_method": "api_auto" if _KYC_DEV_MODE else "admin_manual",
        "verification_provider": "mock" if _KYC_DEV_MODE else None,
        "submitted_at": now,
        "verified_at": now if status == "approved" else None,
        "is_deleted": False,
    }
    if existing:
        await db.kyc_documents.update_one(
            {"_id": existing["_id"]},
            {"$set": {**doc, "resubmitted_at": now}},
        )
        doc["_id"] = existing["_id"]
    else:
        res = await db.kyc_documents.insert_one(doc)
        doc["_id"] = res.inserted_id

    # Sync a legacy top-level kyc_status on the user for UI compatibility.
    verified = await has_verified_identity(user_id)
    if verified:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"kyc_status": "approved"}})

    return _serialize(doc)


async def list_documents(user_id: str) -> list[dict]:
    db = get_db()
    docs = await db.kyc_documents.find({
        "user_id": user_id, "is_deleted": {"$ne": True},
    }).to_list(50)
    return [_serialize(d) for d in docs]


async def get_status_summary(user_id: str) -> dict:
    """One-shot summary the frontend uses to render the verification page."""
    docs = await list_documents(user_id)
    by_type = {}
    for d in docs:
        by_type[d["doc_type"]] = d
    has_verified = any(d.get("status") == "approved" for d in docs)
    return {
        "has_verified_identity": has_verified,
        "docs": {t: by_type.get(t) for t in DOC_TYPES},
    }


async def delete_document(user_id: str, doc_id: str) -> dict:
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(400, "Invalid id")
    db = get_db()
    doc = await db.kyc_documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(404, "Not found")
    if str(doc.get("user_id")) != user_id:
        raise HTTPException(403, "Not yours")
    if doc.get("status") == "approved":
        raise HTTPException(409, "Approved documents cannot be deleted — contact support")
    await db.kyc_documents.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {"is_deleted": True, "deleted_at": _now()}},
    )
    return {"ok": True}


async def has_verified_identity(user_id: str) -> bool:
    """True if the user has at least ONE approved KYC document (any type)."""
    db = get_db()
    n = await db.kyc_documents.count_documents({
        "user_id": user_id, "status": "approved", "is_deleted": {"$ne": True},
    })
    return n > 0


async def require_verified_identity(user_id: str) -> None:
    """Raise 403 with a friendly message if the user has no approved KYC doc."""
    if not await has_verified_identity(user_id):
        raise HTTPException(
            status_code=403,
            detail=(
                "Please verify at least one identity document (Aadhaar / PAN / GST / Bank) "
                "to unlock this action. Visit /profile/complete?step=verification."
            ),
        )
