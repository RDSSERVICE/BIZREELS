"""Emergent — Local Social Commerce Platform (Phase 0 + 1 + 2 + 3)."""
import os
import re as _re_uploads
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from database import create_indexes, close_client  # noqa: E402
from services.auth_service import seed_admin_user  # noqa: E402
from services.category_service import seed_categories  # noqa: E402
from services.seed_service import seed_reels  # noqa: E402
from services.deal_service import expire_task_loop  # noqa: E402
from services.socket_service import socket_asgi  # noqa: E402
from routes.auth_routes import router as auth_router  # noqa: E402
from routes.user_routes import router as user_router  # noqa: E402
from routes.category_routes import router as category_router  # noqa: E402
from routes.listing_routes import router as listing_router  # noqa: E402
from routes.media_routes import router as media_router  # noqa: E402
from routes.feed_routes import router as feed_router  # noqa: E402
from routes.follow_routes import router as follow_router  # noqa: E402
from routes.interaction_routes import router as interaction_router  # noqa: E402
from routes.search_routes import router as search_router  # noqa: E402
from routes.location_routes import router as location_router  # noqa: E402
from routes.seo_routes import router as seo_router  # noqa: E402
from routes.vendor_routes import router as vendor_router  # noqa: E402
from routes.requirement_routes import router as requirement_router  # noqa: E402
from routes.chat_routes import router as chat_router  # noqa: E402
from routes.phase4_routes import router as phase4_router  # noqa: E402
from routes.report_routes import router as report_router  # noqa: E402
from routes.admin_routes import router as admin_router  # noqa: E402
from routes.analytics_routes import router as analytics_router  # noqa: E402
from routes.referral_routes import router as referral_router  # noqa: E402
from routes.onboarding_routes import router as onboarding_router  # noqa: E402
from routes.ai_routes import router as ai_router  # noqa: E402
from routes.ai_smart_routes import router as ai_smart_router  # noqa: E402
from routes.cart_routes import router as cart_router  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Emergent — Local Social Commerce API",
    description="Auth + Categories + Listings + Media + Feed + Chat + Deals",
    version="0.3.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health():
    from services import msg91_service, cloudinary_service
    return {
        "status": "ok",
        "service": "emergent-backend",
        "otp_dev_mode": msg91_service.is_dev_mode(),
        "cloudinary_dev_mode": cloudinary_service.is_dev_mode(),
    }


api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(category_router)
api_router.include_router(listing_router)
api_router.include_router(media_router)
api_router.include_router(feed_router)
api_router.include_router(follow_router)
api_router.include_router(interaction_router)
api_router.include_router(search_router)
api_router.include_router(location_router)
api_router.include_router(seo_router)
api_router.include_router(vendor_router)
api_router.include_router(requirement_router)
api_router.include_router(chat_router)
api_router.include_router(phase4_router)
api_router.include_router(report_router)
api_router.include_router(admin_router)
api_router.include_router(analytics_router)
api_router.include_router(referral_router)
api_router.include_router(onboarding_router)
api_router.include_router(ai_router)
api_router.include_router(ai_smart_router)
api_router.include_router(cart_router)
app.include_router(api_router)

UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


# SEC-003 fix (2026-07-14): the previous unauthenticated
# `app.mount("/api/uploads", StaticFiles(...))` was replaced with an authorized
# FastAPI handler. Public listing/reel media stays accessible without auth
# (files whose name starts with `listings__`), but sensitive files
# (`users__kyc__*`, `users__profile__*` etc.) require a valid JWT and either
# owner or admin-role access.
_UPLOAD_FILENAME_RE = _re_uploads.compile(r"^[A-Za-z0-9._-]+$")


