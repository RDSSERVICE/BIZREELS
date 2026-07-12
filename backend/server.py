"""Emergent — Local Social Commerce Platform (Phase 0 + Phase 1)."""
import os
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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Emergent — Local Social Commerce API",
    description="Auth + Categories + Listings + Media (Phase 0 & 1)",
    version="0.2.0",
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
app.include_router(api_router)

# Serve locally-uploaded files (dev-mode media fallback) at /api/uploads/*
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

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
    logger.info("Emergent backend started (Phase 0 + 1)")


@app.on_event("shutdown")
async def shutdown():
    await close_client()
