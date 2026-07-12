"""Emergent — Local Social Commerce Platform (Phase 0 + 1 + 2 + 3)."""
import os
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
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
    return {
        "status": "ok",
        "service": "emergent-backend",
        "otp_dev_mode": os.environ.get("OTP_DEV_MODE", "false").lower() in ("1", "true", "yes"),
        "cloudinary_dev_mode": os.environ.get("CLOUDINARY_DEV_MODE", "false").lower() in ("1", "true", "yes"),
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
app.include_router(api_router)

UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Socket.IO — mounted UNDER /api so K8s ingress proxies it to the backend.
# (The ingress only routes /api/* to port 8001; /socket.io/* would hit the SPA.)
app.mount("/api/socket.io", socket_asgi)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await create_indexes()
    await seed_admin_user()
    await seed_categories()
    await seed_reels()
    # Background: expire deals every 5 min
    asyncio.create_task(expire_task_loop(interval_seconds=300))
    logger.info("Emergent backend started (Phase 0-3)")


@app.on_event("shutdown")
async def shutdown():
    await close_client()