@app.get("/api/uploads/{filename}", tags=["uploads"])
async def serve_upload(filename: str, request: Request):
    # 1. Sanitize — reject traversal, slashes, and anything not a-zA-Z0-9._-
    if not _UPLOAD_FILENAME_RE.match(filename) or ".." in filename:
        raise HTTPException(400, "Invalid filename")
    file_path = UPLOADS_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(404, "File not found")

    # 2. Public media — listing/reel content is intentionally reachable so the
    #    marketplace works without auth headers for anonymous browsing.
    if filename.startswith("listings__") or filename.startswith("reels__") \
       or filename.startswith("categories__"):
        return FileResponse(str(file_path))

    # 3. Sensitive media — KYC docs, profile pics, chat attachments. Require
    #    JWT + owner-or-admin.
    from middleware.auth_middleware import _get_user_from_bearer  # noqa: PLC0415
    user = await _get_user_from_bearer(request)
    if not user:
        raise HTTPException(401, "Authentication required")

    roles = user.roles or []
    if "admin" in roles:
        return FileResponse(str(file_path))

    # KYC files: verify caller is the KYC owner
    if filename.startswith("users__kyc__"):
        from database import get_db  # noqa: PLC0415
        db = get_db()
        # Match on either doc_url or selfie_url containing the filename
        needle = {"$regex": _re_uploads.escape(filename)}
        owner = await db.kyc_documents.find_one({
            "user_id": str(user.id),
            "is_deleted": {"$ne": True},
            "$or": [{"doc_url": needle}, {"selfie_url": needle}],
        })
        if not owner:
            raise HTTPException(403, "Forbidden")
        return FileResponse(str(file_path))

    # For any other users__*/messages__*/etc. that we haven't explicitly
    # allow-listed, fail closed. Serving new sensitive folders will require
    # adding an explicit ownership branch above.
    raise HTTPException(403, "Forbidden")

# Socket.IO — mounted UNDER /api so K8s ingress proxies it to the backend.
# (The ingress only routes /api/* to port 8001; /socket.io/* would hit the SPA.)
app.mount("/api/socket.io", socket_asgi)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    # P3 hardening: default to explicit dev origins; production must override
    # via CORS_ORIGINS env (comma-separated).
    allow_origins=[o.strip() for o in os.environ.get(
        "CORS_ORIGINS",
        "https://emergent-india-2.preview.emergentagent.com,http://localhost:3000",
    ).split(",") if o.strip()],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# P3 hardening — security headers on every response.
from starlette.middleware.base import BaseHTTPMiddleware  # noqa: E402


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
        )
        return response


app.add_middleware(SecurityHeadersMiddleware)


@app.on_event("startup")
async def startup():
    await create_indexes()
    # Phase 6c: initialise platform_settings singleton BEFORE any dev-mode check fires.
    from services import settings_service
    await settings_service.initialize_defaults_on_startup()
    await seed_admin_user()
    await seed_categories()
    await seed_reels()
    # Wallet backfill
    from services import wallet_service as _ws
    await _ws.backfill_all()
    # Background: expire deals every 5 min + 48h deal follow-up + boost expiry
    asyncio.create_task(expire_task_loop(interval_seconds=300))
    asyncio.create_task(_deal_followup_loop())
    from services import boost_service as _bs
    asyncio.create_task(_bs.expire_boosts_loop(interval_seconds=900))
    from services import nudge_service as _ns
    asyncio.create_task(_ns.nudge_loop(interval_seconds=24 * 3600))
    # Phase 6: auto-seed demo data if collections are empty
    try:
        from services import demo_seed_service
        asyncio.create_task(demo_seed_service.maybe_auto_seed_on_startup())
    except Exception as e:  # noqa: BLE001
        logger.warning("auto-seed skipped: %s", e)
    logger.info("Emergent backend started (Phase 0-6)")


async def _deal_followup_loop():
    """Every 15 min: for deals accepted >=48h ago and not yet followed up, post system nudge."""
    import asyncio as _a
    from datetime import datetime, timezone, timedelta
    from database import get_db
    from services import chat_service, notification_service
    while True:
        try:
            db = get_db()
            cutoff = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
            cursor = db.deals.find({
                "status": "accepted",
                "updated_at": {"$lt": cutoff},
                "followup_sent": {"$ne": True},
            })
            async for d in cursor:
                try:
                    await chat_service.send_message(
                        thread_id=str(d["thread_id"]), sender_id=str(d["buyer_id"]),
                        body={"type": "system", "text": "Did your deal complete? Tap Complete to earn trust points."},
                    )
                    for uid in (d.get("buyer_id"), d.get("seller_id")):
                        await notification_service.create(
                            user_id=str(uid), type_="deal_update",
                            title="Confirm your deal", body="48h passed since acceptance. Confirm completion to earn trust.",
                            action_url=f"/chat/{d['thread_id']}",
                        )
                    await db.deals.update_one({"_id": d["_id"]}, {"$set": {"followup_sent": True}})
                except Exception as e:  # noqa: BLE001
                    logger.warning("followup err: %s", e)
        except Exception as e:  # noqa: BLE001
            logger.warning("followup loop err: %s", e)
        await _a.sleep(900)


@app.on_event("shutdown")
async def shutdown():
    await close_client()
