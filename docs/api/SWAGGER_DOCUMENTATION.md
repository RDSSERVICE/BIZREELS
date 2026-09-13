# BizReels Backend Architecture & Swagger OpenAPI Documentation

---

## 1. Executive Summary & Backend Architectural Analysis

**BizReels** is a full-stack, AI-powered local business marketplace and social video reels platform. The backend is constructed using a modern, scalable, microservice-ready Node.js architecture.

### 1.1 Technical Stack & Key Libraries
- **Core Framework**: Node.js v20+ with Express v5.2.1
- **Database & ODM**: MongoDB with Mongoose v9.7.4 (pre/post query execution profiling & geospatial indexing)
- **Caching & Async Queues**: Redis (ioredis v5.11) and BullMQ v5.80 for async tasks and job processing
- **Authentication & Security**: Passport.js v0.7, JWT (`jsonwebtoken` v9.0), Google OAuth 2.0 (`passport-google-oauth20`), Helmet v8.3, CORS, rate-limiting (`express-rate-limit` v8.5)
- **Cloud Telephony & Messaging**:
  - **Meta WhatsApp Cloud API v20.0+**: WABA Embedded Signup OAuth exchange, webhook challenge handshake, HMAC-SHA256 signature verification, 24-hour lead deduplication window, and 2.50 credit action charging.
  - **Exotel Cloud Telephony**: Click-to-call bridging API, call availability verification, caller ID masking, and CDR completion webhook charging.
- **Media & File Processing**: Multer v2.2, Cloudinary v2.10, Sharp v0.35 (image optimization), PDFKit v0.19 (invoice generation)
- **Real-Time Communication**: Socket.IO v4.8 for chat messaging and live streaming notifications
- **Payment Processing**: Razorpay Node SDK v2.9 for wallet top-ups, vendor subscription recharge orders, and escrow billing
- **Interactive Documentation**: `swagger-ui-express` and `swagger-jsdoc` exposing OpenAPI 3.0 specification

---

## 2. Interactive Swagger UI & OpenAPI Specification

The backend dynamically serves interactive OpenAPI 3.0 documentation directly from the application server with 100% route discovery.

### 2.1 Documentation Endpoints

| Resource | Route Path | Description |
|---|---|---|
| **Interactive Swagger UI** | `http://localhost:5000/api-docs` | Interactive Swagger UI web portal for live API testing |
| **Swagger UI (Alias)** | `http://localhost:5000/docs` | Secondary alias endpoint for Swagger UI |
| **OpenAPI 3.0 JSON Spec** | `http://localhost:5000/api-docs.json` | Raw OpenAPI 3.0 JSON specification document |
| **OpenAPI 3.0 JSON Spec (Alias)** | `http://localhost:5000/docs.json` | Secondary alias endpoint for OpenAPI spec |

---

## 3. Security & Authentication Scheme

BizReels implements **HTTP Bearer Authentication** using JSON Web Tokens (JWT).

### 3.1 Security Definition (`bearerAuth`)
- **Type**: HTTP
- **Scheme**: `bearer`
- **Format**: `JWT`
- **Header**: `Authorization: Bearer <your_access_token>`

### 3.2 Role-Based Access Control (RBAC)
User accounts support multi-role switching between:
- `customer`: Browse catalog, post requirement briefs (RFQs), hire creators, manage cart, place orders, click-to-call / WhatsApp vendors.
- `vendor`: Create business profiles, recharge action credits, receive WhatsApp & call customer leads, manage listings, submit bids, track sales analytics.
- `creator`: Manage creator profile, upload video reels, receive hiring proposals, monetize content.
- `admin`: Platform administration, KYC document verification, subscription plan management, vendor/creator approvals, financial reports.

---

## 4. Standard Response & Error Envelopes

All API endpoints strictly follow standardized JSON output envelopes:

