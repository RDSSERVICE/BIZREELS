"""Location utilities: pincode lookup (real free API) + reverse-geocode (mock)."""
from __future__ import annotations
import logging
import httpx
from fastapi import HTTPException

from database import get_db

logger = logging.getLogger(__name__)

PINCODE_API = "https://api.postalpincode.in/pincode/{pincode}"


async def pincode_lookup(pincode: str) -> dict:
    if not pincode or not pincode.isdigit() or len(pincode) != 6:
        raise HTTPException(400, "Pincode must be 6 digits")
    db = get_db()

    # Cache
    cached = await db.pincode_cache.find_one({"_id": pincode})
    if cached:
        return {k: v for k, v in cached.items() if k != "_id"}

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(PINCODE_API.format(pincode=pincode))
            res.raise_for_status()
            data = res.json()
        entry = data[0] if isinstance(data, list) else data
        if entry.get("Status") != "Success" or not entry.get("PostOffice"):
            raise HTTPException(404, "Pincode not found")
        po = entry["PostOffice"][0]
        result = {
            "pincode": pincode,
            "area": po.get("Name"),
            "city": po.get("District"),
            "state": po.get("State"),
            "country": po.get("Country", "India"),
        }
        # Cache indefinitely — pincodes are stable
        try:
            await db.pincode_cache.update_one(
                {"_id": pincode}, {"$set": {**result}}, upsert=True
            )
        except Exception:  # noqa: BLE001
            pass
        return result
    except httpx.HTTPError as e:
        logger.warning("Pincode API failure: %s", e)
        raise HTTPException(503, "Pincode service temporarily unavailable")


async def reverse_geocode(lat: float, lng: float) -> dict:
    """Mock reverse geocode.

    TODO(phase-later): swap in real Google Geocoding / OpenStreetMap Nominatim.
    For now returns a coarse mock so the UI works end-to-end.
    """
    # Very coarse mapping for a few Indian metros; else generic.
    metros = [
        (12.97, 77.59, "Bengaluru", "Karnataka"),
        (28.61, 77.20, "New Delhi", "Delhi"),
        (19.07, 72.87, "Mumbai", "Maharashtra"),
        (17.38, 78.48, "Hyderabad", "Telangana"),
        (13.08, 80.27, "Chennai", "Tamil Nadu"),
        (22.57, 88.36, "Kolkata", "West Bengal"),
        (18.52, 73.85, "Pune", "Maharashtra"),
        (26.91, 75.78, "Jaipur", "Rajasthan"),
    ]
    best = min(metros, key=lambda m: (m[0] - lat) ** 2 + (m[1] - lng) ** 2)
    return {
        "area": None,
        "city": best[2],
        "state": best[3],
        "pincode": None,
        "country": "India",
        "source": "mock",
    }
