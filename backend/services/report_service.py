"""User-generated content reports service."""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

from database import get_db

VALID_TARGETS = {"listing", "user", "review", "message"}
VALID_REASONS = {"spam", "offensive", "scam", "wrong_category", "other"}
VALID_ACTIONS = {"takedown", "warn", "ban", "none"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _s(d: dict) -> dict:
    out = dict(d)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    return out


async def create_report(reporter_id: str, body: dict) -> dict:
    if body.get("target_type") not in VALID_TARGETS:
        raise HTTPException(400, f"target_type must be in {sorted(VALID_TARGETS)}")
    if body.get("reason") not in VALID_REASONS:
        raise HTTPException(400, f"reason must be in {sorted(VALID_REASONS)}")
    target_id = body.get("target_id", "")
    # Loose validation — for listing/user/review target_id must be an ObjectId
    if body["target_type"] in ("listing", "user", "review", "message"):
        if not ObjectId.is_valid(target_id):
            raise HTTPException(400, "target_id must be a valid id")
    db = get_db()
    doc = {
        "reporter_id": reporter_id,
        "target_type": body["target_type"],
        "target_id": target_id,
        "reason": body["reason"],
        "description": (body.get("description") or "")[:1000],
        "status": "open",
        "resolved_by": None, "resolved_at": None,
        "resolution_action": None, "resolution_note": None,
        "created_at": _now(), "updated_at": _now(),
    }
    res = await db.reports.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _s(doc)


async def _hydrate_targets(db, items: list[dict]) -> list[dict]:
    """Attach a human-friendly 'target_label' + link to each report by resolving target_id."""
    # Group by target_type
    listing_ids, user_ids, review_ids = [], [], []
    for r in items:
        tid = r.get("target_id")
        if not tid or not ObjectId.is_valid(tid):
            continue
        if r["target_type"] == "listing":
            listing_ids.append(ObjectId(tid))
        elif r["target_type"] == "user":
            user_ids.append(ObjectId(tid))
        elif r["target_type"] == "review":
            review_ids.append(ObjectId(tid))
    listings_map = {}
    if listing_ids:
        async for li in db.listings.find({"_id": {"$in": listing_ids}}, {"title": 1, "slug": 1, "is_takendown": 1}):
            listings_map[str(li["_id"])] = li
    users_map = {}
    if user_ids:
        async for u in db.users.find({"_id": {"$in": user_ids}}, {"name": 1, "phone": 1, "is_banned": 1}):
            users_map[str(u["_id"])] = u
    reviews_map = {}
    if review_ids:
        async for rv in db.reviews.find({"_id": {"$in": review_ids}}, {"rating": 1, "comment": 1}):
            reviews_map[str(rv["_id"])] = rv
    for r in items:
        tid = r.get("target_id")
        r["target_label"] = None
        r["target_link"] = None
        if r["target_type"] == "listing" and tid in listings_map:
            li = listings_map[tid]
            r["target_label"] = li.get("title") or "(untitled listing)"
            r["target_link"] = f"/listing/{li.get('slug') or tid}"
            r["target_status"] = "taken_down" if li.get("is_takendown") else "active"
        elif r["target_type"] == "user" and tid in users_map:
            u = users_map[tid]
            r["target_label"] = u.get("name") or u.get("phone") or "(unnamed user)"
            r["target_link"] = f"/vendor/{tid}"
            r["target_status"] = "banned" if u.get("is_banned") else "active"
        elif r["target_type"] == "review" and tid in reviews_map:
            rv = reviews_map[tid]
            r["target_label"] = f"{rv.get('rating', '?')}★ · {(rv.get('comment') or '')[:60]}"
    return items


async def list_reports(status: str | None, target_type: str | None, cursor: str | None, limit: int) -> dict:
    db = get_db()
    q: dict = {}
    if status:
        q["status"] = status
    if target_type:
        q["target_type"] = target_type
    if cursor and ObjectId.is_valid(cursor):
        q["_id"] = {"$lt": ObjectId(cursor)}
    docs = await db.reports.find(q).sort([("_id", -1)]).limit(limit + 1).to_list(limit + 1)
    has_more = len(docs) > limit
    docs = docs[:limit]
    items = [_s(d) for d in docs]
    items = await _hydrate_targets(db, items)
    return {
        "items": items,
        "next_cursor": str(docs[-1]["_id"]) if has_more and docs else None,
        "has_more": has_more,
    }


async def resolve_report(rid: str, admin_id: str, action: str, note: str | None) -> dict:
    if action not in VALID_ACTIONS:
        raise HTTPException(400, f"action must be in {sorted(VALID_ACTIONS)}")
    db = get_db()
    if not ObjectId.is_valid(rid):
        raise HTTPException(400, "Invalid report id")
    rep = await db.reports.find_one({"_id": ObjectId(rid)})
    if not rep:
        raise HTTPException(404, "Report not found")

    # Apply action side-effects
    if action == "takedown" and rep["target_type"] == "listing" and ObjectId.is_valid(rep["target_id"]):
        await db.listings.update_one(
            {"_id": ObjectId(rep["target_id"])},
            {"$set": {"is_takendown": True, "status": "paused", "updated_at": _now()}},
        )
    elif action == "ban" and rep["target_type"] == "user" and ObjectId.is_valid(rep["target_id"]):
        await db.users.update_one(
            {"_id": ObjectId(rep["target_id"])},
            {"$set": {"is_banned": True, "is_active": False, "updated_at": _now()}},
        )

    await db.reports.update_one(
        {"_id": ObjectId(rid)},
        {"$set": {
            "status": "resolved", "resolved_by": admin_id, "resolved_at": _now(),
            "resolution_action": action, "resolution_note": note, "updated_at": _now(),
        }},
    )
    return _s(await db.reports.find_one({"_id": ObjectId(rid)}))


async def dismiss_report(rid: str, admin_id: str, reason: str | None) -> dict:
    db = get_db()
    if not ObjectId.is_valid(rid):
        raise HTTPException(400, "Invalid report id")
    rep = await db.reports.find_one({"_id": ObjectId(rid)})
    if not rep:
        raise HTTPException(404, "Report not found")
    await db.reports.update_one(
        {"_id": ObjectId(rid)},
        {"$set": {
            "status": "dismissed", "resolved_by": admin_id, "resolved_at": _now(),
            "resolution_action": "none", "resolution_note": reason, "updated_at": _now(),
        }},
    )
    return _s(await db.reports.find_one({"_id": ObjectId(rid)}))


async def open_count() -> int:
    db = get_db()
    return await db.reports.count_documents({"status": "open"})
