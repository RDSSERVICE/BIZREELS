"""Vendor analytics — overview KPIs, per-listing breakdown, daily timeseries, boost ROI."""
from __future__ import annotations
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import HTTPException

from database import get_db

RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90, "all": None}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _range_cutoff_iso(range_key: str) -> str | None:
    days = RANGE_DAYS.get(range_key)
    if not days:
        return None
    return (_now() - timedelta(days=days)).isoformat()


async def overview(vendor_id: str, range_key: str = "30d") -> dict:
    db = get_db()
    cutoff = _range_cutoff_iso(range_key)
    ev_q: dict = {"vendor_id": vendor_id}
    if cutoff:
        ev_q["created_at"] = {"$gte": cutoff}

    # Event counts by type
    agg = await db.listing_events.aggregate([
        {"$match": ev_q},
        {"$group": {"_id": "$event_type", "n": {"$sum": 1}}},
    ]).to_list(50)
    counts = {a["_id"]: a["n"] for a in agg}

    total_views = counts.get("view", 0)
    chats_started = counts.get("chat_start", 0)
    deals_started = counts.get("deal_start", 0)
    deals_completed = counts.get("deal_complete", 0)
    saves = counts.get("save", 0)
    shares = counts.get("share", 0)
    wa_clicks = counts.get("wa_click", 0)

    # Unique buyers (distinct user_id on chat_start events)
    unique_chatters = await db.listing_events.distinct(
        "user_id", {**ev_q, "event_type": "chat_start", "user_id": {"$ne": None}}
    )
    unique_chatters_count = len(unique_chatters)

    # Watchers count across vendor's active listings (aggregated live)
    watchers_agg = await db.listings.aggregate([
        {"$match": {"vendor_id": vendor_id, "is_deleted": {"$ne": True}}},
        {"$project": {"watchers_count": {"$size": {"$ifNull": ["$watchers", []]}}}},
        {"$group": {"_id": None, "total": {"$sum": "$watchers_count"}}},
    ]).to_list(1)
    total_watchers = watchers_agg[0]["total"] if watchers_agg else 0

    total_leads = unique_chatters_count + total_watchers

    # Deals by status
    deals_agg = await db.deals.aggregate([
        {"$match": {"seller_id": vendor_id}},
        {"$group": {"_id": "$status", "n": {"$sum": 1}}},
    ]).to_list(20)
    deals_by_status = {a["_id"]: a["n"] for a in deals_agg}
    total_deals = sum(deals_by_status.values())

    # Reviews summary
    rev_agg = await db.reviews.aggregate([
        {"$match": {"target_type": "vendor", "target_id": vendor_id, "is_deleted": {"$ne": True}}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "n": {"$sum": 1}}},
    ]).to_list(1)

    # Listings summary
    total_listings = await db.listings.count_documents({
        "vendor_id": vendor_id, "is_deleted": {"$ne": True}, "is_takendown": {"$ne": True},
    })
    active_listings = await db.listings.count_documents({
        "vendor_id": vendor_id, "is_deleted": {"$ne": True}, "is_takendown": {"$ne": True}, "status": "active",
    })

    # Conversion rates
    view_to_chat = round(chats_started / total_views * 100, 1) if total_views else 0.0
    chat_to_deal = round(deals_started / chats_started * 100, 1) if chats_started else 0.0
    deal_to_complete = round(deals_completed / deals_started * 100, 1) if deals_started else 0.0

    return {
        "range": range_key,
        "kpis": {
            "views": total_views,
            "chats_started": chats_started,
            "unique_chatters": unique_chatters_count,
            "watchers": total_watchers,
            "leads": total_leads,
            "deals_started": deals_started,
            "deals_completed": deals_completed,
            "saves": saves,
            "shares": shares,
            "wa_clicks": wa_clicks,
            "listings_total": total_listings,
            "listings_active": active_listings,
        },
        "deals_by_status": deals_by_status,
        "deals_total": total_deals,
        "conversion": {
            "view_to_chat_pct": view_to_chat,
            "chat_to_deal_pct": chat_to_deal,
            "deal_to_complete_pct": deal_to_complete,
        },
        "reviews": {
            "avg_rating": round(rev_agg[0]["avg"], 2) if rev_agg else 0.0,
            "count": rev_agg[0]["n"] if rev_agg else 0,
        },
    }


