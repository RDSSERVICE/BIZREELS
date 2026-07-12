"""Demo seeder for a populated India-based marketplace state.

Idempotent by prefix ("DEMO_"). Wipes prior DEMO_* users/listings/etc when wipe=True.
Not touched: admin phone 9999999999. All fake data is prefixed DEMO_ where possible.
"""
from __future__ import annotations
import logging
import random
import secrets
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from slugify import slugify

from database import get_db
from services import seed_service as reels_seed

logger = logging.getLogger(__name__)

CITIES = [
    ("Mumbai", 19.0760, 72.8777, "Maharashtra", "400001"),
    ("Delhi", 28.6139, 77.2090, "Delhi", "110001"),
    ("Bengaluru", 12.9716, 77.5946, "Karnataka", "560001"),
    ("Pune", 18.5204, 73.8567, "Maharashtra", "411001"),
    ("Hyderabad", 17.3850, 78.4867, "Telangana", "500001"),
    ("Chennai", 13.0827, 80.2707, "Tamil Nadu", "600001"),
    ("Kolkata", 22.5726, 88.3639, "West Bengal", "700001"),
    ("Jaipur", 26.9124, 75.7873, "Rajasthan", "302001"),
    ("Ahmedabad", 23.0225, 72.5714, "Gujarat", "380001"),
    ("Lucknow", 26.8467, 80.9462, "Uttar Pradesh", "226001"),
]

FIRST_NAMES = ["Rahul", "Priya", "Anjali", "Vikram", "Rohan", "Sneha", "Aditya", "Kavya", "Karan",
               "Meera", "Aarav", "Isha", "Arjun", "Neha", "Siddharth", "Diya", "Aryan", "Riya",
               "Kabir", "Tara", "Dev", "Ananya", "Zoya", "Yash", "Nisha"]
LAST_NAMES = ["Sharma", "Patel", "Mehra", "Reddy", "Iyer", "Kapoor", "Verma", "Gupta", "Singh",
              "Rao", "Bose", "Menon", "Shah", "Nair", "Bhat"]

AVATARS = [
    "https://api.dicebear.com/9.x/avataaars/svg?seed=demo{}".format(i) for i in range(1, 55)
]

PRODUCTS_NEW = [
    ("Sony WH-1000XM5 Wireless Headphones", 24990, 22999, "Electronics"),
    ("Apple iPhone 15 (256GB) - Blue", 89999, 84999, "Electronics"),
    ("Samsung Galaxy S24 Ultra", 129999, 119999, "Electronics"),
    ("Boat Airdopes 141 TWS Earbuds", 1499, 899, "Electronics"),
    ("Redmi Note 13 Pro 5G", 22999, 19999, "Electronics"),
    ("Wooden Study Table with Storage", 8990, 6499, "Home"),
    ("King Size Memory Foam Mattress", 34990, 24999, "Home"),
    ("Air Fryer 5L Digital", 5999, 4299, "Home"),
    ("Steel Kitchen Chimney 90cm", 19999, 12999, "Home"),
    ("Nike Air Zoom Running Shoes", 6999, 4999, "Fashion"),
    ("Kanjivaram Silk Saree - Handloom", 12999, 9999, "Fashion"),
    ("Levi's 511 Slim Fit Jeans", 3499, 1999, "Fashion"),
    ("Titan Analog Watch - Steel", 4999, 3499, "Fashion"),
    ("Adidas Ultraboost Sneakers", 15999, 11999, "Fashion"),
    ("Mamaearth Vitamin C Face Cream", 549, 449, "Beauty"),
    ("Forest Essentials Bath Set", 2500, 2100, "Beauty"),
    ("Lakme Absolute Foundation", 899, 749, "Beauty"),
    ("Ayurvedic Chyawanprash 1kg", 599, 499, "Health"),
    ("Yoga Mat 6mm Non-Slip", 1299, 799, "Health"),
    ("Whey Protein Isolate 2kg Chocolate", 4999, 3999, "Health"),
    ("MacBook Air M2 (2023) 13.6\"", 114900, 104900, "Electronics"),
    ("Dell Inspiron 15 (i5, 16GB, 512GB)", 62990, 54999, "Electronics"),
    ("iPad Air 5th Gen 64GB WiFi", 54900, 49999, "Electronics"),
    ("LG 1.5 Ton 5-Star Split AC", 47990, 39999, "Home"),
    ("Bosch 6.5kg Washing Machine", 24999, 21999, "Home"),
    ("IFB Microwave 20L Convection", 12999, 9999, "Home"),
    ("Godrej Interio Sofa Set 3+2", 44999, 32999, "Home"),
    ("Prestige Induction Cooktop 2000W", 3999, 2799, "Home"),
    ("Puma Court Rider Basketball Shoes", 8999, 5499, "Fashion"),
    ("Fabindia Cotton Kurta Set", 2499, 1799, "Fashion"),
    ("Ray-Ban Aviator Sunglasses", 7990, 6490, "Fashion"),
    ("Fossil Gen 6 Smartwatch", 21995, 15999, "Fashion"),
    ("Bata Formal Leather Shoes", 2499, 1799, "Fashion"),
    ("Wow Skin Science Onion Hair Oil", 399, 299, "Beauty"),
    ("Dot & Key Vitamin C Serum", 695, 549, "Beauty"),
    ("Nykaa Matte Lipstick Set", 999, 749, "Beauty"),
    ("Cure.fit Resistance Band Kit", 899, 649, "Health"),
    ("Muscle Blaze BCAA 250g", 1299, 999, "Health"),
    ("Himalaya Wellness Multivitamin", 449, 349, "Health"),
    ("Kindle Paperwhite 11th Gen", 13999, 11999, "Electronics"),
]

