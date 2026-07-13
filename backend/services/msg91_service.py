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


def is_dev_mode() -> bool:
    """Dev mode is opt-in ONLY via explicit config. Never fail-open.

    Reads from `platform_settings` first (admin-panel controlled), falls back
    to the OTP_DEV_MODE env var for backwards compatibility.
    """
    from services import settings_service
    return settings_service.get_bool("msg91", "dev_mode", "OTP_DEV_MODE", default=False)


class Msg91ConfigError(RuntimeError):
    """Raised when MSG91 is not configured but dev mode is not enabled."""


async def send_otp_sms(phone: str, otp: str) -> dict:
    """Send OTP SMS via MSG91 Flow API, or mock in DEV MODE.

    Behaviour:
      - If OTP_DEV_MODE=true: returns {"mock": True} and logs the OTP. The OTP is
        NEVER re-echoed by this function; caller decides whether to surface it.
      - Otherwise: sends via MSG91. If MSG91 env vars are missing OR the API
        errors, raises Msg91ConfigError / propagates the HTTP error. FAIL-CLOSED.
    """
    if is_dev_mode():
        logger.info("[MSG91 DEV MODE] Mock OTP for %s: %s", phone, otp)
        return {"mock": True}

    from services import settings_service
    auth_key = settings_service.get_value("msg91", "auth_key", "MSG91_AUTH_KEY")
    template = settings_service.get_value("msg91", "template_id", "MSG91_TEMPLATE_ID")
    sender = settings_service.get_value("msg91", "sender_id", "MSG91_SENDER_ID")
    if not auth_key or not template or not sender:
        raise Msg91ConfigError(
            "MSG91 credentials missing. Set MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, "
            "MSG91_SENDER_ID or enable OTP_DEV_MODE=true for local development."
        )

    payload = {
        "template_id": template,
        "short_url": "0",
        "sender": sender,
        "recipients": [{"mobiles": f"91{phone}", "otp": otp}],
    }
    headers = {
        "authkey": auth_key,
        "accept": "application/json",
        "content-type": "application/json",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(MSG91_FLOW_URL, json=payload, headers=headers)
        res.raise_for_status()
        return {"mock": False, "provider_response": res.json()}


async def send_transactional_sms(phone: str, message: str) -> dict:
    """Send a generic transactional SMS (e.g. price drop). DEV MODE: log-only.

    Real path uses MSG91 flow. Requires the same env keys — falls back to log if missing.
    """
    if is_dev_mode():
        logger.info("[MSG91 DEV MODE] Mock SMS to %s: %s", phone, message)
        return {"mock": True}
    from services import settings_service
    auth_key = settings_service.get_value("msg91", "auth_key", "MSG91_AUTH_KEY")
    sender = settings_service.get_value("msg91", "sender_id", "MSG91_SENDER_ID")
    template = settings_service.get_value("msg91", "txn_template_id", "MSG91_TXN_TEMPLATE_ID")
    if not auth_key or not sender or not template:
        logger.info("[MSG91] transactional SMS skipped (missing keys) to %s: %s", phone, message)
        return {"mock": True, "reason": "missing_keys"}
    payload = {
        "template_id": template,
        "short_url": "0",
        "sender": sender,
        "recipients": [{"mobiles": f"91{phone}", "message": message}],
    }
    headers = {
        "authkey": auth_key,
        "accept": "application/json",
        "content-type": "application/json",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(MSG91_FLOW_URL, json=payload, headers=headers)
        res.raise_for_status()
        return {"mock": False, "provider_response": res.json()}
