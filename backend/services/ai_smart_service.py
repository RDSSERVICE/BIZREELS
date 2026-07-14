"""AI Smart Features service (Phase 7d — 6 new AI endpoints).

Feature set (all use Gemini by default via Emergent Universal LLM Key):
1.  generate_titles      → 3 title suggestions (uses images if provided)
2.  detect_category      → matches to our category tree
3.  parse_demand         → converts casual buyer text → structured requirement
4.  match_vendors        → ranks candidate vendors for a requirement (0-100)
5.  suggest_price        → market-aware price recommendation with reasoning
6.  negotiation_helper   → draft counter offer / reply / analysis for chat

Each function:
  • Respects global daily token cap (SEC-003) via ai_content_service._ensure_budget_or_raise
  • Records token usage
  • Returns {ok, ..., meta:{model_used, provider, tokens_used, latency_ms}}
  • Gracefully falls back on LLM failure (never raises 500)

Model routing:
  • Light tasks (title/category/price/match scoring)   → gemini-2.5-flash
  • Heavy reasoning (demand parse / negotiation)       → gemini-2.5-pro
  • Admin can override per-feature via platform_settings.ai_content.feature_models
"""
from __future__ import annotations

import json
import logging
import re
import time
import uuid
from typing import Any

from bson import ObjectId

from database import get_db
from services import ai_content_service

logger = logging.getLogger(__name__)

# Default per-feature model routing. Admin can override in platform_settings.
_DEFAULT_FEATURE_MODELS: dict[str, str] = {
    "title": "gemini-2.5-flash",
    "category": "gemini-2.5-flash",
    "price": "gemini-2.5-pro",
    "match": "gemini-2.5-flash",
    "demand": "gemini-2.5-pro",
    "negotiate": "gemini-2.5-pro",
}
_DEFAULT_PROVIDER = "gemini"


def _resolve_model(feature: str) -> tuple[str, str]:
    """Return (provider, model) for the given feature. Falls back to platform_settings
    if admin has overridden globals; else uses per-feature defaults."""
    cfg = ai_content_service._cfg()  # noqa: SLF001 — intentional reuse
    provider = cfg.get("provider") or _DEFAULT_PROVIDER
    # Try per-feature override
    from services import settings_service
    snap = settings_service.get_integration_sync("ai_content") or {}
    feature_models = snap.get("feature_models") or {}
    model = (feature_models.get(feature) or "").strip()
    if not model:
        model = _DEFAULT_FEATURE_MODELS.get(feature, cfg.get("model") or "gemini-2.5-flash")
    return provider, model


def _new_chat(system_message: str, feature: str):
    """Fresh LlmChat instance pointed at the feature's chosen model."""
    from emergentintegrations.llm.chat import LlmChat
    cfg = ai_content_service._cfg()  # noqa: SLF001
    if not cfg["api_key"]:
        raise RuntimeError("AI not configured: EMERGENT_LLM_KEY missing")
    if not cfg["enabled"]:
        raise RuntimeError("AI is disabled by admin (enabled=false)")
    provider, model = _resolve_model(feature)
    return (
        LlmChat(
            api_key=cfg["api_key"],
            session_id=f"emergent-{feature}-{uuid.uuid4().hex[:10]}",
            system_message=system_message,
        )
        .with_model(provider, model)
    )


def _parse_json(raw: str) -> dict:
    return ai_content_service._parse_json_strict(raw)  # noqa: SLF001


