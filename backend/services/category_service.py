"""Category service: CRUD + seeding + tree building."""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from typing import Any
from bson import ObjectId
from fastapi import HTTPException
from slugify import slugify

from database import get_db
from models.category import Category

logger = logging.getLogger(__name__)


# Top-level → children with emoji icons
SEED_TREE: list[dict] = [
    {
        "name": "Electronics",
        "icon": "📱",
        "children": ["Mobile", "Laptop", "TV", "Home Appliances", "Accessories"],
    },
    {
        "name": "Fashion",
        "icon": "👗",
        "children": ["Men", "Women", "Kids", "Footwear", "Accessories"],
    },
    {
        "name": "Home & Furniture",
        "icon": "🛋️",
        "children": ["Furniture", "Kitchen", "Decor", "Bedding"],
    },
    {
        "name": "Vehicles",
        "icon": "🏍️",
        "children": ["Car", "Bike", "Scooter", "Commercial"],
    },
    {
        "name": "Real Estate",
        "icon": "🏠",
        "children": ["Rent", "Buy", "Sell", "PG/Hostel"],
    },
    {
        "name": "Services",
        "icon": "🛠️",
        "children": ["Plumber", "Electrician", "Carpenter", "AC Repair", "Cleaning", "Painter"],
    },
    {
        "name": "Food & Grocery",
        "icon": "🍲",
        "children": ["Restaurants", "Grocery", "Bakery", "Sweets"],
    },
    {
        "name": "Beauty & Salon",
        "icon": "💇",
        "children": ["Men Salon", "Women Salon", "Spa", "Makeup"],
    },
    {
        "name": "Health & Fitness",
        "icon": "🏋️",
        "children": ["Gym", "Yoga", "Doctor", "Medical Store"],
    },
    {
        "name": "Education & Coaching",
        "icon": "📚",
        "children": ["School", "Coaching", "Tuition", "Skill Courses"],
    },
]


def _serialize(cat: Category | dict) -> dict:
    d = cat if isinstance(cat, dict) else cat.model_dump(by_alias=True)
    # Normalise _id -> id string
    _id = d.get("_id") or d.get("id")
    if isinstance(_id, ObjectId):
        _id = str(_id)
    return {
        "id": _id,
        "name": d["name"],
        "slug": d["slug"],
        "icon_url": d.get("icon_url"),
        "parent_id": str(d["parent_id"]) if d.get("parent_id") else None,
        "sort_order": d.get("sort_order", 0),
        "is_active": d.get("is_active", True),
    }


async def seed_categories() -> None:
    db = get_db()
    if await db.categories.count_documents({"is_deleted": {"$ne": True}}) > 0:
        return
    now = datetime.now(timezone.utc).isoformat()
    for idx, group in enumerate(SEED_TREE):
        parent = Category(
            name=group["name"],
            slug=slugify(group["name"]),
            icon_url=group["icon"],
            parent_id=None,
            sort_order=idx,
            created_at=now,
            updated_at=now,
        ).to_mongo()
        res = await db.categories.insert_one(parent)
        parent_id = str(res.inserted_id)
        for cidx, child_name in enumerate(group["children"]):
            child = Category(
                name=child_name,
                slug=slugify(f"{group['name']}-{child_name}"),
                icon_url=None,
                parent_id=parent_id,
                sort_order=cidx,
                created_at=now,
                updated_at=now,
            ).to_mongo()
            await db.categories.insert_one(child)
    logger.info("Seeded %d category groups", len(SEED_TREE))


async def list_categories(
    parent_id: str | None = None,
    only_top_level: bool = False,
    as_tree: bool = False,
) -> list[dict]:
    db = get_db()
    q: dict[str, Any] = {"is_deleted": {"$ne": True}, "is_active": True}
    if only_top_level:
        q["parent_id"] = None
    elif parent_id:
        q["parent_id"] = parent_id
    cursor = db.categories.find(q).sort([("sort_order", 1), ("name", 1)])
    docs = [_serialize(d) async for d in cursor]
    if not as_tree:
        return docs
    # Build tree
    by_parent: dict[str | None, list[dict]] = {}
    for d in docs:
        by_parent.setdefault(d["parent_id"], []).append(d)
    roots = by_parent.get(None, [])
    for r in roots:
        r["children"] = by_parent.get(r["id"], [])
    return roots


async def get_by_slug(slug: str) -> dict | None:
    db = get_db()
    doc = await db.categories.find_one({"slug": slug, "is_deleted": {"$ne": True}})
    if not doc:
        return None
    result = _serialize(doc)
    # Attach children
    children = [
        _serialize(c)
        async for c in db.categories.find(
            {"parent_id": result["id"], "is_deleted": {"$ne": True}, "is_active": True}
        ).sort([("sort_order", 1)])
    ]
    result["children"] = children
    return result


async def get_by_id(cid: str) -> dict | None:
    db = get_db()
    doc = await db.categories.find_one({"_id": ObjectId(cid), "is_deleted": {"$ne": True}})
    return _serialize(doc) if doc else None


async def create_category(name: str, parent_id: str | None, icon_url: str | None) -> dict:
    db = get_db()
    slug_base = slugify(name)
    slug = slug_base
    i = 1
    while await db.categories.find_one({"slug": slug}):
        i += 1
        slug = f"{slug_base}-{i}"
    now = datetime.now(timezone.utc).isoformat()
    if parent_id and not ObjectId.is_valid(parent_id):
        raise HTTPException(400, "Invalid parent_id")
    doc = Category(
        name=name.strip(),
        slug=slug,
        icon_url=icon_url,
        parent_id=parent_id,
        created_at=now,
        updated_at=now,
    ).to_mongo()
    res = await db.categories.insert_one(doc)
    return _serialize({**doc, "_id": res.inserted_id})


async def update_category(cid: str, updates: dict) -> dict:
    db = get_db()
    allowed = {"name", "icon_url", "sort_order", "is_active"}
    clean = {k: v for k, v in updates.items() if k in allowed and v is not None}
    if not clean:
        raise HTTPException(400, "No updatable fields")
    clean["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.categories.update_one({"_id": ObjectId(cid)}, {"$set": clean})
    if res.matched_count == 0:
        raise HTTPException(404, "Category not found")
    doc = await db.categories.find_one({"_id": ObjectId(cid)})
    return _serialize(doc)


async def soft_delete_category(cid: str) -> None:
    db = get_db()
    await db.categories.update_one(
        {"_id": ObjectId(cid)},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
