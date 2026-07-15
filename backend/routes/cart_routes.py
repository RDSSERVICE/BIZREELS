"""Multi-vendor cart routes.

Single `carts` collection: one doc per user with items grouped by vendor. UX
is a single unified cart in the drawer; checkout splits per vendor into one
`deal` + a chat message per vendor group.
"""
from __future__ import annotations
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from database import get_db
from middleware.auth_middleware import require_auth

router = APIRouter(prefix="/v1/cart", tags=["cart"])


class AddItemBody(BaseModel):
    listing_id: str = Field(min_length=8)
    quantity: int = Field(1, ge=1, le=99)
    variant_selection: dict | None = None


class UpdateItemBody(BaseModel):
    quantity: int = Field(ge=1, le=99)


async def _get_cart(user_id: str) -> dict:
    db = get_db()
    doc = await db.carts.find_one({"user_id": user_id})
    if not doc:
        now = datetime.now(timezone.utc).isoformat()
        doc = {"user_id": user_id, "items": [], "created_at": now, "updated_at": now}
        res = await db.carts.insert_one(doc)
        doc["_id"] = res.inserted_id
    return doc


async def _hydrate(cart: dict) -> dict:
    """Attach listing + vendor snapshots so the UI can render without extra calls."""
    db = get_db()
    ids = [ObjectId(i["listing_id"]) for i in cart.get("items", []) if ObjectId.is_valid(i.get("listing_id", ""))]
    lookup = {}
    if ids:
        async for l in db.listings.find({"_id": {"$in": ids}, "is_deleted": {"$ne": True}}):
            lookup[str(l["_id"])] = l
    groups: dict = {}
    total = 0
    for it in cart.get("items", []):
        li = lookup.get(it["listing_id"])
        if not li:
            continue
        vendor_id = str(li.get("vendor_id"))
        price = float(li.get("offer_price") or li.get("price") or 0)
        line = price * int(it.get("quantity", 1))
        total += line
        item_out = {
            "listing_id": it["listing_id"],
            "quantity": int(it.get("quantity", 1)),
            "variant_selection": it.get("variant_selection"),
            "title": li.get("title"),
            "slug": li.get("slug"),
            "price": price,
            "line_total": line,
            "image": (li.get("images") or [{}])[0].get("url"),
        }
        groups.setdefault(vendor_id, {"vendor_id": vendor_id, "items": [], "subtotal": 0.0})
        groups[vendor_id]["items"].append(item_out)
        groups[vendor_id]["subtotal"] += line

    if groups:
        vendor_ids = [ObjectId(v) for v in groups if ObjectId.is_valid(v)]
        async for u in db.users.find({"_id": {"$in": vendor_ids}}, {"name": 1, "profile_pic": 1}):
            groups[str(u["_id"])]["vendor"] = {
                "id": str(u["_id"]), "name": u.get("name"), "profile_pic": u.get("profile_pic"),
            }

    return {
        "id": str(cart["_id"]),
        "items": list(cart.get("items", [])),
        "groups": list(groups.values()),
        "total_items": sum(int(i.get("quantity", 1)) for i in cart.get("items", [])),
        "total_amount": total,
    }


@router.get("/me")
async def get_my_cart(user=Depends(require_auth)):
    cart = await _get_cart(str(user.id))
    return await _hydrate(cart)


@router.post("/me/add")
async def add_to_cart(body: AddItemBody, user=Depends(require_auth)):
    db = get_db()
    if not ObjectId.is_valid(body.listing_id):
        raise HTTPException(400, "Invalid listing id")
    li = await db.listings.find_one({"_id": ObjectId(body.listing_id), "is_deleted": {"$ne": True}})
    if not li:
        raise HTTPException(404, "Listing not found")
    now = datetime.now(timezone.utc).isoformat()
    cart = await _get_cart(str(user.id))
    items = cart.get("items", [])
    for it in items:
        if it["listing_id"] == body.listing_id:
            it["quantity"] = min(99, int(it.get("quantity", 1)) + body.quantity)
            it["variant_selection"] = body.variant_selection or it.get("variant_selection")
            break
    else:
        items.append({
            "listing_id": body.listing_id, "quantity": body.quantity,
            "variant_selection": body.variant_selection, "added_at": now,
        })
    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": items, "updated_at": now}},
    )
    cart["items"] = items
    return await _hydrate(cart)