PRODUCTS_OLD = [
    ("Royal Enfield Classic 350 (2021)", 145000, 138000, "Vehicles", "good"),
    ("Honda Activa 6G (2022)", 62000, 58000, "Vehicles", "good"),
    ("Bajaj Pulsar 150 (2020)", 68000, 62000, "Vehicles", "good"),
    ("Maruti Swift VXI (2019, 45k km)", 495000, 465000, "Vehicles", "good"),
    ("Hyundai i20 Asta (2020, 30k km)", 720000, 685000, "Vehicles", "fair"),
    ("Bullet 500 Standard (2018)", 130000, 122000, "Vehicles", "fair"),
    ("iPhone 13 Mini 128GB (used, 1 yr)", 45000, 39999, "Electronics", "good"),
    ("PS5 Disc Edition with 2 Controllers", 52999, 48999, "Electronics", "excellent"),
    ("Nikon D7500 DSLR + 18-140mm lens", 89000, 79000, "Electronics", "good"),
    ("Sony PlayStation 4 Pro 1TB", 25999, 22999, "Electronics", "good"),
    ("Steel Bookshelf (5 tier)", 4500, 3200, "Home", "fair"),
    ("Wooden Dining Table 6-Seater", 22000, 18500, "Home", "good"),
    ("Ashley Sofa 3-Seater (used 2 yrs)", 18000, 15000, "Home", "good"),
    ("Whirlpool Fridge 250L Double Door", 15999, 12000, "Home", "fair"),
    ("Voltas Window AC 1.5 Ton", 18000, 14500, "Home", "good"),
    ("Trek Mountain Bike (hardly used)", 24000, 19999, "Vehicles", "excellent"),
    ("Vintage Vespa 150cc (1998 restored)", 78000, 72000, "Vehicles", "fair"),
    ("Herman Miller Aeron Chair (used)", 65000, 55000, "Home", "good"),
    ("Yamaha F310 Acoustic Guitar", 12000, 8999, "Electronics", "good"),
    ("Casio Digital Piano CDP-S150", 32000, 26000, "Electronics", "excellent"),
    ("Samsung 55\" Smart TV 4K (2020)", 45000, 38000, "Electronics", "good"),
    ("Dyson V8 Vacuum Cleaner", 25000, 19000, "Home", "good"),
    ("Antique Wooden Almirah", 15000, 11000, "Home", "fair"),
    ("Segway Ninebot E22 Scooter", 45000, 38000, "Vehicles", "excellent"),
    ("Tissot Chronograph Watch", 22000, 18000, "Fashion", "good"),
]

SERVICES = [
    ("Certified Plumber - 24x7 emergency", 500, "Services"),
    ("Electrician - AC/wiring/switches", 400, "Services"),
    ("AC Repair & Deep Cleaning (Split/Window)", 799, "Services"),
    ("Bridal Makeup Artist - HD Airbrush", 8500, "Beauty"),
    ("Home Cooked Tiffin (North/South Indian)", 3500, "Food"),
    ("Yoga Trainer - Home visit (weekly)", 4000, "Health"),
    ("Home Deep Cleaning Service (2BHK)", 2999, "Services"),
    ("Freelance Wedding Photographer", 35000, "Services"),
    ("Personal Fitness Trainer (Home Gym)", 6000, "Health"),
    ("Math + Science Tuition Grade 9-12", 8000, "Education"),
    ("English Speaking Classes (Adults)", 5000, "Education"),
    ("Web Development - React/Node.js", 45000, "Services"),
    ("Interior Design Consultation", 15000, "Services"),
    ("Piano Lessons at Home (weekly)", 4500, "Education"),
    ("Car Detailing & Ceramic Coating", 12000, "Services"),
]