async def _record(prompt_len: int, response_len: int) -> int:
    approx = max(200, min(3500, (prompt_len + response_len) // 4))
    await ai_content_service._record_tokens(approx)  # noqa: SLF001
    return approx


def _meta(started: float, feature: str, tokens: int) -> dict:
    provider, model = _resolve_model(feature)
    return {
        "provider": provider,
        "model_used": model,
        "tokens_used": tokens,
        "latency_ms": int((time.time() - started) * 1000),
    }


# ============================================================ FEATURE 1: titles
_SYS_TITLE = (
    "You are a marketplace listing specialist for India. Write concise, "
    "SEO-friendly, buyer-appealing product/service titles for Indian buyers. "
    "Titles ≤ 70 characters, no ALL CAPS, no emoji, no seller phone/city, "
    "specific (brand + key spec if available). Output MUST be valid JSON."
)


async def generate_titles(
    description: str | None,
    category_hint: str | None,
    listing_type: str,
    image_urls: list[str] | None = None,
) -> dict:
    from emergentintegrations.llm.chat import UserMessage
    await ai_content_service._ensure_budget_or_raise(600)  # noqa: SLF001
    started = time.time()
    prompt = (
        f"Generate 3 title candidates for a {listing_type} listing.\n"
        + (f"Category hint: {category_hint}\n" if category_hint else "")
        + (f"Description: {description}\n" if description else "")
        + (f"Number of listing images provided: {len(image_urls or [])}\n" if image_urls else "")
        + "\nReturn JSON: "
          '{"titles": ["title1", "title2", "title3"], "recommended_index": 0}'
    )
    try:
        chat = _new_chat(_SYS_TITLE, "title")
        raw = await chat.send_message(UserMessage(text=prompt))
        data = _parse_json(raw)
        titles = [str(t).strip()[:70] for t in (data.get("titles") or []) if str(t).strip()][:3]
        if not titles:
            raise ValueError("no titles returned")
        idx = data.get("recommended_index", 0)
        try:
            idx = max(0, min(len(titles) - 1, int(idx)))
        except (TypeError, ValueError):
            idx = 0
        tokens = await _record(len(prompt), len(raw))
        return {"ok": True, "titles": titles, "recommended_index": idx,
                "meta": _meta(started, "title", tokens)}
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI generate_titles failed: %s", exc)
        return {"ok": False, "error": str(exc)[:400], "titles": [],
                "recommended_index": 0, "meta": _meta(started, "title", 0)}


# ============================================================ FEATURE 2: category
_SYS_CATEGORY = (
    "You classify Indian marketplace listings into the platform's fixed category tree. "
    "Pick the SINGLE best (category, sub_category) pair. If unsure, pick the most "
    "general reasonable option. Never invent categories that are not in the provided list. "
    "Output MUST be valid JSON."
)


async def _load_category_tree() -> list[dict]:
    db = get_db()
    cats = await db.categories.find(
        {"is_deleted": {"$ne": True}, "parent_id": None},
        {"name": 1, "slug": 1},
    ).to_list(length=100)
    out: list[dict] = []
    for c in cats:
        subs = await db.categories.find(
            {"parent_id": str(c["_id"]), "is_deleted": {"$ne": True}},
            {"name": 1, "slug": 1},
        ).to_list(length=50)
        out.append({
            "id": str(c["_id"]),
            "name": c.get("name"),
            "sub": [{"id": str(s["_id"]), "name": s.get("name")} for s in subs],
        })
    return out


async def detect_category(
    title: str | None,
    description: str | None,
    image_urls: list[str] | None = None,
) -> dict:
    from emergentintegrations.llm.chat import UserMessage
    await ai_content_service._ensure_budget_or_raise(700)  # noqa: SLF001
    started = time.time()
    tree = await _load_category_tree()
    if not tree:
        return {"ok": False, "error": "No categories configured",
                "meta": _meta(started, "category", 0)}

    # Build lookup: id → info
    id_to_info: dict[str, dict] = {}
    tree_prompt_lines = []
    for c in tree:
        tree_prompt_lines.append(f"- id={c['id']} | {c['name']}")
        id_to_info[c["id"]] = {"name": c["name"], "parent_id": None, "kind": "top"}
        for s in c["sub"]:
            tree_prompt_lines.append(f"    - sub_id={s['id']} | {s['name']} (parent: {c['name']})")
            id_to_info[s["id"]] = {"name": s["name"], "parent_id": c["id"], "kind": "sub"}

    prompt = (
        "Category tree:\n"
        + "\n".join(tree_prompt_lines)
        + "\n\nListing to classify:\n"
        + (f"- Title: {title}\n" if title else "")
        + (f"- Description: {description}\n" if description else "")
        + (f"- Has {len(image_urls or [])} images\n" if image_urls else "")
        + '\nReturn JSON: {"category_id":"<top_id>", "sub_category_id":"<sub_id_or_empty>", '
          '"confidence": 0.0-1.0, "reason":"short one-liner"}'
    )
    try:
        chat = _new_chat(_SYS_CATEGORY, "category")
        raw = await chat.send_message(UserMessage(text=prompt))
        data = _parse_json(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI detect_category failed: %s", exc)
        return {"ok": False, "error": str(exc)[:400],
                "meta": _meta(started, "category", 0)}

    cat_id = str(data.get("category_id") or "").strip()
    sub_id = str(data.get("sub_category_id") or "").strip() or None
    if cat_id not in id_to_info or id_to_info[cat_id]["kind"] != "top":
        return {"ok": False, "error": "Model returned an invalid category id",
                "meta": _meta(started, "category", 0)}
    if sub_id:
        info = id_to_info.get(sub_id)
        if not info or info["kind"] != "sub" or info["parent_id"] != cat_id:
            sub_id = None  # ignore mismatched sub

    try:
        confidence = max(0.0, min(1.0, float(data.get("confidence") or 0.0)))
    except (TypeError, ValueError):
        confidence = 0.0

    tokens = await _record(len(prompt), len(raw))
    return {
        "ok": True,
        "category_id": cat_id,
        "sub_category_id": sub_id,
        "category_name": id_to_info[cat_id]["name"],
        "sub_category_name": id_to_info[sub_id]["name"] if sub_id else None,
        "confidence": confidence,
        "reason": str(data.get("reason") or "")[:200],
        "meta": _meta(started, "category", tokens),
    }


# ============================================================ FEATURE 3: parse demand
_SYS_DEMAND = (
    "You parse casual Indian buyer intent messages (English, Hindi in Roman, or mixed) "
    "into a strict structured JSON. Extract product/service, category hint, price range "
    "in INR (₹), city, urgency (immediate|this_week|this_month|flexible), quantity, "
    "must-have features, nice-to-have features. If a field is missing, use null or []. "
    "Always propose 1-3 short clarifying questions. Output MUST be valid JSON only."
)


async def parse_demand(text: str) -> dict:
    from emergentintegrations.llm.chat import UserMessage
    await ai_content_service._ensure_budget_or_raise(900)  # noqa: SLF001
    started = time.time()
    tree = await _load_category_tree()
    tree_lines = []
    for c in tree:
        tree_lines.append(f"- {c['name']} (id={c['id']})")
        for s in c["sub"]:
            tree_lines.append(f"    - {s['name']} (sub_id={s['id']})")
    prompt = (
        f'Buyer message: """{text}"""\n\n'
        "Available categories:\n" + "\n".join(tree_lines) + "\n\n"
        'Return JSON: {"understood_intent": "1-line rewrite in clear English", '
        '"extracted": {"product_or_service": "...", "category_id": "id or null", '
        '"sub_category_id": "id or null", "price_range_inr": {"min": int|null, "max": int|null}, '
        '"city": "string or null", "urgency": "immediate|this_week|this_month|flexible", '
        '"quantity": int, "must_have_features": [], "nice_to_have_features": []}, '
        '"clarifying_questions": ["short q1", "short q2"]}'
    )
    try:
        chat = _new_chat(_SYS_DEMAND, "demand")
        raw = await chat.send_message(UserMessage(text=prompt))
        data = _parse_json(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI parse_demand failed: %s", exc)
        return {"ok": False, "error": str(exc)[:400],
                "understood_intent": text[:280], "extracted": {},
                "clarifying_questions": [],
                "meta": _meta(started, "demand", 0)}

    # Validate category ids
    ext = data.get("extracted") or {}
    cat_id = ext.get("category_id")
    sub_id = ext.get("sub_category_id")
    all_ids = {c["id"] for c in tree} | {s["id"] for c in tree for s in c["sub"]}
    if cat_id and cat_id not in all_ids:
        ext["category_id"] = None
        cat_id = None
    if sub_id and sub_id not in all_ids:
        ext["sub_category_id"] = None
    data["extracted"] = ext

    tokens = await _record(len(prompt), len(raw))
    return {"ok": True, "understood_intent": str(data.get("understood_intent") or "")[:280],
            "extracted": data.get("extracted") or {},
            "clarifying_questions": [str(q).strip() for q in (data.get("clarifying_questions") or []) if str(q).strip()][:3],
            "meta": _meta(started, "demand", tokens)}


# ============================================================ FEATURE 4: vendor matching
_SYS_MATCH = (
    "You score how well each candidate vendor matches a buyer's requirement, 0-100. "
    "Consider: listing title/description relevance, price fit, city match, verified badge, "
    "trust score, and response speed. Prefer verified + trusted + relevant vendors. "
    "Output MUST be valid JSON."
)


async def match_vendors(
    category_id: str | None,
    sub_category_id: str | None,
    city: str | None,
    price_max: int | None,
    must_have_features: list[str] | None,
    description: str,
    limit: int = 10,
) -> dict:
    """Fetches candidate vendors + their listings, then asks Gemini to rank them."""
    from emergentintegrations.llm.chat import UserMessage
    await ai_content_service._ensure_budget_or_raise(1200)  # noqa: SLF001
    started = time.time()
    db = get_db()

    # 1. Query candidate listings (broad — up to 40)
    q: dict = {"status": "active", "is_deleted": {"$ne": True}}
    if category_id and ObjectId.is_valid(category_id):
        q["category_id"] = category_id
    if sub_category_id and ObjectId.is_valid(sub_category_id):
        q["sub_category_id"] = sub_category_id
    if city:
        q["$or"] = [{"location.city": {"$regex": f"^{re.escape(city)}$", "$options": "i"}},
                    {"location.city": {"$exists": False}}]
    if price_max:
        q["price"] = {"$lte": int(price_max) * 100 * 2}  # allow 2× headroom in paise/rupees

    docs = await db.listings.find(q, {
        "title": 1, "description": 1, "vendor_id": 1, "price": 1, "offer_price": 1,
        "slug": 1, "location": 1,
    }).limit(40).to_list(length=40)

    if not docs:
        return {"ok": True, "matches": [], "candidate_count": 0,
                "meta": _meta(started, "match", 0)}

    # 2. Hydrate vendor info
    vendor_ids = list({str(d.get("vendor_id")) for d in docs if d.get("vendor_id")})
    obj_vendor_ids = [ObjectId(v) for v in vendor_ids if ObjectId.is_valid(v)]
    vendors_docs = await db.users.find(
        {"_id": {"$in": obj_vendor_ids}, "is_deleted": {"$ne": True}},
        {"name": 1, "city": 1, "kyc_status": 1, "is_subscribed_verified": 1,
         "trust_score": 1, "rating_avg": 1, "avg_response_time_seconds": 1},
    ).to_list(length=len(obj_vendor_ids))
    vendor_map = {str(v["_id"]): v for v in vendors_docs}

    # 3. Build compact candidate list for the prompt (keep tokens low)
    candidates = []
    for d in docs:
        v = vendor_map.get(str(d.get("vendor_id")))
        if not v:
            continue
        candidates.append({
            "vendor_id": str(v["_id"]),
            "vendor_name": v.get("name") or "Vendor",
            "listing_id": str(d["_id"]),
            "listing_title": (d.get("title") or "")[:80],
            "listing_desc": (d.get("description") or "")[:200],
            "price_inr": d.get("offer_price") or d.get("price") or 0,
            "city": (d.get("location") or {}).get("city") or v.get("city"),
            "verified": bool(v.get("is_subscribed_verified")) and v.get("kyc_status") == "approved",
            "trust": int(v.get("trust_score") or 0),
            "rating": float(v.get("rating_avg") or 0.0),
        })

    if not candidates:
        return {"ok": True, "matches": [], "candidate_count": 0,
                "meta": _meta(started, "match", 0)}

    prompt = (
        f'Buyer requirement: """{description[:400]}"""\n'
        + (f"Buyer city: {city}\n" if city else "")
        + (f"Buyer max price INR: {price_max}\n" if price_max else "")
        + (f"Must-have features: {', '.join(must_have_features)}\n" if must_have_features else "")
        + f"\nCandidates ({len(candidates)}):\n"
        + json.dumps(candidates, ensure_ascii=False)
        + f"\n\nReturn JSON: {{\"matches\": [{{\"vendor_id\": str, \"listing_id\": str, \"score\": 0-100, \"reasons\": [\"short reason\", ...]}}] }} "
          f"— top {limit} by score, descending. Include only vendors with score ≥ 30."
    )
    try:
        chat = _new_chat(_SYS_MATCH, "match")
        raw = await chat.send_message(UserMessage(text=prompt))
        data = _parse_json(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI match_vendors failed: %s", exc)
        # Fallback: sort by trust + verified
        candidates.sort(key=lambda c: (c["verified"], c["trust"], c["rating"]), reverse=True)
        return {"ok": False, "error": str(exc)[:400],
                "matches": [{"vendor_id": c["vendor_id"], "vendor_name": c["vendor_name"],
                             "top_listing_id": c["listing_id"], "score": 50,
                             "reasons": ["Fallback: sorted by trust score"]}
                            for c in candidates[:limit]],
                "candidate_count": len(candidates),
                "meta": _meta(started, "match", 0)}

    id_to_cand = {c["listing_id"]: c for c in candidates}
    raw_matches = data.get("matches") or []
    out = []
    for m in raw_matches[:limit]:
        lid = str(m.get("listing_id") or "")
        cand = id_to_cand.get(lid)
        if not cand:
            continue
        try:
            score = max(0, min(100, int(m.get("score") or 0)))
        except (TypeError, ValueError):
            score = 0
        out.append({
            "vendor_id": cand["vendor_id"],
            "vendor_name": cand["vendor_name"],
            "top_listing_id": lid,
            "top_listing_title": cand["listing_title"],
            "score": score,
            "reasons": [str(r)[:120] for r in (m.get("reasons") or [])][:4],
        })

    tokens = await _record(len(prompt), len(raw))
    return {"ok": True, "matches": out, "candidate_count": len(candidates),
            "meta": _meta(started, "match", tokens)}


# ============================================================ FEATURE 5: price
_SYS_PRICE = (
    "You are a pricing analyst for the Indian second-hand and services marketplace. "
    "Given comparable listings and item details, suggest a fair listing price and "
    "an attractive offer price. Output MUST be valid JSON."
)


async def suggest_price(
    title: str,
    description: str,
    category_id: str | None,
    sub_category_id: str | None,
    condition: str | None,
    city: str | None,
    listing_type: str,
) -> dict:
    from emergentintegrations.llm.chat import UserMessage
    await ai_content_service._ensure_budget_or_raise(800)  # noqa: SLF001
    started = time.time()
    db = get_db()

    q: dict = {"status": {"$in": ["active", "sold"]}, "is_deleted": {"$ne": True}}
    if category_id and ObjectId.is_valid(category_id):
        q["category_id"] = category_id
    if sub_category_id and ObjectId.is_valid(sub_category_id):
        q["sub_category_id"] = sub_category_id
    if condition:
        q["condition"] = condition

    similar = await db.listings.find(q, {"price": 1, "offer_price": 1, "title": 1}) \
        .sort([("created_at", -1)]).limit(30).to_list(length=30)
    prices = [int(s.get("offer_price") or s.get("price") or 0) for s in similar]
    prices = [p for p in prices if p > 0]
    stats = {"count": len(prices)}
    if prices:
        prices.sort()
        stats["min"] = prices[0]
        stats["max"] = prices[-1]
        stats["median"] = prices[len(prices) // 2]
        stats["avg"] = sum(prices) // len(prices)

    prompt = (
        f"Item to price:\n- Title: {title}\n- Description: {description[:400]}\n"
        f"- Type: {listing_type}\n- Condition: {condition or 'n/a'}\n"
        f"- City: {city or 'India'}\n\n"
        f"Comparable listings stats (in INR): {json.dumps(stats)}\n\n"
        'Return JSON: {"suggested_price_inr": int, "suggested_offer_price_inr": int, '
        '"min_inr": int, "max_inr": int, "confidence": "low|medium|high", '
        '"reasoning": "1-2 sentence explanation in plain English"}'
    )
    try:
        chat = _new_chat(_SYS_PRICE, "price")
        raw = await chat.send_message(UserMessage(text=prompt))
        data = _parse_json(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI suggest_price failed: %s", exc)
        # Fallback: use median of similars if present
        if prices:
            med = stats["median"]
            return {"ok": False, "error": str(exc)[:400],
                    "suggested_price_inr": med, "suggested_offer_price_inr": int(med * 0.92),
                    "min_inr": stats["min"], "max_inr": stats["max"],
                    "similar_listings_count": stats["count"],
                    "confidence": "low",
                    "reasoning": "Fallback: median of similar listings.",
                    "meta": _meta(started, "price", 0)}
        return {"ok": False, "error": str(exc)[:400],
                "meta": _meta(started, "price", 0)}

    tokens = await _record(len(prompt), len(raw))
    try:
        sp = int(data.get("suggested_price_inr") or 0)
        op = int(data.get("suggested_offer_price_inr") or 0)
        mn = int(data.get("min_inr") or 0)
        mx = int(data.get("max_inr") or 0)
    except (TypeError, ValueError):
        sp = op = mn = mx = 0
    return {
        "ok": True,
        "suggested_price_inr": sp,
        "suggested_offer_price_inr": op,
        "min_inr": mn,
        "max_inr": mx,
        "similar_listings_count": stats["count"],
        "confidence": str(data.get("confidence") or "medium").lower(),
        "reasoning": str(data.get("reasoning") or "")[:300],
        "meta": _meta(started, "price", tokens),
    }


# ============================================================ FEATURE 6: negotiation
_SYS_NEGOTIATE = (
    "You are a negotiation coach for an Indian marketplace. You help buyers and sellers "
    "reach a fair deal quickly. Given the listing, deal history, and last chat messages, "
    "produce concise, culturally-appropriate suggestions. Never lie or invent facts. "
    "Never share phone numbers or off-platform contact. Output MUST be valid JSON."
)


async def negotiation_helper(
    deal_id: str | None,
    thread_id: str | None,
    direction: str,   # "buyer" | "seller"
    ask: str,         # "suggest_counter" | "write_message" | "analyze_situation"
    user_id: str,
) -> dict:
    from emergentintegrations.llm.chat import UserMessage
    await ai_content_service._ensure_budget_or_raise(1000)  # noqa: SLF001
    started = time.time()
    db = get_db()

    if direction not in ("buyer", "seller"):
        direction = "buyer"
    if ask not in ("suggest_counter", "write_message", "analyze_situation"):
        ask = "write_message"

    ctx: dict[str, Any] = {}

    # Fetch deal if given
    if deal_id and ObjectId.is_valid(deal_id):
        deal = await db.deals.find_one({"_id": ObjectId(deal_id), "is_deleted": {"$ne": True}})
        if deal:
            # Ownership check — user must be buyer or seller
            buyer_id = str(deal.get("buyer_id") or "")
            # `deals` collection uses `seller_id`; some legacy code paths
            # still say vendor_id — accept both to stay resilient.
            seller_id = str(deal.get("seller_id") or deal.get("vendor_id") or "")
            if user_id not in {buyer_id, seller_id} - {""}:
                return {"ok": False, "error": "You are not part of this deal",
                        "meta": _meta(started, "negotiate", 0)}
            ctx["deal"] = {
                "status": deal.get("status"),
                "asking_price": deal.get("asking_price"),
                "current_offer": deal.get("current_offer"),
                "offers_history": (deal.get("offers_history") or deal.get("offers") or [])[-6:],
            }
            # Load listing
            lid = deal.get("listing_id")
            if lid and ObjectId.is_valid(str(lid)):
                lst = await db.listings.find_one({"_id": ObjectId(str(lid))},
                                                 {"title": 1, "price": 1, "offer_price": 1,
                                                  "condition": 1, "description": 1})
                if lst:
                    ctx["listing"] = {
                        "title": lst.get("title"),
                        "price_inr": lst.get("price"),
                        "offer_price_inr": lst.get("offer_price"),
                        "condition": lst.get("condition"),
                        "description": (lst.get("description") or "")[:300],
                    }
            if not thread_id:
                thread_id = str(deal.get("thread_id") or "") or None

    # Fetch last messages
    if thread_id and ObjectId.is_valid(thread_id):
        thread = await db.chat_threads.find_one({"_id": ObjectId(thread_id),
                                                 "is_deleted": {"$ne": True}})
        if thread:
            # Access control: user must be a thread participant.
            # chat_threads schema uses `participants: [user_id, ...]` — legacy
            # docs may also carry top-level customer_id/vendor_id, so accept
            # either shape.
            participants = [str(p) for p in (thread.get("participants") or [])]
            legacy_ids = {str(thread.get("customer_id") or ""),
                          str(thread.get("vendor_id") or "")} - {""}
            allowed = set(participants) | legacy_ids
            if user_id not in allowed:
                return {"ok": False, "error": "You are not part of this thread",
                        "meta": _meta(started, "negotiate", 0)}
            msgs = await db.messages.find(
                {"thread_id": thread_id, "is_deleted": {"$ne": True}},
                {"sender_id": 1, "text": 1, "created_at": 1},
            ).sort([("created_at", -1)]).limit(20).to_list(length=20)
            msgs.reverse()
            ctx["recent_messages"] = [
                {"from": "self" if str(m.get("sender_id")) == user_id else "other",
                 "text": (m.get("text") or "")[:300]}
                for m in msgs
            ]

    if not ctx:
        return {"ok": False, "error": "No deal or thread context found",
                "meta": _meta(started, "negotiate", 0)}

    # If we have a thread but no deal yet, try to auto-load a linked deal
    # by thread_id (deals.thread_id → deal doc). Best-effort — no error if none.
    if thread_id and "deal" not in ctx:
        deal_by_thread = await db.deals.find_one({"thread_id": thread_id,
                                                  "is_deleted": {"$ne": True}})
        if deal_by_thread:
            ctx["deal"] = {
                "status": deal_by_thread.get("status"),
                "asking_price": deal_by_thread.get("asking_price"),
                "current_offer": deal_by_thread.get("current_offer"),
                "offers_history": (deal_by_thread.get("offers_history")
                                    or deal_by_thread.get("offers") or [])[-6:],
            }
            lid = deal_by_thread.get("listing_id")
            if lid and ObjectId.is_valid(str(lid)) and "listing" not in ctx:
                lst = await db.listings.find_one({"_id": ObjectId(str(lid))},
                                                 {"title": 1, "price": 1,
                                                  "offer_price": 1, "condition": 1,
                                                  "description": 1})
                if lst:
                    ctx["listing"] = {
                        "title": lst.get("title"),
                        "price_inr": lst.get("price"),
                        "offer_price_inr": lst.get("offer_price"),
                        "condition": lst.get("condition"),
                        "description": (lst.get("description") or "")[:300],
                    }

    prompt = (
        f"You are advising the {direction.upper()}.\n"
        f"Task: {ask}\n\n"
        f"Context: {json.dumps(ctx, default=str, ensure_ascii=False)}\n\n"
        + {
            "suggest_counter":
                'Return JSON: {"suggested_offer_inr": int, '
                '"suggested_message": "≤ 40 word chat message that includes the counter offer", '
                '"tone": "friendly_professional", "reasoning": "short internal note"}',
            "write_message":
                'Return JSON: {"suggested_message": "≤ 40 word chat reply that moves the deal forward", '
                '"tone": "friendly_professional", "reasoning": "short internal note"}',
            "analyze_situation":
                'Return JSON: {"analysis": "3-4 sentence read of where the deal stands", '
                '"next_best_move": "concrete recommended action", '
                '"likely_acceptance_price_inr": int, "confidence": "low|medium|high"}',
        }[ask]
    )

    try:
        chat = _new_chat(_SYS_NEGOTIATE, "negotiate")
        raw = await chat.send_message(UserMessage(text=prompt))
        data = _parse_json(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI negotiation_helper failed: %s", exc)
        return {"ok": False, "error": str(exc)[:400],
                "ask": ask, "direction": direction,
                "meta": _meta(started, "negotiate", 0)}

    tokens = await _record(len(prompt), len(raw))
    return {"ok": True, "ask": ask, "direction": direction, "result": data,
            "meta": _meta(started, "negotiate", tokens)}
