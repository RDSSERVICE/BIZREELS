"""Chat + Deal routes + WhatsApp helper."""
from __future__ import annotations
from urllib.parse import quote
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import Literal

from database import get_db
from middleware.auth_middleware import require_auth
from services import chat_service, deal_service, socket_service

router = APIRouter(prefix="/v1", tags=["chat"])


class ThreadCreate(BaseModel):
    peer_user_id: str
    context_type: Literal["listing", "requirement", "direct"] = "direct"
    context_id: str | None = None


class MessageBody(BaseModel):
    type: Literal["text", "image", "video", "listing_card", "location", "quote", "system"] = "text"
    text: str | None = None
    media: dict | None = None
    shared_listing_id: str | None = None
    shared_location: dict | None = None
    quote: dict | None = None


@router.post("/chat/threads")
async def create_thread(body: ThreadCreate, user=Depends(require_auth)):
    return await chat_service.get_or_create_thread(
        user_a=user.id, user_b=body.peer_user_id,
        thread_type=body.context_type, context_id=body.context_id,
    )


@router.get("/chat/threads/me")
async def my_threads(user=Depends(require_auth)):
    items = await chat_service.list_my_threads(user.id)
    total_unread = sum(int(t.get("my_unread", 0)) for t in items)
    return {"items": items, "unread_total": total_unread}


@router.get("/chat/threads/{thread_id}")
async def get_thread(thread_id: str, user=Depends(require_auth)):
    return await chat_service.get_thread(thread_id, user.id)


@router.get("/chat/threads/{thread_id}/messages")
async def list_messages(
    thread_id: str, cursor: str | None = Query(None), limit: int = Query(50, ge=1, le=100),
    user=Depends(require_auth),
):
    return await chat_service.list_messages(thread_id, user.id, cursor=cursor, limit=limit)


@router.post("/chat/threads/{thread_id}/messages")
async def send_message(thread_id: str, body: MessageBody, user=Depends(require_auth)):
    return await chat_service.send_message(thread_id, user.id, body.model_dump(exclude_none=True))


@router.post("/chat/threads/{thread_id}/read")
async def read_thread(thread_id: str, user=Depends(require_auth)):
    return await chat_service.mark_read(thread_id, user.id)


@router.post("/chat/threads/{thread_id}/archive")
async def archive_thread(thread_id: str, user=Depends(require_auth)):
    return await chat_service.toggle_archive(thread_id, user.id)


@router.get("/chat/presence/{user_id}")
async def get_presence(user_id: str):
    return {"user_id": user_id, "online": socket_service.is_online(user_id)}


@router.get("/chat/unread-total")
async def unread_total(user=Depends(require_auth)):
    return {"unread_total": await chat_service.unread_total(user.id)}


# ---- Deals ----
class DealCreate(BaseModel):
    thread_id: str
    listing_id: str | None = None
    requirement_id: str | None = None
    initial_offer: float
    note: str | None = None


class CounterBody(BaseModel):
    amount: float
    note: str | None = None


@router.post("/deals/")
async def create_deal(body: DealCreate, user=Depends(require_auth)):
    return await deal_service.create_deal(user.id, body.model_dump(exclude_none=True))


@router.get("/deals/me")
async def my_deals(status: str | None = Query(None), user=Depends(require_auth)):
    return await deal_service.my_deals(user.id, status=status)


@router.get("/deals/{deal_id}")
async def get_deal(deal_id: str, user=Depends(require_auth)):
    return await deal_service.get_by_id(deal_id, user.id)


@router.post("/deals/{deal_id}/counter")
async def counter(deal_id: str, body: CounterBody, user=Depends(require_auth)):
    return await deal_service.counter(deal_id, user.id, body.amount, body.note)


@router.post("/deals/{deal_id}/accept")
async def accept_deal(deal_id: str, user=Depends(require_auth)):
    return await deal_service.accept(deal_id, user.id)


@router.post("/deals/{deal_id}/reject")
async def reject_deal(deal_id: str, user=Depends(require_auth)):
    return await deal_service.reject(deal_id, user.id)


@router.post("/deals/{deal_id}/cancel")
async def cancel_deal(deal_id: str, user=Depends(require_auth)):
    return await deal_service.cancel(deal_id, user.id)


@router.post("/deals/{deal_id}/complete")
async def complete_deal(deal_id: str, user=Depends(require_auth)):
    return await deal_service.complete(deal_id, user.id)


# ---- WhatsApp helper ----
@router.get("/utils/whatsapp-link")
async def wa_link(request: Request, vendor_id: str, listing_id: str | None = None):
    db = get_db()
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(400, "Invalid vendor id")
    v = await db.users.find_one({"_id": ObjectId(vendor_id)})
    if not v or not v.get("phone"):
        raise HTTPException(404, "Vendor has no phone")
    text = f"Hi {v.get('name') or ''}, I'm interested in your"
    listing = None
    if listing_id and ObjectId.is_valid(listing_id):
        listing = await db.listings.find_one({"_id": ObjectId(listing_id)})
    if listing:
        text += f' listing "{listing["title"]}"'
    text += " on Emergent."
    if listing and request is not None:
        host = f"{request.url.scheme}://{request.url.hostname or ''}"
        text += f" {host}/listing/{listing['slug']}"
    return {"wa_url": f"https://wa.me/91{v['phone']}?text={quote(text)}", "phone": v["phone"]}
