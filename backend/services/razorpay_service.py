"""Razorpay integration (real + dev-mode)."""
from __future__ import annotations
import os
import hmac
import hashlib
import secrets
import time
import logging

logger = logging.getLogger(__name__)


def is_dev_mode() -> bool:
    return os.environ.get("RAZORPAY_DEV_MODE", "false").lower() in ("1", "true", "yes")


def _has_creds() -> bool:
    return bool(os.environ.get("RAZORPAY_KEY_ID") and os.environ.get("RAZORPAY_KEY_SECRET"))


def create_order(amount_paise: int, receipt: str, notes: dict | None = None) -> dict:
    if is_dev_mode() or not _has_creds():
        return {
            "id": f"order_dev_{secrets.token_hex(10)}",
            "amount": amount_paise, "currency": "INR",
            "receipt": receipt, "status": "created", "mock": True,
        }
    import razorpay
    client = razorpay.Client(auth=(os.environ["RAZORPAY_KEY_ID"], os.environ["RAZORPAY_KEY_SECRET"]))
    order = client.order.create({"amount": amount_paise, "currency": "INR", "receipt": receipt, "notes": notes or {}})
    return order


def verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    if is_dev_mode() or not _has_creds():
        return True  # dev-mode: always succeed
    secret = os.environ["RAZORPAY_KEY_SECRET"].encode()
    payload = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    if is_dev_mode() or not os.environ.get("RAZORPAY_WEBHOOK_SECRET"):
        return True
    secret = os.environ["RAZORPAY_WEBHOOK_SECRET"].encode()
    expected = hmac.new(secret, body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def public_key_id() -> str:
    return os.environ.get("RAZORPAY_KEY_ID", "rzp_test_dev_mock")