### 4.1 Success Response (`ApiResponse`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 4.2 Error Response (`ApiError`)
```json
{
  "success": false,
  "message": "Validation error or unauthorized request",
  "errors": [
    "Phone number format is invalid. Please use E.164 format (+919876543210)."
  ]
}
```

---

## 5. Domain Categories & Tagged Route Summary

The API specification is structured into **26 tagged domain categories**:

### 1. Authentication (`/auth`)
- `POST /auth/register` — Create new customer, vendor, or creator account
- `POST /auth/login` — Authenticate email/password and issue JWT tokens
- `POST /auth/otp/request` — Request 6-digit SMS OTP
- `POST /auth/otp/verify` — Verify OTP code & establish session
- `GET /auth/me` — Fetch currently authenticated user session
- `PATCH /auth/switch-role` — Switch active workspace role (`customer`, `vendor`, `creator`)
- `GET /auth/google` & `GET /auth/google/callback` — Google OAuth 2.0 flow
- `POST /auth/google/session-exchange` — Exchange OAuth session token for JWT credentials
- `POST /auth/forgot-password` & `POST /auth/reset-password` — Password recovery flow

### 2. Users (`/users`)
- `GET /users/me` & `PATCH /users/me` — Profile management & settings
- `GET /users/me/onboarding-checklist` — User profile completion status
- `POST /users/:id/follow` & `POST /users/:id/unfollow` — User social graph
- `GET /users/:id/followers` & `GET /users/:id/following` — Social graph lists
- `GET /users/:user_id/trust-score` — User Trust Score calculation

### 3. Vendors (`/vendors`, `/vendor`)
- `GET /vendors` — Browse directory of verified vendor stores
- `GET /vendors/:id` — Detailed vendor store profile with ratings
- `PATCH /vendors/profile` — Update vendor business information
- `GET /vendor/dashboard` — Vendor dashboard KPIs (leads, balance, sales)
- `GET /vendor/analytics/overview` — Sales and performance analytics

### 4. Creators (`/creator`, `/creator-marketplace`)
- `GET /creator-marketplace` — Browse verified content creators
- `GET /creator-marketplace/:id` — Detailed creator portfolio & metrics
- `GET /creator/portfolio` & `POST /creator/portfolio` — Portfolio media items
- `PATCH /creator/rates` — Update rate card & collaboration packages
- `POST /creator/hire` — Send custom hiring proposal

### 5. Listings (`/listings`, `/categories`)
- `GET /listings` — Geolocated product & service proximity search (`lat`, `lng`, `distance`, `category`)
- `POST /listings` — Create catalog item
- `GET /listings/:id` — Listing details with vendor shop metadata
- `PUT /listings/:id` — Update listing details
- `DELETE /listings/:id` — Soft-delete listing
- `GET /categories` — Categories taxonomy

### 6. Reels (`/reels`, `/feed`)
- `GET /reels` — Retrieve social video feeds with creator metadata
- `POST /reels` — Upload and publish new video reel
- `GET /reels/:id/product-details` — Full product specs & tagged seller profile
- `POST /reels/:id/like` — Toggle like state for video reel

### 7. Subscriptions (`/subscription`, `/subscriptions`)
- `GET /subscription/plans` — Catalog of active vendor recharge tiers (Starter ₹499/599 Cr, Growth ₹1,199/1,599 Cr, Business ₹2,199/2,999 Cr)
- `GET /subscription` — Authenticated vendor active recharge plan & action credits balance
- `POST /subscription/purchase-razorpay` — Create Razorpay payment order for subscription recharge
- `POST /subscription/change` — Purchase/renew subscription using wallet balance
- `GET /subscriptions/history` — Subscription invoice and renewal history

