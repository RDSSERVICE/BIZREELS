"""MongoDB connection and index management."""
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    return _client


def get_db() -> AsyncIOMotorDatabase:
    global _db
    if _db is None:
        _db = get_client()[os.environ["DB_NAME"]]
    return _db


async def create_indexes() -> None:
    """Create MongoDB indexes required by the app. Idempotent."""
    db = get_db()

    # ---- Phase 0 ----
    await db.users.create_index("phone", unique=True)
    await db.users.create_index("is_deleted")

    await db.otp_requests.create_index("expires_at", expireAfterSeconds=0)
    await db.otp_requests.create_index("phone")

    await db.refresh_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.refresh_tokens.create_index("token_hash")
    await db.refresh_tokens.create_index("user_id")

    await db.audit_logs.create_index("user_id")
    await db.audit_logs.create_index("created_at")

    # ---- Phase 1 ----
    await db.categories.create_index("slug", unique=True)
    await db.categories.create_index("parent_id")
    await db.categories.create_index("is_deleted")

    await db.listings.create_index("slug", unique=True)
    await db.listings.create_index("vendor_id")
    await db.listings.create_index("category_id")
    await db.listings.create_index("sub_category_id")
    await db.listings.create_index("status")
    await db.listings.create_index("is_deleted")
    # 2dsphere for geo queries (Phase 2 will use this)
    await db.listings.create_index([("location.geo", "2dsphere")])
    # Text index on title + description + tags
    try:
        await db.listings.create_index(
            [("title", "text"), ("description", "text"), ("tags", "text")],
            name="listings_text",
        )
    except Exception as e:  # noqa: BLE001
        logger.warning("text index create warning: %s", e)

    logger.info("MongoDB indexes ensured")


async def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