REVIEW_COMMENTS = [
    ("Great product, exactly as described!", 5),
    ("Fast delivery and vendor was very responsive.", 5),
    ("Good quality but slightly overpriced.", 4),
    ("बहुत अच्छा product है, recommend करूंगा", 5),
    ("Service was okay, could have been faster.", 3),
    ("Excellent condition for a used product!", 5),
    ("Bhai kya baat hai, top notch quality", 5),
    ("Value for money. Would buy again.", 4),
    ("Product arrived on time and works perfectly.", 5),
    ("Vendor was polite and negotiated fair price.", 4),
    ("Item is good but packaging was damaged.", 3),
    ("Highly recommended vendor in Mumbai!", 5),
    ("Fair price, quick delivery, no issues.", 4),
    ("Sahi hai bhai, paisa vasool!", 5),
    ("Description matched exactly. Happy with purchase.", 5),
]


def _rand_name() -> str:
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def _rand_phone() -> str:
    # Force starting 6-9 to satisfy validators
    return f"9{random.randint(700000000, 999999999):09d}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _backdated(days: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


async def wipe_demo(db) -> None:
    # Remove only DEMO-flagged docs to preserve real activity and admin user
    await db.users.delete_many({"is_demo": True})
    await db.listings.delete_many({"is_demo": True})
    await db.reviews.delete_many({"is_demo": True})
    await db.deals.delete_many({"is_demo": True})
    await db.chat_threads.delete_many({"is_demo": True})
    await db.messages.delete_many({"is_demo": True})
    await db.requirements.delete_many({"is_demo": True})
    await db.notifications.delete_many({"is_demo": True})
    await db.wallets.delete_many({"is_demo": True})
    await db.wallet_transactions.delete_many({"is_demo": True})
    await db.listing_events.delete_many({"is_demo": True})


async def _create_user(db, name, roles, city_row, kyc="unverified",
                      subscribed=False, rating_avg=0.0, rating_count=0,
                      avg_response_seconds=None, response_rate=0.0,
                      created_days_ago=30, trust_score=None, avatar=None) -> dict:
    phone = _rand_phone()
    # Avoid phone collision
    for _ in range(5):
        if not await db.users.find_one({"phone": phone}):
            break
        phone = _rand_phone()
    created = _backdated(created_days_ago)
    doc = {
        "phone": phone, "name": name,
        "roles": roles, "current_role": roles[0],
        "kyc_status": kyc,
        "profile_pic": avatar or random.choice(AVATARS),
        "is_active": True, "is_deleted": False, "is_banned": False,
        "is_subscribed_verified": subscribed,
        "rating_avg": rating_avg, "rating_count": rating_count,
        "trust_score": trust_score,
        "city": city_row[0],
        "referral_code": "DEMO" + secrets.token_hex(3).upper(),
        "avg_response_time_seconds": avg_response_seconds,
        "chat_response_rate": response_rate,
        "total_conversations_responded": 5 if response_rate else 0,
        "has_received_first_topup_bonus": False,
        "has_received_profile_complete_bonus": False,
        "fcm_tokens": [], "is_demo": True,
        "created_at": created, "updated_at": created,
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    # Wallet
    await db.wallets.insert_one({
        "user_id": str(res.inserted_id),
        "balance_inr_paise": random.choice([0, 0, 0, 50000, 100000, 250000]),
        "credits": random.choice([50, 100, 150, 200, 300]),
        "lifetime_deposited_paise": 0, "lifetime_earned_credits": 100,
        "lifetime_spent_credits": 0, "is_frozen": False,
        "is_demo": True, "created_at": created, "updated_at": created,
    })
    # Active subscription for subscribed vendors
    if subscribed:
        await db.subscriptions.insert_one({
            "user_id": str(res.inserted_id), "plan": "verified_monthly", "status": "active",
            "started_at": _backdated(5),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=25)).isoformat(),
            "auto_renew": False, "payment_id": None, "payment_ids": [],
            "is_demo": True, "created_at": created, "updated_at": created,
        })
    return doc