### 8. WhatsApp & Leads (`/whatsapp`)
- `POST /whatsapp/click` — Generate WhatsApp click tracking context & authenticated `wa.me` redirect link
- `GET /whatsapp/vendor/status` — Vendor WABA connection status, phone number ID, and messaging tier
- `POST /whatsapp/vendor/connect` — Manually configure vendor WABA credentials
- `POST /whatsapp/vendor/embedded-signup-callback` — Meta Embedded Signup OAuth authorization code exchange
- `GET /whatsapp/vendor/leads` — Paginated WhatsApp leads captured for vendor CRM
- `POST /whatsapp/simulate-inbound` — Dev/Sandbox simulation of inbound customer WhatsApp message & 2.50 credit deduction

### 9. Telephony & Calls (`/calls`)
- `POST /calls/check-availability` — Check if vendor is available and has >= 2.50 action credits
- `POST /calls/initiate` — Initiate Exotel Click-to-Call bridging between customer and vendor
- `GET /calls/vendor-history` — Vendor call logs, durations, recordings, and lead attribution

### 10. Webhooks & Integrations (`/webhooks`)
- `GET /webhooks/whatsapp` — Meta Webhook verification challenge (`hub.mode`, `hub.challenge`, `hub.verify_token`)
- `POST /webhooks/whatsapp` — Meta Inbound WhatsApp Cloud API webhook receiver (validates `X-Hub-Signature-256`, deduplicates within 24h, deducts 2.50 credits)
- `POST /calls/webhook` & `POST /webhooks/exotel/call` — Exotel CDR call completion webhook (deducts 2.50 credits if connected >= 10s)

### 11. Requirements & Bidding (`/requirements`)
- `POST /requirements` — Customer posts project brief (RFQ)
- `GET /requirements` — Browse open project briefs
- `POST /requirements/quotes` — Vendor submits quote proposal
- `PATCH /requirements/quotes/:quoteId` — Customer accepts quote proposal

### 12. Wallet & Ledger (`/wallet`, `/transactions`)
- `GET /wallet/transactions` — Ledger transaction logs
- `POST /wallet/recharge` — Generate Razorpay top-up order

### 13. Cart & Orders (`/cart`, `/orders`)
- `GET /cart` — Load active user cart
- `POST /cart/add` — Add item to cart
- `PUT /cart/items/:itemId` & `DELETE /cart/items/:itemId` — Cart item management
- `POST /orders` — Checkout order placement
- `GET /orders/vendor/me` — List vendor received orders
- `PATCH /orders/:id/status` — Update order delivery status

### 14. Chat & Messages (`/chat`)
- `GET /chat/conversations` — User conversation threads
- `GET /chat/:id/messages` — Load thread messages
- `POST /chat/messages` — Send direct message

### 15. Notifications (`/notifications`)
- `GET /notifications` — List user notifications
- `PATCH /notifications/:id/read` & `PATCH /notifications/read-all` — Mark read states
- `GET /notifications/settings` & `PATCH /notifications/settings` — Notification preferences

### 16. Reviews & Ratings (`/reviews`)
- `GET /reviews/vendor/:id` — Load vendor customer feedback
- `GET /reviews/listing/:id` — Load listing reviews
- `POST /reviews` — Post new rating & review
- `POST /reviews/:id/helpful` — Vote review helpful

### 17. AI Services (`/ai`)
- `POST /ai/generate-copy` — Gemini AI listing & reel copy synthesis
- `POST /ai/smart-match` — AI requirement-vendor matching

### 18. Analytics (`/analytics`)
- `POST /analytics` — Log impression & click events
- `GET /analytics/summary` — Overview metrics

### 19. KYC & Compliance (`/kyc`, `/identity`)
- `POST /identity/aadhaar/verify` — Submit Aadhaar verification
- `POST /identity/pan/verify` — Submit PAN verification
- `POST /identity/gst/verify` — Submit GST verification
- `POST /identity/bank/verify` — Submit bank account details
- `GET /identity/trust-plus/me` — Trust+ level and badge summary

### 20. Offers & Campaigns (`/offers`, `/vendor-offers`)
- `GET /offers` — Active promotional discount codes
- `POST /offers` — Create vendor promotional offer

