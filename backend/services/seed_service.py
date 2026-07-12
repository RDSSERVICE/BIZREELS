"""Seed a few sample reels so /feed/reels isn't empty in demo."""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from slugify import slugify
from bson import ObjectId

from database import get_db
from models.listing import Listing

logger = logging.getLogger(__name__)

SAMPLE_REELS = [
    {"url": "https://res.cloudinary.com/demo/video/upload/samples/sea-turtle.mp4", "duration": 15,
     "title": "Handmade Kolhapuri Chappals", "type": "new_product", "price": 899, "offer_price": 699, "area": "Kolhapur", "city": "Kolhapur", "pincode": "416001", "state": "Maharashtra"},
    {"url": "https://res.cloudinary.com/demo/video/upload/samples/dance-2.mp4", "duration": 12,
     "title": "Bridal Mehendi — Home Visit", "type": "service", "price": 2500, "area": "Andheri", "city": "Mumbai", "pincode": "400058", "state": "Maharashtra"},
    {"url": "https://res.cloudinary.com/demo/video/upload/samples/cld-sample-video.mp4", "duration": 10,
     "title": "Retro Vespa 2019 — Excellent Condition", "type": "old_product", "price": 78000, "offer_price": 74000, "area": "Koramangala", "city": "Bengaluru", "pincode": "560034", "state": "Karnataka"},
    {"url": "https://res.cloudinary.com/demo/video/upload/samples/elephants.mp4", "duration": 18,
     "title": "Home-cooked Tiffin Service", "type": "service", "price": 3500, "area": "Indiranagar", "city": "Bengaluru", "pincode": "560038", "state": "Karnataka"},
]


async def seed_reels() -> None:
    db = get_db()
    have_reels = await db.listings.count_documents({"reel": {"$ne": None}, "is_deleted": {"$ne": True}})
    if have_reels >= 3:
        return

    # Need at least 1 vendor + a category
    vendor = await db.users.find_one({"roles": "vendor", "is_deleted": {"$ne": True}})
    if not vendor:
        vendor = await db.users.find_one({"is_deleted": {"$ne": True}})
    if not vendor:
        logger.info("seed_reels: no user found, skipping")
        return
    vendor_id = str(vendor["_id"])
    # Ensure vendor role
    if "vendor" not in (vendor.get("roles") or []):
        await db.users.update_one({"_id": vendor["_id"]}, {"$addToSet": {"roles": "vendor"}})

    cat = await db.categories.find_one({"parent_id": None, "is_deleted": {"$ne": True}})
    if not cat:
        logger.info("seed_reels: no category, skipping")
        return
    cat_id = str(cat["_id"])

    now = datetime.now(timezone.utc).isoformat()
    for s in SAMPLE_REELS:
        slug_base = slugify(s["title"])[:60]
        slug = slug_base
        i = 1
        while await db.listings.find_one({"slug": slug}):
            i += 1
            slug = f"{slug_base}-{i}"
        body: dict = {
            "vendor_id": vendor_id,
            "type": s["type"],
            "title": s["title"],
            "slug": slug,
            "description": f"Sample {s['title']} — dev seed for reels demo.",
            "category_id": cat_id,
            "price": s["price"],
            "offer_price": s.get("offer_price"),
            "is_negotiable": True,
            "reel": {
                "url": s["url"],
                "public_id": f"samples/{slug}",
                "thumbnail_url": None,
                "duration": s["duration"],
            },
            "location": {
                "area": s["area"], "city": s["city"], "state": s.get("state"), "pincode": s["pincode"],
                "lat": 12.97, "lng": 77.59,
                "geo": {"type": "Point", "coordinates": [77.59, 12.97]},
            },
            "tags": ["seed", "reel"],
            "status": "active",
            "views_count": 0,
            "likes_count": 0,
            "saves_count": 0,
            "is_active": True,
            "is_deleted": False,
            "created_at": now,
            "updated_at": now,
        }
        if s["type"] == "new_product":
            body["stock"] = 5
        elif s["type"] == "old_product":
            body["condition"] = "good"
        elif s["type"] == "service":
            body["service_charges_type"] = "fixed"
        await db.listings.insert_one(body)
    logger.info("Seeded %d demo reels", len(SAMPLE_REELS))