async def _create_listing(db, vendor, city_row, product, listing_type,
                          backdate_days=0, boost_days=0) -> dict:
    # Normalize product tuple: (name, price, offer_price, cat_name, [condition])
    # PRODUCTS_NEW / PRODUCTS_OLD are already 4/5-tuples. SERVICES are (name, price, cat_name)
    # → convert services to canonical shape here.
    if listing_type == "service" and len(product) == 3:
        name, price, cat_name = product
        offer_price = None
        condition = None
    else:
        name = product[0]
        price = product[1]
        offer_price = product[2]
        cat_name = product[3]
        condition = product[4] if len(product) > 4 else None
    cat = await db.categories.find_one({"name": {"$regex": f"^{cat_name}", "$options": "i"}})
    if not cat:
        cat = await db.categories.find_one({"parent_id": None, "is_deleted": {"$ne": True}})
    slug_base = slugify(name)[:60]
    slug = slug_base
    i = 1
    while await db.listings.find_one({"slug": slug}):
        i += 1
        slug = f"{slug_base}-{i}"
    created = _backdated(backdate_days) if backdate_days else _now()
    boost_expires = None; boost_activated = None; boost_dur = None
    if boost_days:
        boost_activated = _backdated(1)
        boost_expires = (datetime.now(timezone.utc) + timedelta(days=boost_days)).isoformat()
        boost_dur = boost_days
    images = [
        f"https://picsum.photos/seed/{slug}-1/800/600",
        f"https://picsum.photos/seed/{slug}-2/800/600",
        f"https://picsum.photos/seed/{slug}-3/800/600",
    ]
    doc = {
        "vendor_id": str(vendor["_id"]),
        "type": listing_type,
        "title": name, "slug": slug,
        "description": f"{name} — sourced from a verified vendor in {city_row[0]}. Buyer inspection welcome. Contact for negotiation.",
        "category_id": str(cat["_id"]) if cat else None,
        "price": float(price), "offer_price": float(offer_price) if offer_price else None,
        "is_negotiable": random.choice([True, True, False]),
        "stock": random.randint(1, 10) if listing_type == "new_product" else None,
        "condition": condition,
        "service_charges_type": "fixed" if listing_type == "service" else None,
        "images": images, "reel": None,
        "location": {"area": f"Area {random.randint(1,20)}", "city": city_row[0],
                     "state": city_row[3], "pincode": city_row[4],
                     "lat": city_row[1], "lng": city_row[2],
                     "geo": {"type": "Point", "coordinates": [city_row[2], city_row[1]]}},
        "tags": ["demo", cat_name.lower() if cat_name else "misc"],
        "status": "active", "views_count": random.randint(10, 500),
        "likes_count": random.randint(0, 50), "saves_count": random.randint(0, 30),
        "watchers": [],
        "boost_expires_at": boost_expires, "boost_duration_days": boost_dur,
        "boost_activated_at": boost_activated,
        "is_takendown": False, "is_active": True, "is_deleted": False,
        "is_demo": True, "created_at": created, "updated_at": created,
    }
    res = await db.listings.insert_one(doc)
    doc["_id"] = res.inserted_id
    return doc


async def _create_review(db, reviewer, target_type, target_id, comment, rating, days_ago) -> None:
    created = _backdated(days_ago)
    await db.reviews.insert_one({
        "reviewer_id": str(reviewer["_id"]),
        "reviewer_snapshot": {"id": str(reviewer["_id"]), "name": reviewer["name"], "profile_pic": reviewer.get("profile_pic")},
        "target_type": target_type, "target_id": str(target_id),
        "rating": rating, "comment": comment,
        "is_verified_purchase": bool(random.random() < 0.6),
        "helpful_count": random.randint(0, 15), "reply": None,
        "is_deleted": False, "is_demo": True,
        "created_at": created, "updated_at": created,
    })


