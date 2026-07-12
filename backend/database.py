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

    # users
    await db.users.create_index("phone", unique=True)
    await db.users.create_index("is_deleted")

    # otp_requests — TTL on expires_at
    await db.otp_requests.create_index("expires_at", expireAfterSeconds=0)
    await db.otp_requests.create_index("phone")

    # refresh_tokens — TTL on expires_at
    await db.refresh_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.refresh_tokens.create_index("token_hash")
    await db.refresh_tokens.create_index("user_id")

    # audit_logs
    await db.audit_logs.create_index("user_id")
    await db.audit_logs.create_index("created_at")

    logger.info("MongoDB indexes ensured")


async def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