@router.patch("/me/items/{listing_id}")
async def update_item(listing_id: str, body: UpdateItemBody, user=Depends(require_auth)):
    db = get_db()
    cart = await _get_cart(str(user.id))
    found = False
    for it in cart["items"]:
        if it["listing_id"] == listing_id:
            it["quantity"] = body.quantity
            found = True
    if not found:
        raise HTTPException(404, "Item not in cart")
    await db.carts.update_one({"_id": cart["_id"]},
        {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc).isoformat()}})
    return await _hydrate(cart)


@router.delete("/me/items/{listing_id}")
async def remove_item(listing_id: str, user=Depends(require_auth)):
    db = get_db()
    cart = await _get_cart(str(user.id))
    cart["items"] = [i for i in cart["items"] if i["listing_id"] != listing_id]
    await db.carts.update_one({"_id": cart["_id"]},
        {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc).isoformat()}})
    return await _hydrate(cart)


@router.post("/me/checkout")
async def checkout_cart(user=Depends(require_auth)):
    """Split cart per vendor → create one 'deal' per vendor + one chat thread + a
    summary message. Cart is cleared on success. Returns array of created deals.
    """
    db = get_db()
    cart = await _get_cart(str(user.id))
    hydrated = await _hydrate(cart)
    if not hydrated["groups"]:
        raise HTTPException(400, "Cart is empty")

    # Phase 7f (CHANGE 4): block checkout if ANY vendor in cart is unverified.
    # Vendor must have ≥1 approved KYC doc to accept order requests.
    from services import identity_service
    unverified_vendor_ids: list[str] = []
    unverified_vendor_names: list[str] = []
    for group in hydrated["groups"]:
        vid = group["vendor_id"]
        if not await identity_service.has_verified_identity(vid):
            unverified_vendor_ids.append(vid)
            unverified_vendor_names.append(group.get("vendor_name") or f"Vendor {vid[-4:]}")
    if unverified_vendor_ids:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "vendor_unverified",
                "message": (
                    f"Cannot place this order — {len(unverified_vendor_ids)} vendor(s) "
                    "haven't verified their identity yet. Please ask them to verify to accept orders."
                ),
                "vendor_ids": unverified_vendor_ids,
                "vendor_names": unverified_vendor_names,
            },
        )

    from services import chat_service
    now = datetime.now(timezone.utc).isoformat()
    created = []
    for group in hydrated["groups"]:
        vendor_id = group["vendor_id"]
        subtotal = group["subtotal"]
        items_snapshot = [
            {"listing_id": i["listing_id"], "title": i["title"],
             "quantity": i["quantity"], "price": i["price"], "line_total": i["line_total"]}
            for i in group["items"]
        ]
        deal_doc = {
            "buyer_id": str(user.id), "vendor_id": vendor_id, "seller_id": vendor_id,
            "items": items_snapshot, "amount_paise": int(subtotal * 100),
            "status": "negotiating", "source": "cart_checkout",
            "created_at": now, "updated_at": now, "is_deleted": False,
        }
        res = await db.deals.insert_one(deal_doc)
        deal_id = str(res.inserted_id)

        # Chat thread + summary
        try:
            thread = await chat_service.get_or_create_thread(
                customer_id=str(user.id), vendor_id=vendor_id,
                listing_id=items_snapshot[0]["listing_id"],
            )
            summary_lines = [f"🛒 Order request — {len(items_snapshot)} item(s)"]
            for i in items_snapshot:
                summary_lines.append(f"  • {i['title']} × {i['quantity']} = ₹{i['line_total']:.0f}")
            summary_lines.append(f"Total: ₹{subtotal:,.0f}")
            await chat_service.send_message(
                thread_id=str(thread["_id"] if isinstance(thread, dict) else thread.id),
                sender_id=str(user.id),
                content="\n".join(summary_lines),
            )
        except Exception:  # noqa: BLE001
            pass

        created.append({"deal_id": deal_id, "vendor_id": vendor_id,
                        "amount_paise": deal_doc["amount_paise"],
                        "item_count": len(items_snapshot)})

    # Clear cart
    await db.carts.update_one({"_id": cart["_id"]}, {"$set": {"items": [], "updated_at": now}})
    return {"ok": True, "deals": created}
