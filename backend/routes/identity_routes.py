"""Identity Verification routes — 4 doc types (aadhaar/pan/gst/bank).

Rate limit: 5/day/user per doc-type via utils/rate_limit.
"""
from __future__ import annotations
import re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from middleware.auth_middleware import require_auth
from services import identity_service
from utils.rate_limit import check_and_record

router = APIRouter(prefix="/v1/kyc", tags=["identity"])

# Simple format validators. Real KYC providers do deeper checks.
_AADHAAR_RE = re.compile(r"^\d{12}$")
_PAN_RE = re.compile(r"^[A-Z]{5}\d{4}[A-Z]$")
_GST_RE = re.compile(r"^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9][Z][A-Z0-9]$")
_IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")


def _rate(user_id: str, doc_type: str) -> None:
    ok, retry = check_and_record(f"kyc:{doc_type}:{user_id}", limit=5, window_seconds=86400)
    if not ok:
        raise HTTPException(429, f"Too many {doc_type} submissions today. Try again in {retry}s")


class AadhaarBody(BaseModel):
    aadhaar_number: str = Field(..., min_length=12, max_length=12)
    doc_url: str = Field(..., max_length=800)


class PanBody(BaseModel):
    pan_number: str = Field(..., min_length=10, max_length=10)
    doc_url: str = Field(..., max_length=800)


class GstBody(BaseModel):
    gst_number: str = Field(..., min_length=15, max_length=15)
    doc_url: str = Field(..., max_length=800)


class BankBody(BaseModel):
    account_number: str = Field(..., min_length=6, max_length=32)
    ifsc: str = Field(..., min_length=11, max_length=11)
    holder_name: str = Field(..., min_length=2, max_length=120)
    bank_name: str | None = Field(default=None, max_length=120)
    doc_url: str = Field(..., max_length=800)


@router.post("/aadhaar/verify")
async def verify_aadhaar(body: AadhaarBody, user=Depends(require_auth)):
    if not _AADHAAR_RE.match(body.aadhaar_number):
        raise HTTPException(400, "Invalid Aadhaar format (12 digits)")
    _rate(str(user.id), "aadhaar")
    return await identity_service.submit_document(
        user_id=str(user.id), doc_type="aadhaar",
        doc_number=body.aadhaar_number, doc_url=body.doc_url,
    )


@router.post("/pan/verify")
async def verify_pan(body: PanBody, user=Depends(require_auth)):
    if not _PAN_RE.match(body.pan_number.upper()):
        raise HTTPException(400, "Invalid PAN format (e.g. ABCDE1234F)")
    _rate(str(user.id), "pan")
    return await identity_service.submit_document(
        user_id=str(user.id), doc_type="pan",
        doc_number=body.pan_number.upper(), doc_url=body.doc_url,
    )


@router.post("/gst/verify")
async def verify_gst(body: GstBody, user=Depends(require_auth)):
    if not _GST_RE.match(body.gst_number.upper()):
        raise HTTPException(400, "Invalid GST format (15 chars)")
    _rate(str(user.id), "gst")
    return await identity_service.submit_document(
        user_id=str(user.id), doc_type="gst",
        doc_number=body.gst_number.upper(), doc_url=body.doc_url,
    )


@router.post("/bank/verify")
async def verify_bank(body: BankBody, user=Depends(require_auth)):
    if not _IFSC_RE.match(body.ifsc.upper()):
        raise HTTPException(400, "Invalid IFSC format")
    _rate(str(user.id), "bank")
    return await identity_service.submit_document(
        user_id=str(user.id), doc_type="bank",
        doc_number=body.account_number, doc_url=body.doc_url,
        additional_data={
            "ifsc": body.ifsc.upper(),
            "account_number": body.account_number,
            "holder_name": body.holder_name.strip(),
            "bank_name": (body.bank_name or "").strip() or None,
        },
    )


@router.get("/me/status")
async def kyc_me_status(user=Depends(require_auth)):
    return await identity_service.get_status_summary(str(user.id))


@router.get("/me/docs")
async def kyc_me_docs(user=Depends(require_auth)):
    return {"items": await identity_service.list_documents(str(user.id))}


@router.delete("/docs/{doc_id}")
async def delete_doc(doc_id: str, user=Depends(require_auth)):
    return await identity_service.delete_document(str(user.id), doc_id)
