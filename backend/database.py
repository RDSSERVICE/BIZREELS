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
    # Phase 7c: phone is now sparse-unique so Google-signup users can exist
    # without a phone until they link one. Drop the old strict-unique index if
    # present (idempotent — will fail silently on a fresh DB).
    try:
        await db.users.drop_index("phone_1")
    except Exception:
        pass
    await db.users.create_index("phone", unique=True, sparse=True)
    await db.users.create_index("email", unique=True, sparse=True)
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

    # ---- Phase 2 ----
    await db.follows.create_index([("follower_id", 1), ("following_id", 1)], unique=True)
    await db.follows.create_index("following_id")
    await db.interactions.create_index(
        [("user_id", 1), ("listing_id", 1), ("type", 1)], unique=True,
    )
    await db.interactions.create_index("listing_id")
    await db.search_history.create_index("created_at")
    await db.search_history.create_index("user_id")

    # ---- Phase 3 ----
    await db.requirements.create_index("customer_id")
    await db.requirements.create_index("status")
    await db.requirements.create_index("is_deleted")
    await db.requirements.create_index([("location.geo", "2dsphere")])
    try:
        await db.requirements.create_index(
            [("title", "text"), ("description", "text")], name="req_text",
        )
    except Exception as e:  # noqa: BLE001
        logger.warning("req text index warning: %s", e)

    await db.proposals.create_index("requirement_id")
    await db.proposals.create_index("vendor_id")

    await db.chat_threads.create_index("participants")
    await db.chat_threads.create_index([("participants", 1), ("context_id", 1), ("thread_type", 1)])
    await db.chat_threads.create_index([("updated_at", -1)])

    await db.messages.create_index([("thread_id", 1), ("_id", -1)])
    await db.messages.create_index("receiver_id")

    await db.deals.create_index("thread_id")
    await db.deals.create_index("buyer_id")
    await db.deals.create_index("seller_id")
    await db.deals.create_index("status")

    # ---- Phase 4a ----
    await db.reviews.create_index([("target_type", 1), ("target_id", 1), ("_id", -1)])
    await db.reviews.create_index("reviewer_id")
    await db.reviews.create_index([("reviewer_id", 1), ("target_type", 1), ("target_id", 1)])
    await db.notifications.create_index([("user_id", 1), ("_id", -1)])
    await db.notifications.create_index([("user_id", 1), ("is_read", 1)])
    await db.wallets.create_index("user_id", unique=True)
    await db.wallet_transactions.create_index([("user_id", 1), ("_id", -1)])
    await db.payments.create_index("user_id")
    await db.payments.create_index("razorpay_order_id", unique=True)
    await db.subscriptions.create_index("user_id")
    await db.kyc_documents.create_index("user_id")
    await db.kyc_documents.create_index("status")

    # ---- Phase 4b ----
    await db.listings.create_index("boost_expires_at")
    await db.listings.create_index("is_takendown")
    await db.reports.create_index([("status", 1), ("_id", -1)])
    await db.reports.create_index("reporter_id")
    await db.reports.create_index("target_id")
    await db.watcher_notifications.create_index([("listing_id", 1), ("phone", 1), ("created_at", -1)])
    # TTL 7 days on watcher_notifications for auto-cleanup (created_at is ISO string; TTL indexes need Date type,
    # so we do a soft manual sweep. Skipping TTL, keeping regular index.)

    # ---- Phase 5 ----
    await db.listing_events.create_index([("vendor_id", 1), ("created_at", -1)])
    await db.listing_events.create_index([("listing_id", 1), ("event_type", 1), ("created_at", -1)])
    await db.response_events.create_index([("sender_id", 1)])
    await db.response_events.create_index([("sender_id", 1), ("for_message_id", 1)], unique=True)
    await db.referrals.create_index([("referrer_id", 1)])
    await db.referrals.create_index([("referred_user_id", 1)], unique=True)
    await db.users.create_index("referral_code", unique=True, sparse=True)

    logger.info("MongoDB indexes ensured")


async def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