### 21. Location & Search (`/location`, `/search`)
- `GET /search` — Unified global search across listings, vendors, creators & reels
- `GET /search/suggest` — Autocomplete query suggestions
- `GET /location/geocode` — Spatial coordinate lookup

### 22. SEO (`/seo`)
- `GET /seo/listing/:slug` — Dynamic HTML meta tags for social crawlers
- `GET /seo/sitemap.xml` — Dynamic XML sitemap
- `GET /seo/robots.txt` — Crawler allowances

### 23. Admin Operations (`/admin`)
- `GET /admin/subscription/plans` — List all recharge plans (including drafts)
- `POST /admin/subscription/plans` — Create new subscription recharge plan
- `PATCH /admin/subscription/plans/:id` — Update subscription plan
- `DELETE /admin/subscription/plans/:id` — Soft-delete subscription plan
- `POST /admin/subscription/plans/:id/activate` & `/deactivate` — Plan availability toggle
- `GET /admin/subscription/user-subscriptions` — Monitor vendor credit balances
- `GET /admin/subscription/invoices` & `GET /admin/subscription/invoices/:id/pdf` — Tax invoices and PDF downloads
- `GET /admin/subscription/revenue` — Gross revenue and credit consumption analytics

### 24. General (`/health`, `/contact`, `/newsletter`)
- `GET /health` — Service heartbeat
- `POST /contact` — Public inquiry submission
- `POST /newsletter/subscribe` — Newsletter opt-in

---

## 6. Core Business Workflows & Schema Reference

### 6.1 Vendor Subscription Recharge Model
Vendor subscriptions operate on a **Prepaid Action Credit Recharge Model**:
- **Non-Expiring Credits**: Loaded credits never expire at the end of the month.
- **Standard Plans**:
  - **Starter**: ₹499 -> 599 Action Credits
  - **Growth**: ₹1,199 -> 1,599 Action Credits
  - **Business**: ₹2,199 -> 2,999 Action Credits
- **Action Rates**:
  - WhatsApp Inbound Customer Lead: **2.50 Credits**
  - Exotel Voice Call (connected >= 10s): **2.50 Credits**

### 6.2 Meta WhatsApp Embedded Signup Flow
1. Vendor clicks "Connect WhatsApp" in Vendor Dashboard.
2. Meta Embedded Signup popup opens with BizReels WABA App credentials.
3. On popup completion, frontend receives `{ code, wabaId, phoneNumberId }`.
4. Frontend calls `POST /api/v1/whatsapp/vendor/embedded-signup-callback`.
5. Backend exchanges `code` with Meta Graph API for a permanent System User access token, saves the connection, and activates the vendor's WhatsApp lead receiver.

### 6.3 24-Hour Deduplication Window
To ensure vendors are never double-billed for repeated messages or calls from the same customer within a short window:
- Both WhatsApp and Call events use an `ActionDedup` record.
- The deduplication window is set to **24 hours** (`86,400 seconds`).
- If a customer messages again within 24 hours, the message is delivered and logged in `WhatsAppLead`, but **0 credits are deducted**.

---

## 7. How to Test Endpoints in Swagger UI

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
2. **Open Swagger UI**:
   Navigate to `http://localhost:5000/api-docs` in your browser.
3. **Authenticate Session**:
   - Open the **Authentication** section.
   - Execute `POST /auth/login` or `POST /auth/otp/verify`.
   - Copy the returned `accessToken` string from the JSON response.
4. **Authorize Request Header**:
   - Click the green **Authorize** button at the top right of Swagger UI.
   - Enter `Bearer <your_access_token>` in the value box and click **Authorize**.
5. **Execute API Requests**:
   - Select any protected endpoint (e.g. `GET /subscription/plans`, `POST /whatsapp/simulate-inbound`, or `POST /calls/initiate`).
   - Click **Try it out**, fill in parameters or JSON payload, and click **Execute**.