async def per_listing(vendor_id: str, range_key: str = "30d",
                     sort: str = "views", limit: int = 10) -> dict:
    db = get_db()
    cutoff = _range_cutoff_iso(range_key)
    ev_q: dict = {"vendor_id": vendor_id}
    if cutoff:
        ev_q["created_at"] = {"$gte": cutoff}

    # Aggregate events per listing_id
    pipeline = [
        {"$match": ev_q},
        {"$group": {
            "_id": {"listing_id": "$listing_id", "type": "$event_type"},
            "n": {"$sum": 1},
        }},
    ]
    counts_by_listing: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    async for row in db.listing_events.aggregate(pipeline):
        counts_by_listing[row["_id"]["listing_id"]][row["_id"]["type"]] = row["n"]

    # Load listing meta
    listing_ids = [ObjectId(lid) for lid in counts_by_listing if ObjectId.is_valid(lid)]
    listings = await db.listings.find({"_id": {"$in": listing_ids}}).to_list(len(listing_ids)) if listing_ids else []
    lmap = {str(li["_id"]): li for li in listings}

    items = []
    for lid, ec in counts_by_listing.items():
        li = lmap.get(lid, {})
        items.append({
            "listing_id": lid,
            "title": li.get("title"),
            "slug": li.get("slug"),
            "price": li.get("price"),
            "boost_expires_at": li.get("boost_expires_at"),
            "views": ec.get("view", 0),
            "chats": ec.get("chat_start", 0),
            "deals": ec.get("deal_start", 0),
            "deals_completed": ec.get("deal_complete", 0),
            "saves": ec.get("save", 0),
            "shares": ec.get("share", 0),
            "wa_clicks": ec.get("wa_click", 0),
        })
    key = {"views": "views", "chats": "chats", "deals": "deals", "shares": "shares"}.get(sort, "views")
    items.sort(key=lambda x: x[key], reverse=True)
    return {"range": range_key, "items": items[:limit]}


async def timeseries(vendor_id: str, range_key: str = "30d", metric: str = "views") -> dict:
    """Daily buckets. metric ∈ {views, chats, deals, deals_completed}."""
    db = get_db()
    metric_map = {
        "views": "view", "chats": "chat_start",
        "deals": "deal_start", "deals_completed": "deal_complete",
    }
    ev_type = metric_map.get(metric, "view")
    days = RANGE_DAYS.get(range_key) or 30
    cutoff = _now() - timedelta(days=days)
    ev_q = {"vendor_id": vendor_id, "event_type": ev_type,
            "created_at": {"$gte": cutoff.isoformat()}}

    pipeline = [
        {"$match": ev_q},
        {"$project": {
            "day": {"$substr": ["$created_at", 0, 10]},
        }},
        {"$group": {"_id": "$day", "n": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    buckets = {row["_id"]: row["n"] async for row in db.listing_events.aggregate(pipeline)}

    # Fill zero buckets
    out = []
    day = cutoff.date()
    end = _now().date()
    while day <= end:
        key = day.isoformat()
        out.append({"date": key, "value": buckets.get(key, 0)})
        day += timedelta(days=1)
    return {"metric": metric, "range": range_key, "items": out}


async def boost_roi(vendor_id: str, listing_id: str) -> dict:
    """Compare event counts during boost window vs same-length baseline window before boost."""
    db = get_db()
    if not ObjectId.is_valid(listing_id):
        raise HTTPException(400, "Invalid listing id")
    li = await db.listings.find_one({"_id": ObjectId(listing_id)})
    if not li or str(li.get("vendor_id")) != vendor_id:
        raise HTTPException(404, "Listing not found")
    activated = li.get("boost_activated_at")
    expires = li.get("boost_expires_at")
    if not activated or not expires:
        raise HTTPException(400, "This listing has no boost history")
    dur = li.get("boost_duration_days") or 7

    boost_start = datetime.fromisoformat(activated.replace("Z", "+00:00"))
    boost_end = datetime.fromisoformat(expires.replace("Z", "+00:00"))
    if boost_end > _now():
        boost_end = _now()  # ROI so far
    baseline_end = boost_start
    baseline_start = boost_start - timedelta(days=dur)

    async def _counts(cstart: datetime, cend: datetime) -> dict:
        agg = await db.listing_events.aggregate([
            {"$match": {
                "listing_id": listing_id,
                "created_at": {"$gte": cstart.isoformat(), "$lt": cend.isoformat()},
            }},
            {"$group": {"_id": "$event_type", "n": {"$sum": 1}}},
        ]).to_list(50)
        return {a["_id"]: a["n"] for a in agg}

    during = await _counts(boost_start, boost_end)
    baseline = await _counts(baseline_start, baseline_end)

    def _lift(name: str) -> float:
        b = baseline.get(name, 0)
        d = during.get(name, 0)
        if not b:
            return float("inf") if d else 0.0
        return round((d - b) / b * 100, 1)

    return {
        "listing_id": listing_id,
        "boost_start": boost_start.isoformat(),
        "boost_end": boost_end.isoformat(),
        "duration_days": dur,
        "during": {
            "views": during.get("view", 0),
            "chats": during.get("chat_start", 0),
            "deals": during.get("deal_start", 0),
        },
        "baseline": {
            "views": baseline.get("view", 0),
            "chats": baseline.get("chat_start", 0),
            "deals": baseline.get("deal_start", 0),
        },
        "lift_pct": {
            "views": _lift("view"),
            "chats": _lift("chat_start"),
            "deals": _lift("deal_start"),
        },
    }
