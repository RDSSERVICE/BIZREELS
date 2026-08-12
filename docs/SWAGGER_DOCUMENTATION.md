# BizReels Backend Architecture & Swagger OpenAPI Documentation

---

## 1. Executive Summary & Backend Architectural Analysis

**BizReels** is a full-stack, AI-powered local business marketplace and social video reels platform. The backend is constructed using a modern, scalable, microservice-ready Node.js architecture.

### 1.1 Technical Stack & Key Libraries
- **Core Framework**: Node.js v20+ with Express v5.2.1
- **Database & ODM**: MongoDB with Mongoose v9.7.4 (includes pre/post query execution profiling & high-performance indexing)
- **Caching & Async Queues**: Redis (ioredis v5.11) and BullMQ v5.80 for async tasks and job processing
- **Authentication & Security**: Passport.js v0.7, JWT (`jsonwebtoken` v9.0), Google OAuth 2.0 (`passport-google-oauth20`), Helmet v8.3, CORS, rate-limiting (`express-rate-limit` v8.5)
- **Media & File Processing**: Multer v2.2, Cloudinary v2.10, Sharp v0.35 (image optimization), PDFKit v0.19 (invoice generation)
- **Real-Time Communication**: Socket.IO v4.8 for chat messaging and live streaming notifications
- **Payment Processing**: Razorpay Node SDK v2.9 for wallet top-ups, escrow billing, and subscriptions
- **Interactive Documentation**: `swagger-ui-express` and `swagger-jsdoc` exposing OpenAPI 3.0 specification

---

## 2. Interactive Swagger UI & OpenAPI Specification

The backend dynamically serves interactive OpenAPI 3.0 documentation directly from the application server.

### 2.1 Documentation Endpoints

