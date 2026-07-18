# API Endpoint Reference Sheet
## v1 Endpoint Summary

---

## 1. Authentication & Role Switch (`/auth`)

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Account registration |
| `POST` | `/auth/login` | Public | Login credentials check |
| `POST` | `/auth/otp/request` | Public | Dispatches Verification code |
| `POST` | `/auth/otp/verify` | Public | Verifies OTP code |
| `POST` | `/auth/refresh` | Public | Rotates JWT session token |
| `POST` | `/auth/logout` | Authenticated | Clears cookies and revokes session |
| `PATCH` | `/auth/switch-role` | Authenticated | Swaps active session workspace role |

---

## 2. Catalog Listings (`/listings`)

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/listings` | Public | Retrieve geolocated lists feed |
| `GET` | `/listings/:id` | Public | Get specific catalog item details |
| `POST` | `/listings` | Vendor / Admin | Create new catalog item |
| `PUT` | `/listings/:id` | Vendor / Admin | Update catalog item details |
| `DELETE` | `/listings/:id` | Vendor / Admin | Soft delete item listing |

---

## 3. Requirements & Quotes Bidding (`/requirements`)

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/requirements` | Customer | Post project requirement briefs |
| `GET` | `/requirements` | Vendor | Read matching category proximity leads |
| `POST` | `/requirements/quotes` | Vendor | Submit single quote bid proposal |
| `GET` | `/requirements/:id/quotes`| Customer / Vendor | Load bids sent for requirement brief |
| `PATCH` | `/requirements/quotes/:quoteId`| Customer | Accept bid proposal, locks escrow balance |

---

## 4. Wallet & ledger (`/wallet`)

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/wallet/recharge` | Authenticated | Recharge wallet balance |
| `GET` | `/wallet/transactions` | Authenticated | Load transaction ledger logs |
| `POST` | `/wallet/subscribe` | Authenticated | Purchase boost subscription plan |

---

## 5. Inbox Chat & Messages (`/chat`)

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/chat/conversations` | Authenticated | Retrieve user conversation threads |
| `GET` | `/chat/:conversationId/messages`| Authenticated | Get message logs and clear unread counts |
| `POST` | `/chat/messages` | Authenticated | Dispatch new chat message |

---

## 6. Social Reels (`/reels`)

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/reels` | Creator / Vendor | Upload video reel |
| `GET` | `/reels` | Public | Retrieve feeds |
| `POST` | `/reels/boost` | Creator / Vendor | Spend credits to boost visibility |
| `DELETE` | `/reels/:id` | Creator / Vendor | Soft delete video reel |

---

## 7. Review Domain (`/reviews`)

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/reviews/user/:userId` | Public | Read ratings of a vendor/creator |
| `GET` | `/reviews/listing/:listingId`| Public | Read catalog item feedback |
| `POST` | `/reviews` | Authenticated | Post rating review |
| `DELETE` | `/reviews/:id` | Authenticated | Delete comment review |

---

## 8. Analytics & AI (`/analytics`, `/listings/ai-copy`)

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/listings/ai-copy` | Vendor / Creator | AI description description synthesis |
| `POST` | `/analytics` | Public / User | Track clicks / views analytics log |
| `GET` | `/analytics/summary` | Admin | Fetch aggregate KPI summaries |
