"""
MSG91 SMS OTP integration.

MSG91 keys required from user — currently in DEV MODE with mock OTP.
When OTP_DEV_MODE=true OR any of MSG91_AUTH_KEY / MSG91_TEMPLATE_ID / MSG91_SENDER_ID
is missing, the send_otp_sms function logs the OTP to console and returns {"mock": True}.

Switching to real SMS is a one-line change: set OTP_DEV_MODE=false in .env
and populate MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, MSG91_SENDER_ID.
"""
from __future__ import annotations
import os
import logging
import httpx

logger = logging.getLogger(__name__)

MSG91_FLOW_URL = "https://control.msg91.com/api/v5/flow/"


def _is_dev_mode() -> bool:
    dev_flag = os.environ.get("OTP_DEV_MODE", "true").lower() in ("1", "true", "yes")
    auth_key = os.environ.get("MSG91_AUTH_KEY", "").strip()
    template = os.environ.get("MSG91_TEMPLATE_ID", "").strip()
    sender = os.environ.get("MSG91_SENDER_ID", "").strip()
    return dev_flag or not auth_key or not template or not sender


async def send_otp_sms(phone: str, otp: str) -> dict:
    """Send OTP SMS via MSG91 Flow API, or mock in DEV MODE.

    Returns dict:
      - {"mock": True, "dev_otp": "123456"} if in dev/mock mode
      - {"mock": False, "provider_response": {...}} on real send
    """
    if _is_dev_mode():
        logger.info("[MSG91 DEV MODE] Mock OTP for %s: %s", phone, otp)
        return {"mock": True, "dev_otp": otp}

    payload = {
        "template_id": os.environ["MSG91_TEMPLATE_ID"],
        "short_url": "0",
        "sender": os.environ["MSG91_SENDER_ID"],
        "recipients": [{"mobiles": f"91{phone}", "otp": otp}],
    }
    headers = {
        "authkey": os.environ["MSG91_AUTH_KEY"],
        "accept": "application/json",
        "content-type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(MSG91_FLOW_URL, json=payload, headers=headers)
            res.raise_for_status()
            return {"mock": False, "provider_response": res.json()}
    except httpx.HTTPError as exc:
        logger.exception("MSG91 send failed: %s", exc)
        # Don't crash the app; surface as failure so route can decide
        return {"mock": False, "error": str(exc)}
