# BizReels API Documentation

Describes REST API endpoints and Socket.io real-time event definitions.

---

## 1. REST Endpoints Registry (/api/v1)

### Authentication
- `POST /auth/register` - Create user credentials.
- `POST /auth/login` - Initiate email login.
- `POST /auth/otp/request` - Dispatch verification OTP.
- `POST /auth/otp/verify` - Confirm OTP codes.
- `PATCH /auth/switch-role` - Switch active role (`customer` | `vendor` | `creator`).

### Catalog Listings (Products & Services)
- `GET /listings` - Filter listings by radius distance, price range, condition, and category.
- `GET /listings/:id` - Load details of a specific item.
- `POST /listings` - Create a listing (Vendor restricted).
- `PUT /listings/:id` - Update listing details.
- `DELETE /listings/:id` - Soft-delete listing.
- `POST /listings/ai-copy` - AI generation copy helper.

### Proximity Requirements & Quotes
- `POST /requirements` - Buyer posts a custom requirement brief.
- `GET /requirements` - Proximity matches requirements matching vendor criteria.
- `POST /requirements/quotes` - Vendor submits a quote bid.
- `GET /requirements/:id/quotes` - Fetch quotes list.
- `PATCH /requirements/quotes/:quoteId` - Buyer accepts quote with escrow settlement.

### Inbox Chat
- `GET /chat/conversations` - Retrieve chat threads list.
- `GET /chat/:conversationId/messages` - Load messaging log and clear unreads.
- `POST /chat/messages` - Send a direct message.

### Wallet & Billing
- `POST /wallet/recharge` - Recharges user wallet balance.
- `GET /wallet/transactions` - Load transaction logs ledger.
- `POST /wallet/subscribe` - Purchase premium Business/Creator plans.

---

## 2. WebSockets Events

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join_conversation` | Client -> Server | `conversationId` | Joins a chat thread room. |
| `typing` | Client -> Server | `conversationId` | Broadcasts user typing activity. |
| `mark_seen` | Client -> Server | `conversationId` | Clears unreads counts. |
| `message` | Server -> Client | `Message` object | Delivers new chat message. |
| `join_stream` | Client -> Server | `streamId` | Joins live broadcast channel. |
| `stream_message` | Client <-> Server | Comment message | Relays live stream comment ticker. |
