"""AI content generation service — powered by Emergent Universal LLM Key.

Uses emergentintegrations.llm.chat for provider-agnostic access to OpenAI /
Anthropic / Gemini. One-shot structured JSON generation (send_message, no
streaming needed — the caller wants a single validated JSON payload).

Config precedence (highest → lowest):
  1. platform_settings.ai_content (admin panel)
  2. environment variables (AI_PROVIDER, AI_MODEL, EMERGENT_LLM_KEY)
  3. hard-coded defaults ("openai" / "gpt-5.4")

SEC-003: a global daily-token cap prevents multi-account abuse from draining
the shared LLM budget. Cap defaults to 100_000 tokens/day, configurable via
platform_settings.ai_content.daily_tokens_cap.
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from database import get_db

logger = logging.getLogger(__name__)

DEFAULT_PROVIDER = "openai"
DEFAULT_MODEL = "gpt-5.4"
DEFAULT_DAILY_CAP = 100_000  # tokens/day platform-wide

# ------------------------------------------------------------------ config
def _cfg() -> dict[str, Any]:
    from services import settings_service
    snap = settings_service.get_integration_sync("ai_content")
    provider = (snap.get("provider") or os.environ.get("AI_PROVIDER") or DEFAULT_PROVIDER).strip()
    model = (snap.get("model") or os.environ.get("AI_MODEL") or DEFAULT_MODEL).strip()
    api_key = (snap.get("api_key") or "").strip() or os.environ.get("EMERGENT_LLM_KEY", "").strip()
    enabled = snap.get("enabled")
    if enabled is None:
        enabled = os.environ.get("AI_DEV_MODE", "false").lower() not in ("1", "true", "yes")
    return {"provider": provider, "model": model, "api_key": api_key, "enabled": bool(enabled)}


def is_configured() -> bool:
    return bool(_cfg().get("api_key"))


# ------------------------------------------------------------------ SEC-003 daily budget
def _today_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


async def _get_daily_cap() -> int:
    from services import settings_service
    snap = settings_service.get_integration_sync("ai_content")
    try:
        cap = int(snap.get("daily_tokens_cap") or DEFAULT_DAILY_CAP)
        return max(1000, cap)
    except (TypeError, ValueError):
        return DEFAULT_DAILY_CAP


async def get_usage_today() -> dict:
    """Return {used, cap, day} — used across all users for the current UTC day."""
    db = get_db()
    day = _today_key()
    doc = await db.ai_usage.find_one({"_id": day})
    used = int((doc or {}).get("tokens_used", 0))
    cap = await _get_daily_cap()
    return {"day": day, "tokens_used": used, "tokens_cap": cap,
            "tokens_remaining": max(0, cap - used)}


async def _ensure_budget_or_raise(estimate_tokens: int = 1200) -> None:
    """Enforce the global daily cap before an LLM call. Raises 429 when hit."""
    u = await get_usage_today()
    if u["tokens_used"] + estimate_tokens > u["tokens_cap"]:
        raise HTTPException(
            429,
            f"Global AI budget for today reached ({u['tokens_used']}/{u['tokens_cap']} "
            "tokens). Try again after UTC midnight.",
        )


async def _record_tokens(tokens: int) -> None:
    if tokens <= 0:
        return
    db = get_db()
    await db.ai_usage.update_one(
        {"_id": _today_key()},
        {"$inc": {"tokens_used": int(tokens)},
         "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )


# ------------------------------------------------------------------ chat
def _chat(system_message: str):
    from emergentintegrations.llm.chat import LlmChat
    cfg = _cfg()
    if not cfg["api_key"]:
        raise RuntimeError("AI not configured: EMERGENT_LLM_KEY / api_key missing")
    if not cfg["enabled"]:
        raise RuntimeError("AI is disabled by admin (enabled=false)")
    return (
        LlmChat(
            api_key=cfg["api_key"],
            session_id=f"emergent-listing-{uuid.uuid4().hex[:12]}",
            system_message=system_message,
        )
        .with_model(cfg["provider"], cfg["model"])
    )


def _parse_json_strict(raw: str) -> dict:
    """Best-effort JSON extraction. LLMs sometimes wrap in ```json ...``` fences."""
    if not raw:
        raise ValueError("empty response")
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.S)
    if m:
        raw = m.group(1)
    else:
        # Grab first { ... } block
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end > start:
            raw = raw[start:end + 1]
    return json.loads(raw)


# ------------------------------------------------------------------ prompts
_SYSTEM_LISTING = (
    "You are an expert Indian marketplace listing writer. Generate SEO-friendly, "
    "engaging, culturally-aware content for products/services sold in India. "
    "Users are Indian buyers — use ₹ pricing, Indian cultural references (festivals, "
    "regional products, cities), and speak with a friendly-professional tone. "
    "Output MUST be valid JSON that matches the schema in the user message — no "
    "commentary, no markdown fences. If a field doesn't apply to the listing type, "
    "return an empty array/null. Never invent brand names or false claims."
)

_SYSTEM_IMPROVE = (
    "You are an editor rewriting a marketplace listing description for Indian buyers. "
    "Keep facts identical, improve clarity, add emotional hooks and a soft CTA, "
    "match the requested tone. Output MUST be a single JSON object: "
    '{"description": "..."}. No markdown fences.'
)


def _listing_schema_prompt() -> str:
    return (
        "Return JSON in this exact schema:\n"
        "{\n"
        '  "description": "150-300 word engaging description, 3-5 features, use case, CTA",\n'
        '  "short_description": "≤15 word tagline",\n'
        '  "tags": ["5-10 kebab-case tags"],\n'
        '  "features": ["3-6 bullet-point features"],\n'
        '  "variants": [ /* products → {name,type:"size|color|material|custom",options:[]};\n'
        '                 services → {name,price_hint_inr,features:[]} tiers */ ],\n'
        '  "suggested_price_range_inr": {"min": int, "max": int},\n'
        '  "warranty_suggestion": "string, only for new_product; empty otherwise"\n'
        "}"
    )


# ------------------------------------------------------------------ public API
async def generate_listing_content(
    title: str,
    category_name: str | None,
    sub_category_name: str | None,
    listing_type: str,
    hints: str | None = None,
    media: dict | None = None,
) -> dict:
    """One-shot structured generation. Returns dict with ok/generated/meta.

    Phase 7f: `media` may include `video_url`, `audio_url`, `image_urls[]`. The
    URLs are appended to the prompt with clear labels so Gemini 2.5-pro (which
    supports multimodal via URL) can factor them into the generation.
    """
    from emergentintegrations.llm.chat import UserMessage
    await _ensure_budget_or_raise(estimate_tokens=1800)
    started = time.time()
    cfg = _cfg()
    prompt = (
        f"Generate a marketplace listing.\n"
        f"- Title: {title}\n"
        f"- Type: {listing_type}\n"
        f"- Category: {category_name or 'general'}"
        + (f" > {sub_category_name}" if sub_category_name else "")
        + "\n"
        + (f"- Extra context: {hints}\n" if hints else "")
    )
    if media:
        if media.get("video_url"):
            prompt += f"- Vendor demo video (analyse for product features): {media['video_url']}\n"
        if media.get("audio_url"):
            prompt += f"- Vendor voice description (analyse for product details): {media['audio_url']}\n"
        img_urls = media.get("image_urls") or []
        if img_urls:
            prompt += f"- Product images ({len(img_urls)}): {', '.join(img_urls[:6])}\n"
    prompt += f"\n{_listing_schema_prompt()}"
    try:
        chat = _chat(_SYSTEM_LISTING)
        raw = await chat.send_message(UserMessage(text=prompt))
        data = _parse_json_strict(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI listing generation failed: %s", exc)
        return {
            "ok": False,
            "error": str(exc)[:400],
            "generated": _empty_listing_struct(listing_type),
            "meta": {"latency_ms": int((time.time() - started) * 1000),
                     "model_used": cfg["model"], "provider": cfg["provider"]},
        }
    # Estimate tokens ≈ 4 chars each; cap to a reasonable ceiling
    approx_tokens = max(400, min(3000, (len(prompt) + len(raw)) // 4))
    await _record_tokens(approx_tokens)
    return {
        "ok": True,
        "generated": _normalize(data, listing_type),
        "meta": {"latency_ms": int((time.time() - started) * 1000),
                 "model_used": cfg["model"], "provider": cfg["provider"],
                 "tokens_used": approx_tokens,
                 "media_used": bool(media and (media.get("video_url") or media.get("audio_url") or media.get("image_urls")))},
    }


async def transcribe_audio(audio_url: str) -> dict:
    """Send the audio URL to Gemini and ask for a plain-text transcript.
    Falls back gracefully on provider failure.
    """
    from emergentintegrations.llm.chat import UserMessage
    await _ensure_budget_or_raise(estimate_tokens=600)
    started = time.time()
    cfg = _cfg()
    prompt = (
        "Transcribe the audio at the URL below into a clean, punctuated English "
        f"transcript. Preserve product / brand names verbatim.\n\nAudio: {audio_url}\n\n"
        'Return JSON: {"transcript": "…", "language": "en|hi|mixed", "confidence": "low|medium|high"}'
    )
    try:
        chat = _chat("You are a professional audio transcriber. Output JSON only.")
        raw = await chat.send_message(UserMessage(text=prompt))
        data = _parse_json_strict(raw)
        approx = max(200, min(2000, (len(prompt) + len(raw)) // 4))
        await _record_tokens(approx)
        return {
            "ok": True,
            "transcript": str(data.get("transcript") or "")[:2000],
            "language": str(data.get("language") or "en"),
            "confidence": str(data.get("confidence") or "medium"),
            "meta": {"provider": cfg["provider"], "model_used": cfg["model"],
                     "tokens_used": approx,
                     "latency_ms": int((time.time() - started) * 1000)},
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI transcribe failed: %s", exc)
        return {"ok": False, "error": str(exc)[:400], "transcript": "",
                "meta": {"provider": cfg["provider"], "model_used": cfg["model"],
                         "latency_ms": int((time.time() - started) * 1000)}}


async def improve_description(current_description: str, title: str, tone: str) -> dict:
    from emergentintegrations.llm.chat import UserMessage
    await _ensure_budget_or_raise(estimate_tokens=800)
    started = time.time()
    cfg = _cfg()
    if tone not in ("professional", "friendly", "hindi_mix"):
        tone = "friendly"
    prompt = (
        f'Rewrite this listing description in a "{tone}" tone. Keep every fact '
        f'unchanged, improve clarity and add a soft CTA at the end.\n\n'
        f"Listing title: {title}\n"
        f'Current description:\n"""\n{current_description}\n"""\n\n'
        'Return: {"description": "..."}'
    )
    try:
        chat = _chat(_SYSTEM_IMPROVE)
        raw = await chat.send_message(UserMessage(text=prompt))
        data = _parse_json_strict(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI improve failed: %s", exc)
        return {"ok": False, "error": str(exc)[:400],
                "description": current_description,
                "meta": {"latency_ms": int((time.time() - started) * 1000),
                         "model_used": cfg["model"], "provider": cfg["provider"]}}
    approx_tokens = max(200, min(1500, (len(prompt) + len(raw)) // 4))
    await _record_tokens(approx_tokens)
    return {"ok": True, "description": str(data.get("description", "") or "").strip(),
            "meta": {"latency_ms": int((time.time() - started) * 1000),
                     "model_used": cfg["model"], "provider": cfg["provider"],
                     "tokens_used": approx_tokens}}


async def ping() -> dict:
    """Tiny generation used by the /admin test-connection button."""
    from emergentintegrations.llm.chat import UserMessage
    started = time.time()
    cfg = _cfg()
    try:
        chat = _chat("Reply with exactly the word 'pong' — no punctuation.")
        raw = await chat.send_message(UserMessage(text="ping"))
        return {"ok": True, "reply": (raw or "").strip()[:40],
                "latency_ms": int((time.time() - started) * 1000),
                "provider": cfg["provider"], "model": cfg["model"]}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "error": str(exc)[:400],
                "latency_ms": int((time.time() - started) * 1000),
                "provider": cfg["provider"], "model": cfg["model"]}


# ------------------------------------------------------------------ helpers
_ALLOWED_VARIANT_TYPES = {"size", "color", "material", "tier", "custom"}


def _normalize(d: dict, listing_type: str) -> dict:
    out = {
        "description": str(d.get("description", "") or "").strip(),
        "short_description": str(d.get("short_description", "") or "").strip(),
        "tags": [str(x).strip().lower().replace(" ", "-") for x in (d.get("tags") or [])][:10],
        "features": [str(x).strip() for x in (d.get("features") or [])][:8],
        "variants": _clean_variants(d.get("variants") or [], listing_type),
        "suggested_price_range_inr": d.get("suggested_price_range_inr") or None,
        "warranty_suggestion": (
            str(d.get("warranty_suggestion", "") or "").strip()
            if listing_type == "new_product" else ""
        ),
    }
    price = out["suggested_price_range_inr"]
    if isinstance(price, dict):
        try:
            out["suggested_price_range_inr"] = {
                "min": int(price.get("min") or 0), "max": int(price.get("max") or 0)
            }
        except (TypeError, ValueError):
            out["suggested_price_range_inr"] = None
    return out


def _clean_variants(vs: list, listing_type: str) -> list:
    if not isinstance(vs, list):
        return []
    cleaned: list = []
    for v in vs[:6]:
        if not isinstance(v, dict):
            continue
        name = str(v.get("name") or "").strip()[:32]
        if not name:
            continue
        if listing_type == "service":
            cleaned.append({
                "name": name,
                "price_hint_inr": int(v.get("price_hint_inr") or 0) or None,
                "features": [str(x).strip() for x in (v.get("features") or [])][:5],
            })
        else:
            vtype = str(v.get("type") or "custom").lower().strip()
            if vtype not in _ALLOWED_VARIANT_TYPES:
                vtype = "custom"
            opts = [str(o).strip() for o in (v.get("options") or []) if str(o).strip()][:12]
            if not opts:
                continue
            cleaned.append({"name": name, "type": vtype, "options": opts})
    return cleaned


def _empty_listing_struct(listing_type: str) -> dict:
    return {
        "description": "",
        "short_description": "",
        "tags": [],
        "features": [],
        "variants": [],
        "suggested_price_range_inr": None,
        "warranty_suggestion": "",
    }
