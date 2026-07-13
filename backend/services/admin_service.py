"""Admin panel: user/listing management + analytics overview."""
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import HTTPException

from database import get_db
from services import report_service

VALID_USER_ROLES_ADD = {"customer", "vendor", "creator"}  # never grant admin

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _s(d: dict) -> dict:
    out = dict(d)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    return out


# ============ USERS ============
async def list_users(q: str | None, role: str | None, is_active: bool | None,
                     kyc_status: str | None, is_subscribed_verified: bool | None,
                     cursor: str | None, limit: int) -> dict:
    db = get_db()
    query: dict = {"is_deleted": {"$ne": True}}
    if q:
        # search phone OR name (case-insensitive)
        query["$or"] = [{"phone": {"$regex": q}}, {"name": {"$regex": q, "$options": "i"}}]
    if role:
        query["roles"] = role
    if is_active is not None:
        query["is_active"] = is_active
    if kyc_status:
        query["kyc_status"] = kyc_status
    if is_subscribed_verified is not None:
        query["is_subscribed_verified"] = is_subscribed_verified
    if cursor and ObjectId.is_valid(cursor):
        query["_id"] = {"$lt": ObjectId(cursor)}
    docs = await db.users.find(query).sort([("_id", -1)]).limit(limit + 1).to_list(limit + 1)
    has_more = len(docs) > limit
    docs = docs[:limit]
    items = []
    for u in docs:
        items.append({
            "id": str(u["_id"]),
            "phone": u.get("phone"),
            "name": u.get("name"),
            "roles": u.get("roles", []),
            "kyc_status": u.get("kyc_status", "unverified"),
            "is_active": u.get("is_active", True),
            "is_banned": u.get("is_banned", False),
            "is_subscribed_verified": u.get("is_subscribed_verified", False),
            "rating_avg": u.get("rating_avg", 0.0),
            "trust_score": u.get("trust_score"),
            "created_at": u.get("created_at"),
        })
    return {
        "items": items,
        "next_cursor": str(docs[-1]["_id"]) if has_more and docs else None,
        "has_more": has_more,
    }


async def _flip_user(user_id: str, updates: dict) -> dict:
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user id")
    db = get_db()
    u = await db.users.find_one({"_id": ObjectId(user_id)})
    if not u:
        raise HTTPException(404, "User not found")
    if "admin" in (u.get("roles") or []):
        raise HTTPException(403, "Cannot modify an admin account")
    updates["updated_at"] = _now()
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    return {"ok": True, "user_id": user_id}


async def ban_user(user_id: str) -> dict:
    return await _flip_user(user_id, {"is_banned": True, "is_active": False})


async def unban_user(user_id: str) -> dict:
    return await _flip_user(user_id, {"is_banned": False, "is_active": True})


async def freeze_wallet(user_id: str) -> dict:
    db = get_db()
    from services import wallet_service
    await wallet_service.get_or_create(user_id)
    await db.wallets.update_one({"user_id": user_id}, {"$set": {"is_frozen": True, "updated_at": _now()}})
    return {"ok": True, "user_id": user_id}


async def unfreeze_wallet(user_id: str) -> dict:
    db = get_db()
    await db.wallets.update_one({"user_id": user_id}, {"$set": {"is_frozen": False, "updated_at": _now()}})
    return {"ok": True, "user_id": user_id}


async def add_role(user_id: str, role: str) -> dict:
    if role not in VALID_USER_ROLES_ADD:
        raise HTTPException(400, f"role must be in {sorted(VALID_USER_ROLES_ADD)}")
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user id")
    db = get_db()
    u = await db.users.find_one({"_id": ObjectId(user_id)})
    if not u:
        raise HTTPException(404, "User not found")
    await db.users.update_one({"_id": ObjectId(user_id)},
                              {"$addToSet": {"roles": role}, "$set": {"updated_at": _now()}})
    return {"ok": True, "user_id": user_id, "role": role}


async def remove_role(user_id: str, role: str) -> dict:
    if role == "admin":
        raise HTTPException(403, "Cannot remove admin role")
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user id")
    db = get_db()
    u = await db.users.find_one({"_id": ObjectId(user_id)})
    if not u:
        raise HTTPException(404, "User not found")
    if role not in (u.get("roles") or []):
        return {"ok": True, "user_id": user_id, "role": role}
    new_roles = [r for r in u.get("roles", []) if r != role]
    if not new_roles:
        raise HTTPException(400, "User must have at least one role")
    new_current = u.get("current_role") if u.get("current_role") != role else new_roles[0]
    await db.users.update_one({"_id": ObjectId(user_id)},
                              {"$set": {"roles": new_roles, "current_role": new_current, "updated_at": _now()}})
    return {"ok": True, "user_id": user_id, "role": role, "roles": new_roles}