async def reset_and_seed(wipe: bool = True) -> dict:
    db = get_db()
    if wipe:
        await wipe_demo(db)
    random.seed(42)

    # Users
    customers, vendors, creators = [], [], []
    for i in range(20):
        c = await _create_user(db, _rand_name(), ["customer"], random.choice(CITIES),
                                created_days_ago=random.randint(3, 60))
        customers.append(c)
    for i in range(20):
        city = random.choice(CITIES)
        subscribed = i < 8
        kyc = "approved" if i < 10 else random.choice(["unverified", "pending"])
        rating_avg = round(random.uniform(3.5, 4.9), 1) if i < 15 else 0.0
        rating_count = random.randint(3, 25) if i < 15 else 0
        avg_rt = random.choice([120, 300, 600, 1800, 3600, 7200]) if i < 12 else None
        rate = random.choice([0.5, 0.7, 0.85, 0.95]) if avg_rt else 0.0
        trust = random.randint(45, 92) if i < 15 else random.randint(20, 40)
        v = await _create_user(db, _rand_name(), ["customer", "vendor"], city,
                                kyc=kyc, subscribed=subscribed,
                                rating_avg=rating_avg, rating_count=rating_count,
                                avg_response_seconds=avg_rt, response_rate=rate,
                                created_days_ago=random.randint(30, 200),
                                trust_score=trust)
        vendors.append(v)
    for i in range(5):
        cr = await _create_user(db, _rand_name(), ["customer", "creator"], random.choice(CITIES),
                                 created_days_ago=random.randint(10, 100))
        creators.append(cr)

    # Listings
    listings = []
    # New products
    for prod in PRODUCTS_NEW:
        vendor = random.choice(vendors)
        city = next((c for c in CITIES if c[0] == vendor.get("city")), CITIES[0])
        li = await _create_listing(db, vendor, city, prod, "new_product",
                                    backdate_days=random.randint(0, 50),
                                    boost_days=random.choice([0]*6 + [3, 7, 14]))
        listings.append(li)
    # Old products
    for prod in PRODUCTS_OLD:
        vendor = random.choice(vendors)
        city = next((c for c in CITIES if c[0] == vendor.get("city")), CITIES[0])
        li = await _create_listing(db, vendor, city, prod, "old_product",
                                    backdate_days=random.randint(5, 90))
        listings.append(li)
    # Services
    for prod in SERVICES:
        vendor = random.choice(vendors)
        city = next((c for c in CITIES if c[0] == vendor.get("city")), CITIES[0])
        li = await _create_listing(db, vendor, city, prod, "service",
                                    backdate_days=random.randint(0, 40))
        listings.append(li)

    # Reviews on vendors + a few on listings
    for _ in range(50):
        reviewer = random.choice(customers + vendors)
        vendor = random.choice(vendors)
        if str(reviewer["_id"]) == str(vendor["_id"]):
            continue
        cmt, r = random.choice(REVIEW_COMMENTS)
        await _create_review(db, reviewer, "vendor", vendor["_id"], cmt, r,
                             days_ago=random.randint(1, 40))
    for _ in range(10):
        reviewer = random.choice(customers)
        li = random.choice(listings)
        cmt, r = random.choice(REVIEW_COMMENTS)
        await _create_review(db, reviewer, "listing", li["_id"], cmt, r,
                             days_ago=random.randint(1, 30))

    # Notifications — a handful of unread per user
    for u in vendors[:12]:
        for _ in range(random.randint(2, 5)):
            await db.notifications.insert_one({
                "user_id": str(u["_id"]),
                "type": random.choice(["review", "payment", "deal", "boost_nudge", "system"]),
                "title": random.choice([
                    "New 5★ review", "Payment received", "Deal accepted 🎉",
                    "Give your listing a boost", "Your KYC is approved",
                ]),
                "body": "Tap to open.",
                "action_url": "/dashboard",
                "is_read": False, "is_demo": True,
                "created_at": _backdated(random.randint(0, 5)),
                "updated_at": _now(),
            })

    counts = {
        "users": await db.users.count_documents({"is_demo": True}),
        "listings": await db.listings.count_documents({"is_demo": True}),
        "reviews": await db.reviews.count_documents({"is_demo": True}),
        "notifications": await db.notifications.count_documents({"is_demo": True}),
        "subscriptions": await db.subscriptions.count_documents({"is_demo": True}),
        "wallets": await db.wallets.count_documents({"is_demo": True}),
    }
    # Add reels seed too (existing helper)
    try:
        await reels_seed.seed_reels()
    except Exception:  # noqa: BLE001
        logger.exception("reels seed failed (non-fatal)")

    logger.info("Demo seed: %s", counts)
    return {"ok": True, **counts}


async def maybe_auto_seed_on_startup() -> None:
    import os
    if os.environ.get("AUTO_SEED_ON_STARTUP", "true").lower() not in ("1", "true", "yes"):
        return
    db = get_db()
    n_listings = await db.listings.count_documents({"is_deleted": {"$ne": True}})
    if n_listings >= 20:
        logger.info("Auto-seed: skipping (already have %d listings)", n_listings)
        return
    logger.info("Auto-seed: starting (only %d listings present)", n_listings)
    await reset_and_seed(wipe=True)
