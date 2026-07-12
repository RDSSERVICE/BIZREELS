"""SEO + sitemap routes."""
from __future__ import annotations
import os
from fastapi import APIRouter, Request
from fastapi.responses import Response, PlainTextResponse

from services import seo_service

router = APIRouter(prefix="/v1/seo", tags=["seo"])


def _base_url(request: Request) -> str:
    base = os.environ.get("PUBLIC_SITE_URL")
    if base:
        return base.rstrip("/")
    return f"{request.url.scheme}://{request.url.hostname}"


@router.get("/listing/{slug}")
async def listing_seo(slug: str, request: Request):
    return await seo_service.listing_seo(slug, _base_url(request))


@router.get("/sitemap.xml", response_class=Response)
async def sitemap(request: Request):
    xml = await seo_service.build_sitemap(_base_url(request))
    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt", response_class=PlainTextResponse)
async def robots(request: Request):
    return f"User-agent: *\nAllow: /\nSitemap: {_base_url(request)}/api/v1/seo/sitemap.xml\n"
