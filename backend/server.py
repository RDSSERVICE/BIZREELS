"""Emergent — Local Social Commerce Platform (Phase 0)."""
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from database import create_indexes, close_client  # noqa: E402
from services.auth_service import seed_admin_user  # noqa: E402
from routes.auth_routes import router as auth_router  # noqa: E402
from routes.user_routes import router as user_router  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Emergent — Local Social Commerce API",
    description="Phase 0: Auth foundation (MSG91 OTP + JWT + multi-role users)",
    version="0.1.0",
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
        "otp_dev_mode": os.environ.get("OTP_DEV_MODE", "true").lower() in ("1", "true", "yes"),
    }


api_router.include_router(auth_router)
api_router.include_router(user_router)
app.include_router(api_router)

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
    logger.info("Emergent backend started (Phase 0)")


@app.on_event("shutdown")
async def shutdown():
    await close_client()