| Resource | Route Path | Description |
|---|---|---|
| **Interactive Swagger UI** | `http://localhost:5000/api-docs` | Interactive Swagger UI web portal for manual API testing |
| **Swagger UI (Alias)** | `http://localhost:5000/docs` | Secondary alias endpoint for Swagger UI |
| **OpenAPI 3.0 JSON Spec** | `http://localhost:5000/api-docs.json` | Raw OpenAPI 3.0 JSON specification document |
| **OpenAPI 3.0 JSON Spec (Alias)**| `http://localhost:5000/docs.json` | Secondary alias endpoint for OpenAPI spec |

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
- `customer`: Browse catalog, post requirement briefs (RFQs), hire creators, manage cart, place orders.
- `vendor`: Create business profiles, manage product/service listings, submit requirement quote bids, track sales analytics.
- `creator`: Manage creator profile, upload video reels, receive hiring proposals, monetize content.
- `admin`: Platform administration, KYC document verification, vendor/creator approvals, system configuration.

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
    "total": 150
  }
}
```

### 4.2 Error Response (`ApiError`)
```json
{
  "success": false,
  "message": "Validation error or unauthorized request",
  "errors": [
    "Email address format is invalid"
  ]
}
```

---

## 5. Domain Categories & Tagged Route Summary

The API specification is structured into **19 tagged domain categories**:

1. **Authentication** (`/auth`)
   - `POST /auth/register` — Create user account
   - `POST /auth/login` — Authenticate email/password
   - `POST /auth/otp/request` — Request phone/email OTP
   - `POST /auth/otp/verify` — Verify OTP & issue session token
   - `GET /auth/me` — Fetch current authenticated user session
   - `PATCH /auth/switch-role` — Switch active session workspace role
   - `GET /auth/google` & `GET /auth/google/callback` — Google OAuth 2.0 flow
2. **Users** (`/users`)
   - `GET /users/me` — Get user profile & preferences
   - `PATCH /users/me` — Update user details
   - `POST /users/:id/follow` & `POST /users/:id/unfollow` — User social graph
3. **Vendors** (`/vendors`)
   - `GET /vendors` — Browse vendor store directory
   - `GET /vendors/:id` — Detailed vendor store profile
   - `PATCH /vendors/profile` — Update vendor business information
   - `GET /vendors/analytics` — Access vendor store metrics & performance
4. **Creators** (`/creator`, `/creator-marketplace`)
   - `GET /creator-marketplace` — Browse verified content creators
   - `GET /creator/portfolio` — Creator media portfolio & rates
   - `POST /creator/hire` — Send custom hiring proposal
5. **Listings** (`/listings`)
   - `GET /listings` — Geolocated product & service proximity search (`lat`, `lng`, `distance`)
   - `POST /listings` — Create catalog item
   - `GET /listings/:id` — Listing details
   - `PUT /listings/:id` — Update listing
   - `DELETE /listings/:id` — Soft delete listing
6. **Reels** (`/reels`, `/feed`)
   - `GET /reels` — Retrieve social video feeds
   - `POST /reels` — Upload and publish new video reel
   - `POST /reels/:id/like` — Like/unlike video reel
   - `POST /reels/boost` — Spend balance to boost reel algorithm exposure
7. **Requirements & Bidding** (`/requirements`)
   - `POST /requirements` — Customer posts project brief (RFQ)
   - `GET /requirements` — Browse open project leads
   - `POST /requirements/quotes` — Vendor submits quote proposal
   - `PATCH /requirements/quotes/:quoteId` — Customer accepts quote proposal
8. **Wallet & Ledger** (`/wallet`, `/transactions`)
   - `GET /wallet/transactions` — Ledger transaction logs
   - `POST /wallet/recharge` — Generate Razorpay top-up order
   - `POST /wallet/subscribe` — Purchase plan using wallet balance
9. **Subscriptions** (`/subscriptions`, `/subscription`)
   - `GET /subscription/plans` — List active membership tiers
   - `POST /subscription/purchase-razorpay` — Direct Razorpay subscription checkout
10. **Cart & Orders** (`/cart`, `/orders`)
    - `GET /cart` — Load active user cart
    - `POST /cart/add` — Add item to cart
    - `POST /orders` — Checkout order placement
11. **Chat & Messages** (`/chat`)
    - `GET /chat/conversations` — User conversation threads
    - `GET /chat/:id/messages` — Load thread messages
    - `POST /chat/messages` — Send direct message
12. **Notifications** (`/notifications`)
    - `GET /notifications` — List user notifications
    - `PATCH /notifications/read-all` — Mark notifications as read
13. **Reviews & Ratings** (`/reviews`)
    - `GET /reviews/vendor/:id` — Load vendor customer feedback
    - `POST /reviews` — Post new rating & review
14. **AI Services** (`/ai`)
    - `POST /ai/generate-copy` — AI listing & reel copy synthesis
    - `POST /ai/smart-match` — AI requirement-vendor matching
15. **Analytics** (`/analytics`)
    - `POST /analytics` — Log impression & click events
    - `GET /analytics/summary` — Overview metrics
16. **KYC & Compliance** (`/kyc`)
    - `POST /kyc/submit` — Submit government ID & business docs
    - `GET /kyc/status` — Check verification state
17. **Offers & Campaigns** (`/offers`)
    - `GET /offers` — Active promotional discount codes
    - `POST /offers` — Create vendor promotional offer
18. **Location & Search** (`/location`, `/search`)
    - `GET /search` — Unified global search across listings, vendors, creators & reels
    - `GET /location/geocode` — Spatial coordinate lookup
19. **Admin Operations** (`/admin`)
    - `GET /admin/users` — User management & moderation
    - `PATCH /admin/vendors/:id/approve` — Approve vendor store
    - `GET /admin/revenue` — Platform financial overview

---

## 6. How to Test Endpoints in Swagger UI

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
2. **Open Swagger UI**:
   Navigate to `http://localhost:5000/api-docs` in your browser.
3. **Authenticate Session**:
   - Open the **Authentication** section in Swagger UI.
   - Execute `POST /auth/login` or `POST /auth/otp/verify`.
   - Copy the returned `accessToken` string from the JSON response.
4. **Authorize Request Header**:
   - Click the green **Authorize** button at the top right of Swagger UI.
   - Enter `Bearer <your_access_token>` in the value box and click **Authorize**.
5. **Execute API Requests**:
   - Select any protected endpoint (e.g. `GET /auth/me` or `POST /listings`).
   - Click **Try it out**, supply parameters or JSON body, and click **Execute**.
