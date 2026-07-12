"""Location utils routes: pincode lookup + reverse geocode."""
from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel

from services import location_service

router = APIRouter(prefix="/v1/utils", tags=["utils"])


class LatLng(BaseModel):
    lat: float
    lng: float


class Pincode(BaseModel):
    pincode: str


@router.post("/reverse-geocode")
async def reverse_geocode(body: LatLng):
    return await location_service.reverse_geocode(body.lat, body.lng)


@router.post("/pincode-lookup")
async def pincode_lookup(body: Pincode):
    return await location_service.pincode_lookup(body.pincode)
