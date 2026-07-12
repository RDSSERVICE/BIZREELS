"""SEO service — meta tags for listings + sitemap generation."""
from __future__ import annotations
from database import get_db
from services.listing_service import _serialize


async def listing_seo(slug: str, base_url: str) -> dict:
    db = get_db()
    doc = await db.listings.find_one({"slug": slug, "is_deleted": {"$ne": True}, "status": "active"})
    if not doc:
        return {
            "title": "Emergent · India's local social commerce",
            "description": "Discover local. Chat direct. Deal fair.",
            "image": None,
            "url": f"{base_url}/listing/{slug}",
            "type": "product",
        }
    l = _serialize(doc)
    price = l.get("offer_price") or l.get("price")
    desc_bits = []
    if l.get("description"):
        desc_bits.append(l["description"][:140])
    else:
        desc_bits.append(f"{l['type'].replace('_', ' ').title()} · ₹{int(price):,} on Emergent")
    if l.get("location"):
        desc_bits.append(f"{l['location'].get('area','')}, {l['location'].get('city','')}".strip(", "))
    cover = None
    if l.get("images"):
        cover = l["images"][0].get("url")
    return {
        "title": f"{l['title']} · ₹{int(price):,} · Emergent",
        "description": " · ".join(bit for bit in desc_bits if bit),
        "image": cover,
        "url": f"{base_url}/listing/{slug}",
        "type": "product",
    }


async def build_sitemap(base_url: str) -> str:
    db = get_db()
    listings = await db.listings.find(
        {"is_deleted": {"$ne": True}, "status": "active"},
        {"slug": 1, "updated_at": 1},
    ).limit(5000).to_list(5000)
    vendors = await db.users.find(
        {"is_deleted": {"$ne": True}, "roles": "vendor"},
        {"_id": 1, "updated_at": 1},
    ).limit(2000).to_list(2000)

    def _url(loc: str, lastmod: str | None = None) -> str:
        lm = f"<lastmod>{lastmod}</lastmod>" if lastmod else ""
        return f"<url><loc>{loc}</loc>{lm}</url>"

    entries = [_url(f"{base_url}/"), _url(f"{base_url}/browse")]
    for l in listings:
        entries.append(_url(f"{base_url}/listing/{l['slug']}", l.get("updated_at")))
    for v in vendors:
        entries.append(_url(f"{base_url}/vendor/{v['_id']}", v.get("updated_at")))
    body = "".join(entries)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f"{body}"
        "</urlset>"
    )