# ============ LISTINGS ============
async def list_listings(status: str | None, flagged: bool | None, cursor: str | None, limit: int) -> dict:
    db = get_db()
    q: dict = {"is_deleted": {"$ne": True}}
    if status:
        q["status"] = status
    if flagged is not None:
        q["is_takendown"] = flagged
    if cursor and ObjectId.is_valid(cursor):
        q["_id"] = {"$lt": ObjectId(cursor)}
    docs = await db.listings.find(q).sort([("_id", -1)]).limit(limit + 1).to_list(limit + 1)
    has_more = len(docs) > limit
    docs = docs[:limit]
    from services.listing_service import _serialize as _ls
    return {
        "items": [_ls(d) for d in docs],
        "next_cursor": str(docs[-1]["_id"]) if has_more and docs else None,
        "has_more": has_more,
    }


async def takedown_listing(listing_id: str) -> dict:
    if not ObjectId.is_valid(listing_id):
        raise HTTPException(400, "Invalid listing id")
    db = get_db()
    res = await db.listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": {"is_takendown": True, "status": "paused", "updated_at": _now()}},
    )
    if not res.matched_count:
        raise HTTPException(404, "Listing not found")
    return {"ok": True, "listing_id": listing_id}


async def restore_listing(listing_id: str) -> dict:
    if not ObjectId.is_valid(listing_id):
        raise HTTPException(400, "Invalid listing id")
    db = get_db()
    res = await db.listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": {"is_takendown": False, "status": "active", "updated_at": _now()}},
    )
    if not res.matched_count:
        raise HTTPException(404, "Listing not found")
    return {"ok": True, "listing_id": listing_id}


# ============ ANALYTICS OVERVIEW ============
async def analytics_overview() -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)
    seven_days_ago = (now - timedelta(days=7)).isoformat()

    total_users = await db.users.count_documents({"is_deleted": {"$ne": True}})
    active_users_last_7d = await db.audit_logs.count_documents({
        "action": "login", "created_at": {"$gte": seven_days_ago},
    })
    total_vendors = await db.users.count_documents({"roles": "vendor", "is_deleted": {"$ne": True}})
    total_listings = await db.listings.count_documents({"is_deleted": {"$ne": True}})
    active_listings = await db.listings.count_documents({
        "is_deleted": {"$ne": True}, "status": "active",
    })
    total_deals = await db.deals.count_documents({})
    completed_deals = await db.deals.count_documents({"status": "completed"})
    pending_kyc_count = await db.kyc_documents.count_documents({"status": "pending", "is_deleted": {"$ne": True}})
    open_reports_count = await report_service.open_count()

    # GMV = sum of accepted price * quantity across completed deals
    gmv_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "gmv": {"$sum": {"$multiply": [
            {"$ifNull": ["$accepted_price", "$initial_offer"]},
            {"$ifNull": ["$quantity", 1]},
        ]}}}},
    ]
    gmv_res = await db.deals.aggregate(gmv_pipeline).to_list(1)
    total_gmv_paise = int(round((gmv_res[0]["gmv"] if gmv_res else 0) * 100))

    return {
        "total_users": total_users,
        "active_users_last_7d": active_users_last_7d,
        "total_vendors": total_vendors,
        "total_listings": total_listings,
        "active_listings": active_listings,
        "total_deals": total_deals,
        "completed_deals": completed_deals,
        "total_gmv_paise": total_gmv_paise,
        "pending_kyc_count": pending_kyc_count,
        "open_reports_count": open_reports_count,
    }


# ============ PHASE 6c: TEST-DATA PURGE (dev-only) ============
from utils.test_data import TEST_DATA_REGEX  # noqa: E402


