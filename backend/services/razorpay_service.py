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
    from services import settings_service
    return settings_service.get_bool("razorpay", "dev_mode", "RAZORPAY_DEV_MODE", default=False)


def _creds() -> tuple[str, str]:
    from services import settings_service
    return (
        settings_service.get_value("razorpay", "key_id", "RAZORPAY_KEY_ID"),
        settings_service.get_value("razorpay", "key_secret", "RAZORPAY_KEY_SECRET"),
    )


def _has_creds() -> bool:
    kid, ks = _creds()
    return bool(kid and ks)


def create_order(amount_paise: int, receipt: str, notes: dict | None = None) -> dict:
    if is_dev_mode() or not _has_creds():
        return {
            "id": f"order_dev_{secrets.token_hex(10)}",
            "amount": amount_paise, "currency": "INR",
            "receipt": receipt, "status": "created", "mock": True,
        }
    import razorpay
    kid, ks = _creds()
    client = razorpay.Client(auth=(kid, ks))
    order = client.order.create({"amount": amount_paise, "currency": "INR", "receipt": receipt, "notes": notes or {}})
    return order


def verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    if is_dev_mode() or not _has_creds():
        return True  # dev-mode: always succeed
    _, ks = _creds()
    secret = ks.encode()
    payload = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    from services import settings_service
    wh = settings_service.get_value("razorpay", "webhook_secret", "RAZORPAY_WEBHOOK_SECRET")
    if is_dev_mode() or not wh:
        return True
    secret = wh.encode()
    expected = hmac.new(secret, body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def public_key_id() -> str:
    kid, _ = _creds()
    return kid or "rzp_test_dev_mock"