# Collections whose docs reference a user via a FK — cascade soft-delete when
# the referenced user is purged. Value = FK field name on that collection.
_USER_FK_COLLECTIONS = [
    ("listings", "vendor_id"),
    ("reviews", "reviewer_id"),
    ("chat_threads", "customer_id"),
    ("chat_threads", "vendor_id"),
    ("messages", "sender_id"),
    ("deals", "buyer_id"),
    ("deals", "vendor_id"),
    ("proposals", "creator_id"),
    ("proposals", "customer_id"),
    ("requirements", "customer_id"),
    ("listing_events", "vendor_id"),
    ("listing_events", "user_id"),
    ("interactions", "user_id"),
    ("follows", "follower_id"),
    ("follows", "following_id"),
    ("notifications", "user_id"),
    ("wallets", "user_id"),
    ("wallet_transactions", "user_id"),
    ("subscriptions", "user_id"),
    ("payments", "user_id"),
    ("kyc_documents", "user_id"),
    ("referrals", "referrer_id"),
    ("referrals", "referred_user_id"),
    ("response_events", "vendor_id"),
    ("search_history", "user_id"),
    ("watcher_notifications", "user_id"),
]


async def purge_test_data(dry_run: bool = False) -> dict:
    """Detect + (optionally) soft-delete all test-data across the DB.

    Detection = `is_test_data: true` OR name/title matches the test-data regex.
    Cascade   = every user matched → all their FK'd docs get soft-deleted too.
    Returns per-collection counts + a `dry_run` flag.
    """
    db = get_db()
    regex_clause = {"$regex": TEST_DATA_REGEX, "$options": "i"}
    user_match = {"$or": [{"is_test_data": True}, {"name": regex_clause}]}
    listing_match = {"$or": [{"is_test_data": True}, {"title": regex_clause}]}

    # Collect matching user ids (as string, matching how our FKs are stored).
    user_docs = await db.users.find(user_match, {"_id": 1, "name": 1}).to_list(length=10000)
    user_ids_str = [str(u["_id"]) for u in user_docs]
    user_ids_obj = [u["_id"] for u in user_docs]
    sample_user_names = [u.get("name") for u in user_docs[:20]]

    listing_docs = await db.listings.find(listing_match, {"_id": 1, "title": 1}).to_list(length=10000)
    listing_ids_str = [str(l["_id"]) for l in listing_docs]
    sample_listing_titles = [l.get("title") for l in listing_docs[:20]]

    counts: dict[str, int] = {
        "users_matched": len(user_docs),
        "listings_matched_by_name": len(listing_docs),
    }

    now = _now()

    # ---- Users soft-delete ----
    if not dry_run and user_ids_obj:
        r = await db.users.update_many(
            {"_id": {"$in": user_ids_obj}},
            {"$set": {"is_deleted": True, "is_active": False, "is_test_data": True,
                      "updated_at": now}},
        )
        counts["users_soft_deleted"] = r.modified_count
    else:
        counts["users_soft_deleted"] = 0

    # ---- Listings soft-delete (regex-matched OR owned by purged user) ----
    listing_or = []
    if listing_ids_str:
        from bson import ObjectId as _OID
        listing_or.append({"_id": {"$in": [_OID(x) for x in listing_ids_str]}})
    if user_ids_str:
        listing_or.append({"vendor_id": {"$in": user_ids_str}})
    if listing_or:
        listing_cascade_q = listing_or[0] if len(listing_or) == 1 else {"$or": listing_or}
        cascaded_count = await db.listings.count_documents(listing_cascade_q)
        counts["listings_total_purged"] = cascaded_count
        if not dry_run:
            await db.listings.update_many(
                listing_cascade_q,
                {"$set": {"is_deleted": True, "is_active": False, "is_test_data": True,
                          "updated_at": now}},
            )
    else:
        counts["listings_total_purged"] = 0

    # ---- Cascade across every collection that FKs users ----
    per_coll: dict[str, int] = {}
    if user_ids_str:
        for coll_name, fk in _USER_FK_COLLECTIONS:
            q = {fk: {"$in": user_ids_str}}
            n = await db[coll_name].count_documents(q)
            if not n:
                continue
            per_coll[f"{coll_name}.{fk}"] = per_coll.get(f"{coll_name}.{fk}", 0) + n
            if not dry_run:
                await db[coll_name].update_many(
                    q,
                    {"$set": {"is_deleted": True, "is_test_data": True, "updated_at": now}},
                )

    return {
        "ok": True,
        "dry_run": dry_run,
        "counts": counts,
        "cascade": per_coll,
        "sample_user_names": sample_user_names,
        "sample_listing_titles": sample_listing_titles,
    }
