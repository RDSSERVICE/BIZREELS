# BizReels Complete API Endpoint Reference Manual

> **Total Endpoints Documented:** 517  
> **Base URL:** `https://bizreels.in/api/v1`  
> **Source of Truth:** Express Route Definitions & Controller Implementation (`backend/src/routes/`)  
> **Notice:** This document contains the definitive list of all API endpoints implemented in the BizReels backend.

---

## Table of Contents

1. [Admin Control Plane & Moderation (127 endpoints)](#admin-control-plane-moderation)
2. [AI Synthesis (Gemini 1.5 Flash) (13 endpoints)](#ai-synthesis-gemini-1-5-flash-)
3. [Platform Analytics & Event Telemetry (4 endpoints)](#platform-analytics-event-telemetry)
4. [Authentication & Role Management (33 endpoints)](#authentication-role-management)
5. [Shopping Cart & Multi-Vendor Checkout (10 endpoints)](#shopping-cart-multi-vendor-checkout)
6. [Categories & Taxonomy (6 endpoints)](#categories-taxonomy)
7. [Chat, Inbox & Real-time Messaging (7 endpoints)](#chat-inbox-real-time-messaging)
8. [Creator Studio & Profiles (21 endpoints)](#creator-studio-profiles)
9. [Creator Marketplace & Discovery (4 endpoints)](#creator-marketplace-discovery)
10. [Discovery & Blended Feeds (3 endpoints)](#discovery-blended-feeds)
11. [Followers & Social Graph (4 endpoints)](#followers-social-graph)
12. [Creator Hiring & Contract Deals (7 endpoints)](#creator-hiring-contract-deals)
13. [Government KYC & Sandbox Verification (8 endpoints)](#government-kyc-sandbox-verification)
14. [Root API Utilities & Public Web Endpoints (21 endpoints)](#root-api-utilities-public-web-endpoints)
15. [Inquiries, Leads & Contact RFQs (6 endpoints)](#inquiries-leads-contact-rfqs)
16. [Social Interactions (Likes, Comments, Shares) (4 endpoints)](#social-interactions-likes-comments-shares-)
17. [KYC Document Submissions (6 endpoints)](#kyc-document-submissions)
18. [Catalog Listings & Inventory (18 endpoints)](#catalog-listings-inventory)
19. [Live Streaming & Real-Time Shopping (7 endpoints)](#live-streaming-real-time-shopping)
20. [Location Services & Geo-Proximity (4 endpoints)](#location-services-geo-proximity)
21. [Media & Cloudinary Asset Processing (2 endpoints)](#media-cloudinary-asset-processing)
22. [Push & In-App Notifications (10 endpoints)](#push-in-app-notifications)
23. [Offers & Platform Discounts (16 endpoints)](#offers-platform-discounts)
24. [User & Vendor Onboarding Flow (1 endpoints)](#user-vendor-onboarding-flow)
25. [Orders, Fulfillment & Shiprocket (14 endpoints)](#orders-fulfillment-shiprocket)
26. [Phase 4 Modular Financials & Escrow (29 endpoints)](#phase-4-modular-financials-escrow)
27. [Video Reels & Social Feeds (16 endpoints)](#video-reels-social-feeds)
28. [Referrals & Gamified Rewards (11 endpoints)](#referrals-gamified-rewards)
29. [Content Reporting & Violation Flagging (4 endpoints)](#content-reporting-violation-flagging)
30. [Requirements, RFQs & Bidding (10 endpoints)](#requirements-rfqs-bidding)
31. [Reviews & Ratings (5 endpoints)](#reviews-ratings)
32. [Full-Text Search & Algolia (2 endpoints)](#full-text-search-algolia)
33. [SEO, Sitemaps & Crawler Previews (6 endpoints)](#seo-sitemaps-crawler-previews)
34. [Vendor/Creator Subscriptions & Add-ons (7 endpoints)](#vendor-creator-subscriptions-add-ons)
35. [Wallet Transactions & History (2 endpoints)](#wallet-transactions-history)
36. [File & Image Uploads (1 endpoints)](#file-image-uploads)
37. [Users & Profile Management (22 endpoints)](#users-profile-management)
38. [Vendor Storefront Offers & Vouchers (9 endpoints)](#vendor-storefront-offers-vouchers)
39. [Vendor Management & Storefronts (26 endpoints)](#vendor-management-storefronts)
40. [Wallet & Customer Financial Ledger (11 endpoints)](#wallet-customer-financial-ledger)

---

## 1. Admin Control Plane & Moderation

> Comprehensive back-office administration: 127 endpoints managing moderation, verification, commissions, transactions, and logs.

### 1.1 `PATCH` /api/v1/admin/me/profile

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/admin/me/profile`
- **Source File:** [`admin.routes.js:33`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L33)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.2 `POST` /api/v1/admin/me/password

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/me/password`
- **Source File:** [`admin.routes.js:63`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L63)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.3 `GET` /api/v1/admin/users

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/users`
- **Source File:** [`admin.routes.js:91`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L91)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.4 `GET` /api/v1/admin/customers

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/customers`
- **Source File:** [`admin.routes.js:111`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L111)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.5 `GET` /api/v1/admin/customers/stats

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/customers/stats`
- **Source File:** [`admin.routes.js:130`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L130)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.6 `GET` /api/v1/admin/customers/export

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/customers/export`
- **Source File:** [`admin.routes.js:135`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L135)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.7 `GET` /api/v1/admin/customers/:user_id/details

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/customers/:user_id/details`
- **Source File:** [`admin.routes.js:191`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L191)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.8 `POST` /api/v1/admin/users/:user_id/reset-password

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/users/:user_id/reset-password`
- **Source File:** [`admin.routes.js:196`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L196)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.9 `POST` /api/v1/admin/users/:user_id/verify

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/users/:user_id/verify`
- **Source File:** [`admin.routes.js:205`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L205)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.10 `POST` /api/v1/admin/users/:user_id/activate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/users/:user_id/activate`
- **Source File:** [`admin.routes.js:210`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L210)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.11 `GET` /api/v1/admin/vendors

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/vendors`
- **Source File:** [`admin.routes.js:216`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L216)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.12 `GET` /api/v1/admin/vendors/stats

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/vendors/stats`
- **Source File:** [`admin.routes.js:235`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L235)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.13 `GET` /api/v1/admin/vendors/export

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/vendors/export`
- **Source File:** [`admin.routes.js:240`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L240)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.14 `GET` /api/v1/admin/vendors/:user_id/details

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/vendors/:user_id/details`
- **Source File:** [`admin.routes.js:302`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L302)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.15 `GET` /api/v1/admin/creators

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/creators`
- **Source File:** [`admin.routes.js:308`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L308)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.16 `GET` /api/v1/admin/creators/stats

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/creators/stats`
- **Source File:** [`admin.routes.js:327`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L327)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.17 `GET` /api/v1/admin/creators/export

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/creators/export`
- **Source File:** [`admin.routes.js:332`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L332)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.18 `GET` /api/v1/admin/creators/:user_id/details

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/creators/:user_id/details`
- **Source File:** [`admin.routes.js:390`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L390)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.19 `POST` /api/v1/admin/users/:user_id/freeze-wallet

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/users/:user_id/freeze-wallet`
- **Source File:** [`admin.routes.js:396`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L396)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.20 `POST` /api/v1/admin/users/:user_id/unfreeze-wallet

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/users/:user_id/unfreeze-wallet`
- **Source File:** [`admin.routes.js:401`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L401)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.21 `POST` /api/v1/admin/users/:user_id/ban

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/users/:user_id/ban`
- **Source File:** [`admin.routes.js:406`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L406)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.22 `POST` /api/v1/admin/users/:user_id/unban

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/users/:user_id/unban`
- **Source File:** [`admin.routes.js:411`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L411)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.23 `POST` /api/v1/admin/users/:user_id/add-role

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/users/:user_id/add-role`
- **Source File:** [`admin.routes.js:416`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L416)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.24 `POST` /api/v1/admin/users/:user_id/remove-role

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/users/:user_id/remove-role`
- **Source File:** [`admin.routes.js:425`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L425)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.25 `GET` /api/v1/admin/users/:user_id

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/users/:user_id`
- **Source File:** [`admin.routes.js:435`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L435)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.26 `PATCH` /api/v1/admin/users/:user_id

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/admin/users/:user_id`
- **Source File:** [`admin.routes.js:441`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L441)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.27 `POST` /api/v1/admin/users/:user_id/suspend

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/users/:user_id/suspend`
- **Source File:** [`admin.routes.js:447`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L447)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.28 `DELETE` /api/v1/admin/users/:user_id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/admin/users/:user_id`
- **Source File:** [`admin.routes.js:453`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L453)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.29 `DELETE` /api/v1/admin/customers/:user_id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/admin/customers/:user_id`
- **Source File:** [`admin.routes.js:459`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L459)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.30 `DELETE` /api/v1/admin/vendors/:user_id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/admin/vendors/:user_id`
- **Source File:** [`admin.routes.js:465`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L465)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.31 `DELETE` /api/v1/admin/creators/:user_id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/admin/creators/:user_id`
- **Source File:** [`admin.routes.js:471`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L471)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.32 `GET` /api/v1/admin/users/:user_id/login-history

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/users/:user_id/login-history`
- **Source File:** [`admin.routes.js:477`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L477)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.33 `GET` /api/v1/admin/listings

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/listings`
- **Source File:** [`admin.routes.js:484`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L484)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.34 `POST` /api/v1/admin/listings/bulk-approve

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/listings/bulk-approve`
- **Source File:** [`admin.routes.js:493`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L493)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.35 `POST` /api/v1/admin/listings/:listing_id/takedown

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/listings/:listing_id/takedown`
- **Source File:** [`admin.routes.js:503`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L503)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `listing_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.36 `POST` /api/v1/admin/listings/:listing_id/restore

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/listings/:listing_id/restore`
- **Source File:** [`admin.routes.js:508`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L508)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `listing_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.37 `GET` /api/v1/admin/reels/stats

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/reels/stats`
- **Source File:** [`admin.routes.js:514`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L514)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.38 `GET` /api/v1/admin/reels

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/reels`
- **Source File:** [`admin.routes.js:519`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L519)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.39 `POST` /api/v1/admin/reels/:reel_id/takedown

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/reels/:reel_id/takedown`
- **Source File:** [`admin.routes.js:524`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L524)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `reel_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.40 `POST` /api/v1/admin/reels/:reel_id/restore

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/reels/:reel_id/restore`
- **Source File:** [`admin.routes.js:529`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L529)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `reel_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.41 `POST` /api/v1/admin/reels/:reel_id/moderate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/reels/:reel_id/moderate`
- **Source File:** [`admin.routes.js:534`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L534)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `reel_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.42 `POST` /api/v1/admin/reels/:reel_id/boost

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/reels/:reel_id/boost`
- **Source File:** [`admin.routes.js:539`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L539)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `reel_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.43 `POST` /api/v1/admin/reels/bulk-action

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/reels/bulk-action`
- **Source File:** [`admin.routes.js:544`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L544)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.44 `GET` /api/v1/admin/boost/plans

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/boost/plans`
- **Source File:** [`admin.routes.js:551`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L551)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.45 `POST` /api/v1/admin/boost/plans

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/boost/plans`
- **Source File:** [`admin.routes.js:557`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L557)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.46 `PATCH` /api/v1/admin/boost/plans/:id

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/admin/boost/plans/:id`
- **Source File:** [`admin.routes.js:563`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L563)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.47 `GET` /api/v1/admin/locations

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/locations`
- **Source File:** [`admin.routes.js:570`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L570)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.48 `POST` /api/v1/admin/locations

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/locations`
- **Source File:** [`admin.routes.js:576`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L576)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.49 `GET` /api/v1/admin/requirements

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/requirements`
- **Source File:** [`admin.routes.js:589`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L589)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.50 `POST` /api/v1/admin/requirements/:id/approve

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/requirements/:id/approve`
- **Source File:** [`admin.routes.js:623`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L623)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.51 `POST` /api/v1/admin/requirements/:id/reject

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/requirements/:id/reject`
- **Source File:** [`admin.routes.js:629`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L629)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.52 `GET` /api/v1/admin/category-requests

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/category-requests`
- **Source File:** [`admin.routes.js:637`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L637)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.53 `POST` /api/v1/admin/category-requests/:id/approve

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/category-requests/:id/approve`
- **Source File:** [`admin.routes.js:646`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L646)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.54 `POST` /api/v1/admin/category-requests/:id/reject

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/category-requests/:id/reject`
- **Source File:** [`admin.routes.js:712`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L712)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.55 `GET` /api/v1/admin/wallet/stats

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/wallet/stats`
- **Source File:** [`admin.routes.js:747`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L747)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.56 `GET` /api/v1/admin/wallet/user-search

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/wallet/user-search`
- **Source File:** [`admin.routes.js:753`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L753)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.57 `GET` /api/v1/admin/wallet/transactions

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/wallet/transactions`
- **Source File:** [`admin.routes.js:760`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L760)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.58 `GET` /api/v1/admin/wallet/transactions/export/csv

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/wallet/transactions/export/csv`
- **Source File:** [`admin.routes.js:781`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L781)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.59 `GET` /api/v1/admin/wallet/transactions/export/excel

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/wallet/transactions/export/excel`
- **Source File:** [`admin.routes.js:804`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L804)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.60 `POST` /api/v1/admin/wallet/manual-credit

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/wallet/manual-credit`
- **Source File:** [`admin.routes.js:836`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L836)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.61 `POST` /api/v1/admin/wallet/manual-debit

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/wallet/manual-debit`
- **Source File:** [`admin.routes.js:869`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L869)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.62 `GET` /api/v1/admin/wallet/recharges

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/wallet/recharges`
- **Source File:** [`admin.routes.js:901`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L901)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.63 `GET` /api/v1/admin/wallet/refunds

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/wallet/refunds`
- **Source File:** [`admin.routes.js:914`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L914)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.64 `POST` /api/v1/admin/wallet/refunds/:id/approve

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/wallet/refunds/:id/approve`
- **Source File:** [`admin.routes.js:927`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L927)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.65 `POST` /api/v1/admin/wallet/refunds/:id/reject

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/wallet/refunds/:id/reject`
- **Source File:** [`admin.routes.js:953`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L953)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.66 `GET` /api/v1/admin/reviews

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/reviews`
- **Source File:** [`admin.routes.js:979`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L979)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.67 `DELETE` /api/v1/admin/reviews/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/admin/reviews/:id`
- **Source File:** [`admin.routes.js:999`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L999)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.68 `GET` /api/v1/admin/chat/reported

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/chat/reported`
- **Source File:** [`admin.routes.js:1012`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1012)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.69 `POST` /api/v1/admin/notifications/broadcast

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/notifications/broadcast`
- **Source File:** [`admin.routes.js:1029`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1029)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.70 `GET` /api/v1/admin/coupons

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/coupons`
- **Source File:** [`admin.routes.js:1046`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1046)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.71 `POST` /api/v1/admin/coupons

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/coupons`
- **Source File:** [`admin.routes.js:1052`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1052)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.72 `GET` /api/v1/admin/cms

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/cms`
- **Source File:** [`admin.routes.js:1065`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1065)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.73 `PUT` /api/v1/admin/cms/:slug

- **Method:** `PUT`
- **Canonical URL:** `/api/v1/admin/cms/:slug`
- **Source File:** [`admin.routes.js:1071`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1071)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `slug` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.74 `GET` /api/v1/admin/app-settings

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/app-settings`
- **Source File:** [`admin.routes.js:1089`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1089)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.75 `PATCH` /api/v1/admin/app-settings

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/admin/app-settings`
- **Source File:** [`admin.routes.js:1109`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1109)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.76 `GET` /api/v1/admin/security/logs

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/security/logs`
- **Source File:** [`admin.routes.js:1124`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1124)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.77 `GET` /api/v1/admin/analytics/overview

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/analytics/overview`
- **Source File:** [`admin.routes.js:1130`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1130)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.78 `POST` /api/v1/admin/nudge/scan

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/nudge/scan`
- **Source File:** [`admin.routes.js:1136`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1136)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.79 `POST` /api/v1/admin/seed/reset-demo

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/seed/reset-demo`
- **Source File:** [`admin.routes.js:1148`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1148)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.80 `POST` /api/v1/admin/dev/purge-test-data

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/dev/purge-test-data`
- **Source File:** [`admin.routes.js:1152`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1152)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.81 `POST` /api/v1/admin/dev/rotate-admin-phone

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/dev/rotate-admin-phone`
- **Source File:** [`admin.routes.js:1165`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1165)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.82 `POST` /api/v1/admin/listings/:listing_id/dev-backdate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/listings/:listing_id/dev-backdate`
- **Source File:** [`admin.routes.js:1175`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1175)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `listing_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.83 `GET` /api/v1/admin/settings/integrations

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/settings/integrations`
- **Source File:** [`admin.routes.js:1202`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1202)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.84 `PATCH` /api/v1/admin/settings/integrations

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/admin/settings/integrations`
- **Source File:** [`admin.routes.js:1207`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1207)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.85 `POST` /api/v1/admin/settings/integrations/test

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/settings/integrations/test`
- **Source File:** [`admin.routes.js:1212`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1212)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.86 `GET` /api/v1/admin/transactions

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/transactions`
- **Source File:** [`admin.routes.js:1376`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1376)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.87 `GET` /api/v1/admin/transactions.csv

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/transactions.csv`
- **Source File:** [`admin.routes.js:1400`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1400)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.88 `GET` /api/v1/admin/orders

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/orders`
- **Source File:** [`admin.routes.js:1417`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1417)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.89 `GET` /api/v1/admin/commission/config

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/commission/config`
- **Source File:** [`admin.routes.js:1487`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1487)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.90 `POST` /api/v1/admin/commission/config

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/commission/config`
- **Source File:** [`admin.routes.js:1492`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1492)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.91 `POST` /api/v1/admin/commission/lead-boost

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/commission/lead-boost`
- **Source File:** [`admin.routes.js:1506`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1506)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.92 `POST` /api/v1/admin/commission/gst

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/commission/gst`
- **Source File:** [`admin.routes.js:1517`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1517)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.93 `GET` /api/v1/admin/commission/history

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/commission/history`
- **Source File:** [`admin.routes.js:1528`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1528)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.94 `GET` /api/v1/admin/commission/analytics

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/commission/analytics`
- **Source File:** [`admin.routes.js:1533`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1533)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.95 `GET` /api/v1/admin/commissions

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/commissions`
- **Source File:** [`admin.routes.js:1538`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1538)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.96 `GET` /api/v1/admin/commissions/summary

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/commissions/summary`
- **Source File:** [`admin.routes.js:1546`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1546)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.97 `POST` /api/v1/admin/commissions/rate/global

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/commissions/rate/global`
- **Source File:** [`admin.routes.js:1552`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1552)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.98 `POST` /api/v1/admin/commissions/rate/category

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/commissions/rate/category`
- **Source File:** [`admin.routes.js:1558`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1558)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.99 `GET` /api/v1/admin/audit-log

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/audit-log`
- **Source File:** [`admin.routes.js:1565`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1565)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.100 `GET` /api/v1/admin/subscription/plans

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/subscription/plans`
- **Source File:** [`admin.routes.js:1616`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1616)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.101 `POST` /api/v1/admin/subscription/plans

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/subscription/plans`
- **Source File:** [`admin.routes.js:1621`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1621)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.102 `PATCH` /api/v1/admin/subscription/plans/:id

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/admin/subscription/plans/:id`
- **Source File:** [`admin.routes.js:1626`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1626)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.103 `DELETE` /api/v1/admin/subscription/plans/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/admin/subscription/plans/:id`
- **Source File:** [`admin.routes.js:1631`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1631)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.104 `POST` /api/v1/admin/subscription/plans/:id/activate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/subscription/plans/:id/activate`
- **Source File:** [`admin.routes.js:1636`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1636)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.105 `POST` /api/v1/admin/subscription/plans/:id/deactivate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/subscription/plans/:id/deactivate`
- **Source File:** [`admin.routes.js:1641`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1641)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.106 `POST` /api/v1/admin/subscription/plans/:id/archive

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/subscription/plans/:id/archive`
- **Source File:** [`admin.routes.js:1646`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1646)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.107 `POST` /api/v1/admin/subscription/plans/:id/duplicate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/subscription/plans/:id/duplicate`
- **Source File:** [`admin.routes.js:1651`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1651)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.108 `GET` /api/v1/admin/subscription/user-subscriptions

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/subscription/user-subscriptions`
- **Source File:** [`admin.routes.js:1657`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1657)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.109 `POST` /api/v1/admin/subscription/user-subscriptions/:id/cancel

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/subscription/user-subscriptions/:id/cancel`
- **Source File:** [`admin.routes.js:1662`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1662)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.110 `POST` /api/v1/admin/subscription/user-subscriptions/:id/extend

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/subscription/user-subscriptions/:id/extend`
- **Source File:** [`admin.routes.js:1667`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1667)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.111 `POST` /api/v1/admin/subscription/user-subscriptions/:id/renew

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/subscription/user-subscriptions/:id/renew`
- **Source File:** [`admin.routes.js:1672`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1672)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.112 `GET` /api/v1/admin/subscription/coupons

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/subscription/coupons`
- **Source File:** [`admin.routes.js:1678`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1678)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.113 `POST` /api/v1/admin/subscription/coupons

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/subscription/coupons`
- **Source File:** [`admin.routes.js:1683`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1683)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.114 `PATCH` /api/v1/admin/subscription/coupons/:id

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/admin/subscription/coupons/:id`
- **Source File:** [`admin.routes.js:1688`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1688)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.115 `DELETE` /api/v1/admin/subscription/coupons/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/admin/subscription/coupons/:id`
- **Source File:** [`admin.routes.js:1693`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1693)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.116 `POST` /api/v1/admin/subscription/coupons/:id/toggle

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/subscription/coupons/:id/toggle`
- **Source File:** [`admin.routes.js:1698`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1698)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.117 `GET` /api/v1/admin/subscription/invoices

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/subscription/invoices`
- **Source File:** [`admin.routes.js:1704`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1704)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.118 `GET` /api/v1/admin/subscription/invoices/:id/pdf

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/subscription/invoices/:id/pdf`
- **Source File:** [`admin.routes.js:1709`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1709)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.119 `GET` /api/v1/admin/subscription/revenue

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/subscription/revenue`
- **Source File:** [`admin.routes.js:1717`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1717)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.120 `GET` /api/v1/admin/reports/financial

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/reports/financial`
- **Source File:** [`admin.routes.js:1723`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1723)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.121 `GET` /api/v1/admin/locations/radius

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/locations/radius`
- **Source File:** [`admin.routes.js:1774`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1774)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.122 `PATCH` /api/v1/admin/locations/radius

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/admin/locations/radius`
- **Source File:** [`admin.routes.js:1780`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1780)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.123 `GET` /api/v1/admin/credit-rates

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/credit-rates`
- **Source File:** [`admin.routes.js:1795`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1795)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.124 `POST` /api/v1/admin/credit-rates

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/credit-rates`
- **Source File:** [`admin.routes.js:1812`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1812)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.125 `GET` /api/v1/admin/contact-submissions

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/contact-submissions`
- **Source File:** [`admin.routes.js:1840`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1840)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 1.126 `PATCH` /api/v1/admin/contact-submissions/:id

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/admin/contact-submissions/:id`
- **Source File:** [`admin.routes.js:1884`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1884)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 1.127 `DELETE` /api/v1/admin/contact-submissions/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/admin/contact-submissions/:id`
- **Source File:** [`admin.routes.js:1918`](file:///d:/BizReels%20Website/backend/src/routes/admin.routes.js#L1918)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 2. AI Synthesis (Gemini 1.5 Flash)

> AI-driven product description generation, reel caption generation, and moderation.

### 2.1 `POST` /api/v1/ai/generate-listing-content

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/generate-listing-content`
- **Source File:** [`ai.routes.js:33`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L33)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.2 `POST` /api/v1/ai/transcribe-audio

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/transcribe-audio`
- **Source File:** [`ai.routes.js:72`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L72)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.3 `POST` /api/v1/ai/improve-description

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/improve-description`
- **Source File:** [`ai.routes.js:83`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L83)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.4 `POST` /api/v1/ai/generate-title

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/generate-title`
- **Source File:** [`ai.routes.js:117`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L117)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.5 `POST` /api/v1/ai/detect-category

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/detect-category`
- **Source File:** [`ai.routes.js:134`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L134)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.6 `POST` /api/v1/ai/parse-demand

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/parse-demand`
- **Source File:** [`ai.routes.js:150`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L150)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.7 `POST` /api/v1/ai/match-vendors

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/match-vendors`
- **Source File:** [`ai.routes.js:162`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L162)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.8 `POST` /api/v1/ai/suggest-price

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/suggest-price`
- **Source File:** [`ai.routes.js:204`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L204)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.9 `POST` /api/v1/ai/negotiate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/negotiate`
- **Source File:** [`ai.routes.js:228`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L228)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.10 `POST` /api/v1/ai/generate-image

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/generate-image`
- **Source File:** [`ai.routes.js:254`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L254)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.11 `POST` /api/v1/ai/generate-reel

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/generate-reel`
- **Source File:** [`ai.routes.js:306`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L306)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.12 `POST` /api/v1/ai/generate-specifications

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/generate-specifications`
- **Source File:** [`ai.routes.js:358`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L358)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 2.13 `POST` /api/v1/ai/generate-description

- **Method:** `POST`
- **Canonical URL:** `/api/v1/ai/generate-description`
- **Source File:** [`ai.routes.js:379`](file:///d:/BizReels%20Website/backend/src/routes/ai.routes.js#L379)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "title": "Leather laptop sleeve",
    "keywords": [
      "genuine leather",
      "waterproof",
      "15 inch"
    ],
    "tone": "professional"
  }
  ```
- **Fields Table:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `title` | `String` | Yes | Product title |
  | `keywords` | `Array[String]` | No | Key product selling points |
  | `tone` | `String` | No | 'professional', 'creative', 'casual' |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 3. Platform Analytics & Event Telemetry

> Page view logging, clickstream tracking, impression counters, and conversion metrics.

### 3.1 `POST` /api/v1/analytics/

- **Method:** `POST`
- **Canonical URL:** `/api/v1/analytics/`
- **Source File:** [`analyticsRoutes.js:14`](file:///d:/BizReels%20Website/backend/src/routes/analyticsRoutes.js#L14)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 3.2 `GET` /api/v1/analytics/vendor

- **Method:** `GET`
- **Canonical URL:** `/api/v1/analytics/vendor`
- **Source File:** [`analyticsRoutes.js:29`](file:///d:/BizReels%20Website/backend/src/routes/analyticsRoutes.js#L29)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 3.3 `GET` /api/v1/analytics/creator

- **Method:** `GET`
- **Canonical URL:** `/api/v1/analytics/creator`
- **Source File:** [`analyticsRoutes.js:32`](file:///d:/BizReels%20Website/backend/src/routes/analyticsRoutes.js#L32)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 3.4 `GET` /api/v1/analytics/summary

- **Method:** `GET`
- **Canonical URL:** `/api/v1/analytics/summary`
- **Source File:** [`analyticsRoutes.js:35`](file:///d:/BizReels%20Website/backend/src/routes/analyticsRoutes.js#L35)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 4. Authentication & Role Management

> User registration, dual-channel OTP login, Google OAuth, mobile SDK token exchanges, and role switching.

### 4.1 `POST` /api/v1/auth/register

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/register`
- **Source File:** [`authRoutes.js:34`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L34)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Arjun Verma",
    "email": "arjun@example.com",
    "password": "Password123!",
    "phone": "9876543210",
    "roles": [
      "customer",
      "vendor"
    ]
  }
  ```
- **Fields Table:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `name` | `String` | Yes | Full name (2-50 characters) |
  | `email` | `String` | Yes | Valid email address |
  | `password` | `String` | Yes | Password (min 8 characters) |
  | `phone` | `String` | No | 10-digit Indian phone number |
  | `roles` | `Array[String]` | No | Desired roles from ['customer', 'vendor', 'creator'] |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.2 `POST` /api/v1/auth/login

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/login`
- **Source File:** [`authRoutes.js:35`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L35)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "arjun@example.com",
    "password": "Password123!"
  }
  ```
- **Fields Table:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `email` | `String` | Yes | Registered email address |
  | `password` | `String` | Yes | Account password |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.3 `POST` /api/v1/auth/dev/admin-login

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/dev/admin-login`
- **Source File:** [`authRoutes.js:41`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L41)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.4 `POST` /api/v1/auth/otp/send

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/otp/send`
- **Source File:** [`authRoutes.js:63`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L63)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "phone": "9876543210",
    "channel": "sms"
  }
  ```
- **Fields Table:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `phone` | `String` | Yes | 10-digit Indian phone number |
  | `channel` | `String` | No | Channel: 'sms' or 'whatsapp' (default 'sms') |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.5 `POST` /api/v1/auth/otp/resend

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/otp/resend`
- **Source File:** [`authRoutes.js:64`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L64)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.6 `POST` /api/v1/auth/otp/verify

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/otp/verify`
- **Source File:** [`authRoutes.js:65`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L65)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "phone": "9876543210",
    "otp": "123456",
    "name": "Arjun Verma",
    "roles": [
      "customer"
    ],
    "referral_code": "REF123"
  }
  ```
- **Fields Table:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `phone` | `String` | Yes | 10-digit phone number |
  | `otp` | `String` | Yes | 4 to 6 digit verification code |
  | `name` | `String` | No | Full name if registering a new account |
  | `roles` | `Array[String]` | No | Initial roles (defaults to ['customer']) |
  | `referral_code` | `String` | No | Optional invite code |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.7 `POST` /api/v1/auth/otp/request

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/otp/request`
- **Source File:** [`authRoutes.js:68`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L68)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.8 `POST` /api/v1/auth/phone/send-otp

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/phone/send-otp`
- **Source File:** [`authRoutes.js:69`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L69)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.9 `POST` /api/v1/auth/phone/verify-otp

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/phone/verify-otp`
- **Source File:** [`authRoutes.js:70`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L70)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.10 `POST` /api/v1/auth/send-otp

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/send-otp`
- **Source File:** [`authRoutes.js:71`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L71)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.11 `POST` /api/v1/auth/verify-otp

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/verify-otp`
- **Source File:** [`authRoutes.js:72`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L72)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.12 `POST` /api/v1/auth/forgot-password

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/forgot-password`
- **Source File:** [`authRoutes.js:74`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L74)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.13 `POST` /api/v1/auth/reset-password

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/reset-password`
- **Source File:** [`authRoutes.js:75`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L75)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.14 `POST` /api/v1/auth/refresh-token

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/refresh-token`
- **Source File:** [`authRoutes.js:77`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L77)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.15 `POST` /api/v1/auth/refresh

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/refresh`
- **Source File:** [`authRoutes.js:78`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L78)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.16 `GET` /api/v1/auth/google

- **Method:** `GET`
- **Canonical URL:** `/api/v1/auth/google`
- **Source File:** [`authRoutes.js:81`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L81)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.17 `GET` /api/v1/auth/google/callback

- **Method:** `GET`
- **Canonical URL:** `/api/v1/auth/google/callback`
- **Source File:** [`authRoutes.js:98`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L98)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.18 `GET` /api/v1/auth/app/google

- **Method:** `GET`
- **Canonical URL:** `/api/v1/auth/app/google`
- **Source File:** [`authRoutes.js:126`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L126)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.19 `GET` /api/v1/auth/app/google/callback

- **Method:** `GET`
- **Canonical URL:** `/api/v1/auth/app/google/callback`
- **Source File:** [`authRoutes.js:142`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L142)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.20 `POST` /api/v1/auth/google/token

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/google/token`
- **Source File:** [`authRoutes.js:164`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L164)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "idToken": "eyJhbGciOi...",
    "role": "customer",
    "referral_code": "REF123"
  }
  ```
- **Fields Table:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `idToken` | `String` | Yes | Google ID Token issued by Google Play Services SDK |
  | `role` | `String` | No | Desired active role ('customer'|'vendor'|'creator') |
  | `referral_code` | `String` | No | Optional referral invite code |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.21 `POST` /api/v1/auth/google/mobile

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/google/mobile`
- **Source File:** [`authRoutes.js:165`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L165)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.22 `POST` /api/v1/auth/app/google

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/app/google`
- **Source File:** [`authRoutes.js:166`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L166)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.23 `GET` /api/v1/auth/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/auth/me`
- **Source File:** [`authRoutes.js:169`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L169)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.24 `PATCH` /api/v1/auth/profile

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/auth/profile`
- **Source File:** [`authRoutes.js:170`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L170)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.25 `POST` /api/v1/auth/users/:id/follow

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/users/:id/follow`
- **Source File:** [`authRoutes.js:171`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L171)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 4.26 `POST` /api/v1/auth/users/:id/unfollow

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/users/:id/unfollow`
- **Source File:** [`authRoutes.js:172`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L172)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 4.27 `DELETE` /api/v1/auth/profile

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/auth/profile`
- **Source File:** [`authRoutes.js:173`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L173)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.28 `DELETE` /api/v1/auth/me

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/auth/me`
- **Source File:** [`authRoutes.js:173`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L173)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.29 `DELETE` /api/v1/auth/delete-account

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/auth/delete-account`
- **Source File:** [`authRoutes.js:173`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L173)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.30 `POST` /api/v1/auth/logout

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/logout`
- **Source File:** [`authRoutes.js:174`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L174)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.31 `POST` /api/v1/auth/logout-all

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/logout-all`
- **Source File:** [`authRoutes.js:175`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L175)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.32 `PATCH` /api/v1/auth/switch-role

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/auth/switch-role`
- **Source File:** [`authRoutes.js:176`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L176)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "role": "vendor"
  }
  ```
- **Fields Table:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `role` | `String` | Yes | Target role ('customer', 'vendor', or 'creator') already possessed by user |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 4.33 `POST` /api/v1/auth/add-role

- **Method:** `POST`
- **Canonical URL:** `/api/v1/auth/add-role`
- **Source File:** [`authRoutes.js:177`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js#L177)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 5. Shopping Cart & Multi-Vendor Checkout

> Shopping cart management, item quantity updates, multi-vendor cart splitting, and checkout.

### 5.1 `GET` /api/v1/cart/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/cart/`
- **Source File:** [`cart.routes.js:141`](file:///d:/BizReels%20Website/backend/src/routes/cart.routes.js#L141)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 5.2 `GET` /api/v1/cart/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/cart/me`
- **Source File:** [`cart.routes.js:141`](file:///d:/BizReels%20Website/backend/src/routes/cart.routes.js#L141)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 5.3 `POST` /api/v1/cart/add

- **Method:** `POST`
- **Canonical URL:** `/api/v1/cart/add`
- **Source File:** [`cart.routes.js:147`](file:///d:/BizReels%20Website/backend/src/routes/cart.routes.js#L147)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "listing_id": "65e9b8f2d84712001a1c94b2",
    "quantity": 2,
    "customization_notes": "Size L, Blue color"
  }
  ```
- **Fields Table:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `listing_id` | `String (ObjectId)` | Yes | ID of listing product |
  | `quantity` | `Number` | Yes | Quantity to order (integer 1-99) |
  | `customization_notes` | `String` | No | Special requirements or size/color notes |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 5.4 `POST` /api/v1/cart/me/add

- **Method:** `POST`
- **Canonical URL:** `/api/v1/cart/me/add`
- **Source File:** [`cart.routes.js:147`](file:///d:/BizReels%20Website/backend/src/routes/cart.routes.js#L147)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 5.5 `PATCH` /api/v1/cart/items/:listing_id

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/cart/items/:listing_id`
- **Source File:** [`cart.routes.js:199`](file:///d:/BizReels%20Website/backend/src/routes/cart.routes.js#L199)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `listing_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 5.6 `PATCH` /api/v1/cart/me/items/:listing_id

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/cart/me/items/:listing_id`
- **Source File:** [`cart.routes.js:199`](file:///d:/BizReels%20Website/backend/src/routes/cart.routes.js#L199)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `listing_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 5.7 `DELETE` /api/v1/cart/items/:listing_id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/cart/items/:listing_id`
- **Source File:** [`cart.routes.js:234`](file:///d:/BizReels%20Website/backend/src/routes/cart.routes.js#L234)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `listing_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 5.8 `DELETE` /api/v1/cart/me/items/:listing_id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/cart/me/items/:listing_id`
- **Source File:** [`cart.routes.js:234`](file:///d:/BizReels%20Website/backend/src/routes/cart.routes.js#L234)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `listing_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 5.9 `POST` /api/v1/cart/checkout

- **Method:** `POST`
- **Canonical URL:** `/api/v1/cart/checkout`
- **Source File:** [`cart.routes.js:254`](file:///d:/BizReels%20Website/backend/src/routes/cart.routes.js#L254)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "delivery_address": {
      "street": "123 MG Road",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560001",
      "phone": "9876543210"
    },
    "payment_method": "razorpay",
    "notes": "Please leave package at the door"
  }
  ```
- **Fields Table:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `delivery_address` | `Object` | Yes | Shipping destination object |
  | `delivery_address.street` | `String` | Yes | Street address / building number |
  | `delivery_address.city` | `String` | Yes | City name |
  | `delivery_address.state` | `String` | Yes | State name |
  | `delivery_address.pincode` | `String` | Yes | 6-digit postal code |
  | `delivery_address.phone` | `String` | Yes | Recipient contact number |
  | `payment_method` | `String` | Yes | 'razorpay', 'wallet', or 'cod' |
  | `notes` | `String` | No | Special delivery instructions |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 5.10 `POST` /api/v1/cart/me/checkout

- **Method:** `POST`
- **Canonical URL:** `/api/v1/cart/me/checkout`
- **Source File:** [`cart.routes.js:254`](file:///d:/BizReels%20Website/backend/src/routes/cart.routes.js#L254)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 6. Categories & Taxonomy

> Platform category hierarchies, icons, banners, and category-level commission rates.

### 6.1 `GET` /api/v1/categories/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/categories/`
- **Source File:** [`category.routes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/category.routes.js#L18)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 6.2 `GET` /api/v1/categories/:slug

- **Method:** `GET`
- **Canonical URL:** `/api/v1/categories/:slug`
- **Source File:** [`category.routes.js:35`](file:///d:/BizReels%20Website/backend/src/routes/category.routes.js#L35)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `slug` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 6.3 `POST` /api/v1/categories/

- **Method:** `POST`
- **Canonical URL:** `/api/v1/categories/`
- **Source File:** [`category.routes.js:43`](file:///d:/BizReels%20Website/backend/src/routes/category.routes.js#L43)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 6.4 `POST` /api/v1/categories/bulk-upload

- **Method:** `POST`
- **Canonical URL:** `/api/v1/categories/bulk-upload`
- **Source File:** [`category.routes.js:58`](file:///d:/BizReels%20Website/backend/src/routes/category.routes.js#L58)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: multipart/form-data`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 6.5 `PATCH` /api/v1/categories/:cid

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/categories/:cid`
- **Source File:** [`category.routes.js:66`](file:///d:/BizReels%20Website/backend/src/routes/category.routes.js#L66)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `cid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 6.6 `DELETE` /api/v1/categories/:cid

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/categories/:cid`
- **Source File:** [`category.routes.js:71`](file:///d:/BizReels%20Website/backend/src/routes/category.routes.js#L71)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `cid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 7. Chat, Inbox & Real-time Messaging

> Direct messaging between buyers, vendors, and creators, attachments, and unread counters.

### 7.1 `GET` /api/v1/chat/conversations

- **Method:** `GET`
- **Canonical URL:** `/api/v1/chat/conversations`
- **Source File:** [`chatRoutes.js:11`](file:///d:/BizReels%20Website/backend/src/routes/chatRoutes.js#L11)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 7.2 `GET` /api/v1/chat/:conversationId/messages

- **Method:** `GET`
- **Canonical URL:** `/api/v1/chat/:conversationId/messages`
- **Source File:** [`chatRoutes.js:12`](file:///d:/BizReels%20Website/backend/src/routes/chatRoutes.js#L12)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `conversationId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 7.3 `POST` /api/v1/chat/messages

- **Method:** `POST`
- **Canonical URL:** `/api/v1/chat/messages`
- **Source File:** [`chatRoutes.js:13`](file:///d:/BizReels%20Website/backend/src/routes/chatRoutes.js#L13)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 7.4 `DELETE` /api/v1/chat/:conversationId/clear

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/chat/:conversationId/clear`
- **Source File:** [`chatRoutes.js:14`](file:///d:/BizReels%20Website/backend/src/routes/chatRoutes.js#L14)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `conversationId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 7.5 `DELETE` /api/v1/chat/:conversationId

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/chat/:conversationId`
- **Source File:** [`chatRoutes.js:15`](file:///d:/BizReels%20Website/backend/src/routes/chatRoutes.js#L15)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `conversationId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 7.6 `DELETE` /api/v1/chat/messages/:messageId/me

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/chat/messages/:messageId/me`
- **Source File:** [`chatRoutes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/chatRoutes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `messageId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 7.7 `DELETE` /api/v1/chat/messages/:messageId/everyone

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/chat/messages/:messageId/everyone`
- **Source File:** [`chatRoutes.js:17`](file:///d:/BizReels%20Website/backend/src/routes/chatRoutes.js#L17)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `messageId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 8. Creator Studio & Profiles

> Creator portfolio showcases, pricing packages, video deliverables, and creator analytics.

### 8.1 `GET` /api/v1/creator/me/verification-status

- **Method:** `GET`
- **Canonical URL:** `/api/v1/creator/me/verification-status`
- **Source File:** [`creator.routes.js:14`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L14)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.2 `POST` /api/v1/creator/me/send-contact-otp

- **Method:** `POST`
- **Canonical URL:** `/api/v1/creator/me/send-contact-otp`
- **Source File:** [`creator.routes.js:15`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L15)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.3 `POST` /api/v1/creator/me/verify-contact

- **Method:** `POST`
- **Canonical URL:** `/api/v1/creator/me/verify-contact`
- **Source File:** [`creator.routes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.4 `POST` /api/v1/creator/me/verify-document

- **Method:** `POST`
- **Canonical URL:** `/api/v1/creator/me/verify-document`
- **Source File:** [`creator.routes.js:17`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L17)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.5 `POST` /api/v1/creator/me/verify-payment

- **Method:** `POST`
- **Canonical URL:** `/api/v1/creator/me/verify-payment`
- **Source File:** [`creator.routes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L18)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.6 `POST` /api/v1/creator/me/verification/pan

- **Method:** `POST`
- **Canonical URL:** `/api/v1/creator/me/verification/pan`
- **Source File:** [`creator.routes.js:21`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L21)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.7 `POST` /api/v1/creator/me/verification/aadhaar/initiate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/creator/me/verification/aadhaar/initiate`
- **Source File:** [`creator.routes.js:22`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L22)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.8 `POST` /api/v1/creator/me/verification/aadhaar/verify-otp

- **Method:** `POST`
- **Canonical URL:** `/api/v1/creator/me/verification/aadhaar/verify-otp`
- **Source File:** [`creator.routes.js:23`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L23)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.9 `POST` /api/v1/creator/me/verification/bank

- **Method:** `POST`
- **Canonical URL:** `/api/v1/creator/me/verification/bank`
- **Source File:** [`creator.routes.js:24`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L24)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.10 `POST` /api/v1/creator/me/verification/upi

- **Method:** `POST`
- **Canonical URL:** `/api/v1/creator/me/verification/upi`
- **Source File:** [`creator.routes.js:25`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L25)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.11 `GET` /api/v1/creator/dashboard

- **Method:** `GET`
- **Canonical URL:** `/api/v1/creator/dashboard`
- **Source File:** [`creator.routes.js:31`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L31)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.12 `GET` /api/v1/creator/portfolio

- **Method:** `GET`
- **Canonical URL:** `/api/v1/creator/portfolio`
- **Source File:** [`creator.routes.js:33`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L33)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.13 `POST` /api/v1/creator/portfolio/reels

- **Method:** `POST`
- **Canonical URL:** `/api/v1/creator/portfolio/reels`
- **Source File:** [`creator.routes.js:34`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L34)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.14 `POST` /api/v1/creator/portfolio/images

- **Method:** `POST`
- **Canonical URL:** `/api/v1/creator/portfolio/images`
- **Source File:** [`creator.routes.js:35`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L35)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.15 `DELETE` /api/v1/creator/portfolio/:type/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/creator/portfolio/:type/:id`
- **Source File:** [`creator.routes.js:36`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L36)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `type` | String (ObjectId) | Yes | Identifier of target resource. |
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 8.16 `GET` /api/v1/creator/pricing

- **Method:** `GET`
- **Canonical URL:** `/api/v1/creator/pricing`
- **Source File:** [`creator.routes.js:38`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L38)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.17 `PATCH` /api/v1/creator/pricing

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/creator/pricing`
- **Source File:** [`creator.routes.js:39`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L39)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.18 `GET` /api/v1/creator/availability

- **Method:** `GET`
- **Canonical URL:** `/api/v1/creator/availability`
- **Source File:** [`creator.routes.js:41`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L41)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.19 `PATCH` /api/v1/creator/availability

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/creator/availability`
- **Source File:** [`creator.routes.js:42`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L42)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.20 `GET` /api/v1/creator/orders

- **Method:** `GET`
- **Canonical URL:** `/api/v1/creator/orders`
- **Source File:** [`creator.routes.js:44`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L44)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 8.21 `PATCH` /api/v1/creator/orders/:id/status

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/creator/orders/:id/status`
- **Source File:** [`creator.routes.js:45`](file:///d:/BizReels%20Website/backend/src/routes/creator.routes.js#L45)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 9. Creator Marketplace & Discovery

> Browse creator directory, search by niche, engagement metrics, and rate cards.

### 9.1 `GET` /api/v1/creator-marketplace/discover

- **Method:** `GET`
- **Canonical URL:** `/api/v1/creator-marketplace/discover`
- **Source File:** [`creatorMarketplaceRoutes.js:13`](file:///d:/BizReels%20Website/backend/src/routes/creatorMarketplaceRoutes.js#L13)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 9.2 `GET` /api/v1/creator-marketplace/cities

- **Method:** `GET`
- **Canonical URL:** `/api/v1/creator-marketplace/cities`
- **Source File:** [`creatorMarketplaceRoutes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/creatorMarketplaceRoutes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 9.3 `GET` /api/v1/creator-marketplace/categories

- **Method:** `GET`
- **Canonical URL:** `/api/v1/creator-marketplace/categories`
- **Source File:** [`creatorMarketplaceRoutes.js:19`](file:///d:/BizReels%20Website/backend/src/routes/creatorMarketplaceRoutes.js#L19)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 9.4 `GET` /api/v1/creator-marketplace/:id/profile

- **Method:** `GET`
- **Canonical URL:** `/api/v1/creator-marketplace/:id/profile`
- **Source File:** [`creatorMarketplaceRoutes.js:22`](file:///d:/BizReels%20Website/backend/src/routes/creatorMarketplaceRoutes.js#L22)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 10. Discovery & Blended Feeds

> Algorithmic home feeds blending trending reels, nearby products, and popular stores.

### 10.1 `GET` /api/v1/feed/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/feed/`
- **Source File:** [`feed.routes.js:8`](file:///d:/BizReels%20Website/backend/src/routes/feed.routes.js#L8)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 10.2 `GET` /api/v1/feed/reels

- **Method:** `GET`
- **Canonical URL:** `/api/v1/feed/reels`
- **Source File:** [`feed.routes.js:37`](file:///d:/BizReels%20Website/backend/src/routes/feed.routes.js#L37)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 10.3 `GET` /api/v1/feed/home-trending

- **Method:** `GET`
- **Canonical URL:** `/api/v1/feed/home-trending`
- **Source File:** [`feed.routes.js:66`](file:///d:/BizReels%20Website/backend/src/routes/feed.routes.js#L66)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 11. Followers & Social Graph

> Vendor and creator followers, following lists, and social notifications.

### 11.1 `POST` /api/v1/follows/:user_id

- **Method:** `POST`
- **Canonical URL:** `/api/v1/follows/:user_id`
- **Source File:** [`follow.routes.js:8`](file:///d:/BizReels%20Website/backend/src/routes/follow.routes.js#L8)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 11.2 `DELETE` /api/v1/follows/:user_id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/follows/:user_id`
- **Source File:** [`follow.routes.js:13`](file:///d:/BizReels%20Website/backend/src/routes/follow.routes.js#L13)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 11.3 `GET` /api/v1/follows/me/following

- **Method:** `GET`
- **Canonical URL:** `/api/v1/follows/me/following`
- **Source File:** [`follow.routes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/follow.routes.js#L18)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 11.4 `GET` /api/v1/follows/me/followers

- **Method:** `GET`
- **Canonical URL:** `/api/v1/follows/me/followers`
- **Source File:** [`follow.routes.js:23`](file:///d:/BizReels%20Website/backend/src/routes/follow.routes.js#L23)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 12. Creator Hiring & Contract Deals

> Milestone-based creator contracts, project deliverables review, and escrow payouts.

### 12.1 `POST` /api/v1/hires/

- **Method:** `POST`
- **Canonical URL:** `/api/v1/hires/`
- **Source File:** [`hireRoutes.js:11`](file:///d:/BizReels%20Website/backend/src/routes/hireRoutes.js#L11)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 12.2 `GET` /api/v1/hires/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/hires/`
- **Source File:** [`hireRoutes.js:12`](file:///d:/BizReels%20Website/backend/src/routes/hireRoutes.js#L12)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 12.3 `PATCH` /api/v1/hires/:id

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/hires/:id`
- **Source File:** [`hireRoutes.js:13`](file:///d:/BizReels%20Website/backend/src/routes/hireRoutes.js#L13)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 12.4 `PATCH` /api/v1/hires/:id/edit

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/hires/:id/edit`
- **Source File:** [`hireRoutes.js:14`](file:///d:/BizReels%20Website/backend/src/routes/hireRoutes.js#L14)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 12.5 `PATCH` /api/v1/hires/:id/cancel

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/hires/:id/cancel`
- **Source File:** [`hireRoutes.js:15`](file:///d:/BizReels%20Website/backend/src/routes/hireRoutes.js#L15)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 12.6 `POST` /api/v1/hires/campaign/:id/deliverable

- **Method:** `POST`
- **Canonical URL:** `/api/v1/hires/campaign/:id/deliverable`
- **Source File:** [`hireRoutes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/hireRoutes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 12.7 `PATCH` /api/v1/hires/campaign/:id/milestone/:milestoneId/approve

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/hires/campaign/:id/milestone/:milestoneId/approve`
- **Source File:** [`hireRoutes.js:17`](file:///d:/BizReels%20Website/backend/src/routes/hireRoutes.js#L17)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
  | `milestoneId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 13. Government KYC & Sandbox Verification

> Instant verification of Indian identity documents: PAN, Aadhaar OTP, GSTIN, and Bank Penny-drop.

### 13.1 `POST` /api/v1/identity/aadhaar/verify

- **Method:** `POST`
- **Canonical URL:** `/api/v1/identity/aadhaar/verify`
- **Source File:** [`identity.routes.js:31`](file:///d:/BizReels%20Website/backend/src/routes/identity.routes.js#L31)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 13.2 `POST` /api/v1/identity/pan/verify

- **Method:** `POST`
- **Canonical URL:** `/api/v1/identity/pan/verify`
- **Source File:** [`identity.routes.js:54`](file:///d:/BizReels%20Website/backend/src/routes/identity.routes.js#L54)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 13.3 `POST` /api/v1/identity/gst/verify

- **Method:** `POST`
- **Canonical URL:** `/api/v1/identity/gst/verify`
- **Source File:** [`identity.routes.js:77`](file:///d:/BizReels%20Website/backend/src/routes/identity.routes.js#L77)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 13.4 `POST` /api/v1/identity/bank/verify

- **Method:** `POST`
- **Canonical URL:** `/api/v1/identity/bank/verify`
- **Source File:** [`identity.routes.js:100`](file:///d:/BizReels%20Website/backend/src/routes/identity.routes.js#L100)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 13.5 `GET` /api/v1/identity/trust-plus/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/identity/trust-plus/me`
- **Source File:** [`identity.routes.js:135`](file:///d:/BizReels%20Website/backend/src/routes/identity.routes.js#L135)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 13.6 `GET` /api/v1/identity/me/status

- **Method:** `GET`
- **Canonical URL:** `/api/v1/identity/me/status`
- **Source File:** [`identity.routes.js:140`](file:///d:/BizReels%20Website/backend/src/routes/identity.routes.js#L140)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 13.7 `GET` /api/v1/identity/me/docs

- **Method:** `GET`
- **Canonical URL:** `/api/v1/identity/me/docs`
- **Source File:** [`identity.routes.js:145`](file:///d:/BizReels%20Website/backend/src/routes/identity.routes.js#L145)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 13.8 `DELETE` /api/v1/identity/docs/:doc_id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/identity/docs/:doc_id`
- **Source File:** [`identity.routes.js:150`](file:///d:/BizReels%20Website/backend/src/routes/identity.routes.js#L150)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `doc_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 14. Root API Utilities & Public Web Endpoints

> System health checks, Render keep-alive pings, contact forms, and newsletter subscriptions.

### 14.1 `GET` /api/v1/health

- **Method:** `GET`
- **Canonical URL:** `/api/v1/health`
- **Source File:** [`index.js:28`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L28)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.2 `GET` /api/v1/keep-alive

- **Method:** `GET`
- **Canonical URL:** `/api/v1/keep-alive`
- **Source File:** [`index.js:38`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L38)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.3 `GET` /api/v1/keepalive

- **Method:** `GET`
- **Canonical URL:** `/api/v1/keepalive`
- **Source File:** [`index.js:38`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L38)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.4 `GET` /api/v1/users/me/referrals

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/me/referrals`
- **Source File:** [`index.js:82`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L82)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.5 `GET` /api/v1/users/me/referrals/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/me/referrals/`
- **Source File:** [`index.js:82`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L82)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.6 `GET` /api/v1/subscription

- **Method:** `GET`
- **Canonical URL:** `/api/v1/subscription`
- **Source File:** [`index.js:87`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L87)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.7 `GET` /api/v1/subscription/plans

- **Method:** `GET`
- **Canonical URL:** `/api/v1/subscription/plans`
- **Source File:** [`index.js:90`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L90)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.8 `POST` /api/v1/subscription/change

- **Method:** `POST`
- **Canonical URL:** `/api/v1/subscription/change`
- **Source File:** [`index.js:93`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L93)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.9 `POST` /api/v1/subscription/purchase-razorpay

- **Method:** `POST`
- **Canonical URL:** `/api/v1/subscription/purchase-razorpay`
- **Source File:** [`index.js:98`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L98)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.10 `GET` /api/v1/vendor/dashboard

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendor/dashboard`
- **Source File:** [`index.js:204`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L204)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.11 `GET` /api/v1/vendor/analytics/overview

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendor/analytics/overview`
- **Source File:** [`index.js:207`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L207)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.12 `GET` /api/v1/vendor/analytics/listings

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendor/analytics/listings`
- **Source File:** [`index.js:210`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L210)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.13 `GET` /api/v1/vendor/analytics/timeseries

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendor/analytics/timeseries`
- **Source File:** [`index.js:213`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L213)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.14 `GET` /api/v1/vendor/analytics/boost-roi

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendor/analytics/boost-roi`
- **Source File:** [`index.js:216`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L216)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.15 `POST` /api/v1/vendor/analytics/simulate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendor/analytics/simulate`
- **Source File:** [`index.js:219`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L219)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.16 `GET` /api/v1/vendor/analytics

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendor/analytics`
- **Source File:** [`index.js:222`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L222)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.17 `GET` /api/v1/reels/:id

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reels/:id`
- **Source File:** [`index.js:244`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L244)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 14.18 `GET` /api/v1/reels/share/:id

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reels/share/:id`
- **Source File:** [`index.js:244`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L244)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 14.19 `GET` /api/v1/cms/:slug

- **Method:** `GET`
- **Canonical URL:** `/api/v1/cms/:slug`
- **Source File:** [`index.js:387`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L387)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `slug` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 14.20 `POST` /api/v1/contact

- **Method:** `POST`
- **Canonical URL:** `/api/v1/contact`
- **Source File:** [`index.js:401`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L401)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 14.21 `POST` /api/v1/newsletter/subscribe

- **Method:** `POST`
- **Canonical URL:** `/api/v1/newsletter/subscribe`
- **Source File:** [`index.js:452`](file:///d:/BizReels%20Website/backend/src/routes/index.js#L452)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 15. Inquiries, Leads & Contact RFQs

> Direct lead capture from listing pages, vendor notifications, and lead resolution.

### 15.1 `POST` /api/v1/inquiries/

- **Method:** `POST`
- **Canonical URL:** `/api/v1/inquiries/`
- **Source File:** [`inquiryRoutes.js:7`](file:///d:/BizReels%20Website/backend/src/routes/inquiryRoutes.js#L7)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 15.2 `GET` /api/v1/inquiries/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/inquiries/`
- **Source File:** [`inquiryRoutes.js:8`](file:///d:/BizReels%20Website/backend/src/routes/inquiryRoutes.js#L8)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 15.3 `POST` /api/v1/inquiries/:id/reply

- **Method:** `POST`
- **Canonical URL:** `/api/v1/inquiries/:id/reply`
- **Source File:** [`inquiryRoutes.js:9`](file:///d:/BizReels%20Website/backend/src/routes/inquiryRoutes.js#L9)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 15.4 `PATCH` /api/v1/inquiries/:id/reply

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/inquiries/:id/reply`
- **Source File:** [`inquiryRoutes.js:10`](file:///d:/BizReels%20Website/backend/src/routes/inquiryRoutes.js#L10)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 15.5 `PATCH` /api/v1/inquiries/:id/close

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/inquiries/:id/close`
- **Source File:** [`inquiryRoutes.js:11`](file:///d:/BizReels%20Website/backend/src/routes/inquiryRoutes.js#L11)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 15.6 `DELETE` /api/v1/inquiries/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/inquiries/:id`
- **Source File:** [`inquiryRoutes.js:12`](file:///d:/BizReels%20Website/backend/src/routes/inquiryRoutes.js#L12)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 16. Social Interactions (Likes, Comments, Shares)

> Engagement metrics, reel like toggles, comment threading, and share previews.

### 16.1 `POST` /api/v1/listings/:listing_id/like

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/:listing_id/like`
- **Source File:** [`interaction.routes.js:8`](file:///d:/BizReels%20Website/backend/src/routes/interaction.routes.js#L8)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `listing_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 16.2 `POST` /api/v1/listings/:listing_id/save

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/:listing_id/save`
- **Source File:** [`interaction.routes.js:13`](file:///d:/BizReels%20Website/backend/src/routes/interaction.routes.js#L13)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `listing_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 16.3 `GET` /api/v1/interactions/me/saved

- **Method:** `GET`
- **Canonical URL:** `/api/v1/interactions/me/saved`
- **Source File:** [`interaction.routes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/interaction.routes.js#L18)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 16.4 `GET` /api/v1/interactions/me/liked

- **Method:** `GET`
- **Canonical URL:** `/api/v1/interactions/me/liked`
- **Source File:** [`interaction.routes.js:23`](file:///d:/BizReels%20Website/backend/src/routes/interaction.routes.js#L23)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 17. KYC Document Submissions

> Document upload, manual document audits, and verification state polling.

### 17.1 `POST` /api/v1/kyc/me/submit

- **Method:** `POST`
- **Canonical URL:** `/api/v1/kyc/me/submit`
- **Source File:** [`kyc.routes.js:19`](file:///d:/BizReels%20Website/backend/src/routes/kyc.routes.js#L19)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 17.2 `GET` /api/v1/kyc/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/kyc/me`
- **Source File:** [`kyc.routes.js:40`](file:///d:/BizReels%20Website/backend/src/routes/kyc.routes.js#L40)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 17.3 `GET` /api/v1/admin/kyc

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/kyc`
- **Source File:** [`kyc.routes.js:46`](file:///d:/BizReels%20Website/backend/src/routes/kyc.routes.js#L46)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 17.4 `POST` /api/v1/admin/kyc/:kid/approve

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/kyc/:kid/approve`
- **Source File:** [`kyc.routes.js:51`](file:///d:/BizReels%20Website/backend/src/routes/kyc.routes.js#L51)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `kid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 17.5 `POST` /api/v1/admin/kyc/:kid/reject

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/kyc/:kid/reject`
- **Source File:** [`kyc.routes.js:56`](file:///d:/BizReels%20Website/backend/src/routes/kyc.routes.js#L56)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `kid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 17.6 `GET` /api/v1/users/:user_id/trust-score

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/:user_id/trust-score`
- **Source File:** [`kyc.routes.js:63`](file:///d:/BizReels%20Website/backend/src/routes/kyc.routes.js#L63)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 18. Catalog Listings & Inventory

> Physical products, services, digital assets, catalog CRUD, search, and vendor inventory.

### 18.1 `GET` /api/v1/listings/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/listings/`
- **Source File:** [`listingRoutes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L16)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 18.2 `GET` /api/v1/listings/limits/media

- **Method:** `GET`
- **Canonical URL:** `/api/v1/listings/limits/media`
- **Source File:** [`listingRoutes.js:19`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L19)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 18.3 `POST` /api/v1/listings/ai-copy

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/ai-copy`
- **Source File:** [`listingRoutes.js:35`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L35)
- **Authentication:** Optional
- **Required Roles:** vendor, creator, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 18.4 `POST` /api/v1/listings/bulk

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/bulk`
- **Source File:** [`listingRoutes.js:44`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L44)
- **Authentication:** Optional
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 18.5 `GET` /api/v1/listings/:id

- **Method:** `GET`
- **Canonical URL:** `/api/v1/listings/:id`
- **Source File:** [`listingRoutes.js:54`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L54)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.6 `POST` /api/v1/listings/:id/like

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/:id/like`
- **Source File:** [`listingRoutes.js:55`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L55)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.7 `POST` /api/v1/listings/:id/share

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/:id/share`
- **Source File:** [`listingRoutes.js:56`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L56)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.8 `POST` /api/v1/listings/:id/save

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/:id/save`
- **Source File:** [`listingRoutes.js:57`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L57)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.9 `POST` /api/v1/listings/:id/unsave

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/:id/unsave`
- **Source File:** [`listingRoutes.js:58`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L58)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.10 `POST` /api/v1/listings/:id/save-image

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/:id/save-image`
- **Source File:** [`listingRoutes.js:59`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L59)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.11 `POST` /api/v1/listings/:id/unsave-image

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/:id/unsave-image`
- **Source File:** [`listingRoutes.js:60`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L60)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.12 `POST` /api/v1/listings/:id/duplicate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/:id/duplicate`
- **Source File:** [`listingRoutes.js:63`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L63)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.13 `GET` /api/v1/listings/:id/analytics

- **Method:** `GET`
- **Canonical URL:** `/api/v1/listings/:id/analytics`
- **Source File:** [`listingRoutes.js:73`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L73)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.14 `PATCH` /api/v1/listings/:id/stock

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/listings/:id/stock`
- **Source File:** [`listingRoutes.js:83`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L83)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.15 `POST` /api/v1/listings/

- **Method:** `POST`
- **Canonical URL:** `/api/v1/listings/`
- **Source File:** [`listingRoutes.js:93`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L93)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 18.16 `PUT` /api/v1/listings/:id

- **Method:** `PUT`
- **Canonical URL:** `/api/v1/listings/:id`
- **Source File:** [`listingRoutes.js:103`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L103)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.17 `PATCH` /api/v1/listings/:id

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/listings/:id`
- **Source File:** [`listingRoutes.js:112`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L112)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 18.18 `DELETE` /api/v1/listings/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/listings/:id`
- **Source File:** [`listingRoutes.js:121`](file:///d:/BizReels%20Website/backend/src/routes/listingRoutes.js#L121)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 19. Live Streaming & Real-Time Shopping

> Live video broadcasting, WebRTC room handshake, live chat, and featured product pinning.

### 19.1 `GET` /api/v1/live/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/live/`
- **Source File:** [`liveRoutes.js:11`](file:///d:/BizReels%20Website/backend/src/routes/liveRoutes.js#L11)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, creator, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 19.2 `POST` /api/v1/live/

- **Method:** `POST`
- **Canonical URL:** `/api/v1/live/`
- **Source File:** [`liveRoutes.js:12`](file:///d:/BizReels%20Website/backend/src/routes/liveRoutes.js#L12)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, creator, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 19.3 `POST` /api/v1/live/:id/end

- **Method:** `POST`
- **Canonical URL:** `/api/v1/live/:id/end`
- **Source File:** [`liveRoutes.js:13`](file:///d:/BizReels%20Website/backend/src/routes/liveRoutes.js#L13)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 19.4 `POST` /api/v1/live/:id/join

- **Method:** `POST`
- **Canonical URL:** `/api/v1/live/:id/join`
- **Source File:** [`liveRoutes.js:14`](file:///d:/BizReels%20Website/backend/src/routes/liveRoutes.js#L14)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 19.5 `POST` /api/v1/live/:id/leave

- **Method:** `POST`
- **Canonical URL:** `/api/v1/live/:id/leave`
- **Source File:** [`liveRoutes.js:15`](file:///d:/BizReels%20Website/backend/src/routes/liveRoutes.js#L15)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 19.6 `POST` /api/v1/live/:id/like

- **Method:** `POST`
- **Canonical URL:** `/api/v1/live/:id/like`
- **Source File:** [`liveRoutes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/liveRoutes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 19.7 `POST` /api/v1/live/:id/comment

- **Method:** `POST`
- **Canonical URL:** `/api/v1/live/:id/comment`
- **Source File:** [`liveRoutes.js:17`](file:///d:/BizReels%20Website/backend/src/routes/liveRoutes.js#L17)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 20. Location Services & Geo-Proximity

> Reverse geocoding, proximity search, city/state lists, and delivery range checks.

### 20.1 `POST` /api/v1/location/reverse-geocode

- **Method:** `POST`
- **Canonical URL:** `/api/v1/location/reverse-geocode`
- **Source File:** [`location.routes.js:8`](file:///d:/BizReels%20Website/backend/src/routes/location.routes.js#L8)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 20.2 `POST` /api/v1/location/pincode-lookup

- **Method:** `POST`
- **Canonical URL:** `/api/v1/location/pincode-lookup`
- **Source File:** [`location.routes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/location.routes.js#L18)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 20.3 `GET` /api/v1/location/states

- **Method:** `GET`
- **Canonical URL:** `/api/v1/location/states`
- **Source File:** [`location.routes.js:28`](file:///d:/BizReels%20Website/backend/src/routes/location.routes.js#L28)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 20.4 `GET` /api/v1/location/districts

- **Method:** `GET`
- **Canonical URL:** `/api/v1/location/districts`
- **Source File:** [`location.routes.js:33`](file:///d:/BizReels%20Website/backend/src/routes/location.routes.js#L33)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 21. Media & Cloudinary Asset Processing

> Cloudinary signature generation, video transcoding webhooks, and image optimization.

### 21.1 `POST` /api/v1/media/sign

- **Method:** `POST`
- **Canonical URL:** `/api/v1/media/sign`
- **Source File:** [`media.routes.js:11`](file:///d:/BizReels%20Website/backend/src/routes/media.routes.js#L11)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 21.2 `POST` /api/v1/media/upload

- **Method:** `POST`
- **Canonical URL:** `/api/v1/media/upload`
- **Source File:** [`media.routes.js:21`](file:///d:/BizReels%20Website/backend/src/routes/media.routes.js#L21)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: multipart/form-data`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 22. Push & In-App Notifications

> Notification inbox, unread counts, mark-as-read, and push token registration.

### 22.1 `GET` /api/v1/notifications/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/notifications/`
- **Source File:** [`notificationRoutes.js:11`](file:///d:/BizReels%20Website/backend/src/routes/notificationRoutes.js#L11)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 22.2 `GET` /api/v1/notifications/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/notifications/me`
- **Source File:** [`notificationRoutes.js:12`](file:///d:/BizReels%20Website/backend/src/routes/notificationRoutes.js#L12)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 22.3 `GET` /api/v1/notifications/unread-count

- **Method:** `GET`
- **Canonical URL:** `/api/v1/notifications/unread-count`
- **Source File:** [`notificationRoutes.js:13`](file:///d:/BizReels%20Website/backend/src/routes/notificationRoutes.js#L13)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 22.4 `GET` /api/v1/notifications/me/unread-count

- **Method:** `GET`
- **Canonical URL:** `/api/v1/notifications/me/unread-count`
- **Source File:** [`notificationRoutes.js:14`](file:///d:/BizReels%20Website/backend/src/routes/notificationRoutes.js#L14)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 22.5 `PATCH` /api/v1/notifications/read-all

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/notifications/read-all`
- **Source File:** [`notificationRoutes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/notificationRoutes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 22.6 `POST` /api/v1/notifications/read-all

- **Method:** `POST`
- **Canonical URL:** `/api/v1/notifications/read-all`
- **Source File:** [`notificationRoutes.js:17`](file:///d:/BizReels%20Website/backend/src/routes/notificationRoutes.js#L17)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 22.7 `POST` /api/v1/notifications/me/read-all

- **Method:** `POST`
- **Canonical URL:** `/api/v1/notifications/me/read-all`
- **Source File:** [`notificationRoutes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/notificationRoutes.js#L18)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 22.8 `PATCH` /api/v1/notifications/:id/read

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/notifications/:id/read`
- **Source File:** [`notificationRoutes.js:20`](file:///d:/BizReels%20Website/backend/src/routes/notificationRoutes.js#L20)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 22.9 `POST` /api/v1/notifications/:id/read

- **Method:** `POST`
- **Canonical URL:** `/api/v1/notifications/:id/read`
- **Source File:** [`notificationRoutes.js:21`](file:///d:/BizReels%20Website/backend/src/routes/notificationRoutes.js#L21)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 22.10 `DELETE` /api/v1/notifications/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/notifications/:id`
- **Source File:** [`notificationRoutes.js:23`](file:///d:/BizReels%20Website/backend/src/routes/notificationRoutes.js#L23)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 23. Offers & Platform Discounts

> Platform-wide seasonal discounts, promo codes, and discount applications.

### 23.1 `GET` /api/v1/offers/active

- **Method:** `GET`
- **Canonical URL:** `/api/v1/offers/active`
- **Source File:** [`offer.routes.js:35`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L35)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 23.2 `POST` /api/v1/offers/:id/click

- **Method:** `POST`
- **Canonical URL:** `/api/v1/offers/:id/click`
- **Source File:** [`offer.routes.js:49`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L49)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 23.3 `POST` /api/v1/offers/validate-coupon

- **Method:** `POST`
- **Canonical URL:** `/api/v1/offers/validate-coupon`
- **Source File:** [`offer.routes.js:62`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L62)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 23.4 `GET` /api/v1/offers/applicable

- **Method:** `GET`
- **Canonical URL:** `/api/v1/offers/applicable`
- **Source File:** [`offer.routes.js:82`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L82)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 23.5 `POST` /api/v1/offers/calculate-shipping

- **Method:** `POST`
- **Canonical URL:** `/api/v1/offers/calculate-shipping`
- **Source File:** [`offer.routes.js:96`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L96)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 23.6 `GET` /api/v1/offers/admin/stats

- **Method:** `GET`
- **Canonical URL:** `/api/v1/offers/admin/stats`
- **Source File:** [`offer.routes.js:111`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L111)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 23.7 `GET` /api/v1/offers/admin

- **Method:** `GET`
- **Canonical URL:** `/api/v1/offers/admin`
- **Source File:** [`offer.routes.js:125`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L125)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 23.8 `POST` /api/v1/offers/admin

- **Method:** `POST`
- **Canonical URL:** `/api/v1/offers/admin`
- **Source File:** [`offer.routes.js:139`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L139)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 23.9 `POST` /api/v1/offers/admin/bulk-status

- **Method:** `POST`
- **Canonical URL:** `/api/v1/offers/admin/bulk-status`
- **Source File:** [`offer.routes.js:153`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L153)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 23.10 `POST` /api/v1/offers/admin/bulk-delete

- **Method:** `POST`
- **Canonical URL:** `/api/v1/offers/admin/bulk-delete`
- **Source File:** [`offer.routes.js:168`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L168)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 23.11 `PUT` /api/v1/offers/admin/:id

- **Method:** `PUT`
- **Canonical URL:** `/api/v1/offers/admin/:id`
- **Source File:** [`offer.routes.js:183`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L183)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 23.12 `DELETE` /api/v1/offers/admin/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/offers/admin/:id`
- **Source File:** [`offer.routes.js:197`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L197)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 23.13 `POST` /api/v1/offers/admin/:id/activate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/offers/admin/:id/activate`
- **Source File:** [`offer.routes.js:211`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L211)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 23.14 `POST` /api/v1/offers/admin/:id/deactivate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/offers/admin/:id/deactivate`
- **Source File:** [`offer.routes.js:225`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L225)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 23.15 `POST` /api/v1/offers/admin/:id/duplicate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/offers/admin/:id/duplicate`
- **Source File:** [`offer.routes.js:239`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L239)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 23.16 `GET` /api/v1/offers/admin/:id/analytics

- **Method:** `GET`
- **Canonical URL:** `/api/v1/offers/admin/:id/analytics`
- **Source File:** [`offer.routes.js:253`](file:///d:/BizReels%20Website/backend/src/routes/offer.routes.js#L253)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 24. User & Vendor Onboarding Flow

> Step-by-step onboarding wizards, state tracking, and profile completion checkpoints.

### 24.1 `GET` /api/v1/onboarding/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/onboarding/`
- **Source File:** [`onboarding.routes.js:8`](file:///d:/BizReels%20Website/backend/src/routes/onboarding.routes.js#L8)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 25. Orders, Fulfillment & Shiprocket

> Order creation, payment escrow holds, vendor order fulfillment, tracking numbers, and returns.

### 25.1 `POST` /api/v1/orders/shiprocket/webhook

- **Method:** `POST`
- **Canonical URL:** `/api/v1/orders/shiprocket/webhook`
- **Source File:** [`orderRoutes.js:8`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L8)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 25.2 `POST` /api/v1/orders/shipping/webhook

- **Method:** `POST`
- **Canonical URL:** `/api/v1/orders/shipping/webhook`
- **Source File:** [`orderRoutes.js:9`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L9)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 25.3 `POST` /api/v1/orders/razorpay/create-order

- **Method:** `POST`
- **Canonical URL:** `/api/v1/orders/razorpay/create-order`
- **Source File:** [`orderRoutes.js:11`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L11)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 25.4 `POST` /api/v1/orders/

- **Method:** `POST`
- **Canonical URL:** `/api/v1/orders/`
- **Source File:** [`orderRoutes.js:12`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L12)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 25.5 `GET` /api/v1/orders/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/orders/`
- **Source File:** [`orderRoutes.js:13`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L13)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 25.6 `GET` /api/v1/orders/vendor/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/orders/vendor/me`
- **Source File:** [`orderRoutes.js:14`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L14)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 25.7 `GET` /api/v1/orders/:id

- **Method:** `GET`
- **Canonical URL:** `/api/v1/orders/:id`
- **Source File:** [`orderRoutes.js:15`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L15)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 25.8 `GET` /api/v1/orders/:id/track

- **Method:** `GET`
- **Canonical URL:** `/api/v1/orders/:id/track`
- **Source File:** [`orderRoutes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 25.9 `POST` /api/v1/orders/:id/shiprocket/sync

- **Method:** `POST`
- **Canonical URL:** `/api/v1/orders/:id/shiprocket/sync`
- **Source File:** [`orderRoutes.js:17`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L17)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 25.10 `PATCH` /api/v1/orders/:id/status

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/orders/:id/status`
- **Source File:** [`orderRoutes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L18)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 25.11 `PUT` /api/v1/orders/:id/status

- **Method:** `PUT`
- **Canonical URL:** `/api/v1/orders/:id/status`
- **Source File:** [`orderRoutes.js:19`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L19)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 25.12 `PATCH` /api/v1/orders/:id/cancel

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/orders/:id/cancel`
- **Source File:** [`orderRoutes.js:20`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L20)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 25.13 `PATCH` /api/v1/orders/:id

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/orders/:id`
- **Source File:** [`orderRoutes.js:21`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L21)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 25.14 `PUT` /api/v1/orders/:id

- **Method:** `PUT`
- **Canonical URL:** `/api/v1/orders/:id`
- **Source File:** [`orderRoutes.js:22`](file:///d:/BizReels%20Website/backend/src/routes/orderRoutes.js#L22)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 26. Phase 4 Modular Financials & Escrow

> 

### 26.1 `POST` /api/v1/reviews

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reviews`
- **Source File:** [`phase4.routes.js:31`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L31)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.2 `GET` /api/v1/reviews

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reviews`
- **Source File:** [`phase4.routes.js:36`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L36)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.3 `PATCH` /api/v1/reviews/:rid

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/reviews/:rid`
- **Source File:** [`phase4.routes.js:47`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L47)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `rid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 26.4 `DELETE` /api/v1/reviews/:rid

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/reviews/:rid`
- **Source File:** [`phase4.routes.js:52`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L52)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `rid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 26.5 `POST` /api/v1/reviews/:rid/reply

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reviews/:rid/reply`
- **Source File:** [`phase4.routes.js:58`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L58)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `rid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 26.6 `POST` /api/v1/reviews/:rid/helpful

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reviews/:rid/helpful`
- **Source File:** [`phase4.routes.js:67`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L67)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `rid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 26.7 `GET` /api/v1/reviews/vendor/:vendor_id/summary

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reviews/vendor/:vendor_id/summary`
- **Source File:** [`phase4.routes.js:72`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L72)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `vendor_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 26.8 `GET` /api/v1/notifications/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/notifications/me`
- **Source File:** [`phase4.routes.js:78`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L78)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.9 `GET` /api/v1/notifications/me/unread-count

- **Method:** `GET`
- **Canonical URL:** `/api/v1/notifications/me/unread-count`
- **Source File:** [`phase4.routes.js:87`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L87)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.10 `POST` /api/v1/notifications/:nid/read

- **Method:** `POST`
- **Canonical URL:** `/api/v1/notifications/:nid/read`
- **Source File:** [`phase4.routes.js:93`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L93)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `nid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 26.11 `POST` /api/v1/notifications/me/read-all

- **Method:** `POST`
- **Canonical URL:** `/api/v1/notifications/me/read-all`
- **Source File:** [`phase4.routes.js:98`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L98)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.12 `DELETE` /api/v1/notifications/:nid

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/notifications/:nid`
- **Source File:** [`phase4.routes.js:103`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L103)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `nid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 26.13 `GET` /api/v1/wallet/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/wallet/me`
- **Source File:** [`phase4.routes.js:109`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L109)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.14 `GET` /api/v1/wallet/me/transactions

- **Method:** `GET`
- **Canonical URL:** `/api/v1/wallet/me/transactions`
- **Source File:** [`phase4.routes.js:115`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L115)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.15 `POST` /api/v1/wallet/me/topup

- **Method:** `POST`
- **Canonical URL:** `/api/v1/wallet/me/topup`
- **Source File:** [`phase4.routes.js:122`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L122)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.16 `POST` /api/v1/payments/order

- **Method:** `POST`
- **Canonical URL:** `/api/v1/payments/order`
- **Source File:** [`phase4.routes.js:133`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L133)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.17 `POST` /api/v1/payments/verify

- **Method:** `POST`
- **Canonical URL:** `/api/v1/payments/verify`
- **Source File:** [`phase4.routes.js:153`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L153)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.18 `POST` /api/v1/payments/dev/simulate-success

- **Method:** `POST`
- **Canonical URL:** `/api/v1/payments/dev/simulate-success`
- **Source File:** [`phase4.routes.js:168`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L168)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.19 `GET` /api/v1/payments/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/payments/me`
- **Source File:** [`phase4.routes.js:178`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L178)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.20 `POST` /api/v1/payments/webhook

- **Method:** `POST`
- **Canonical URL:** `/api/v1/payments/webhook`
- **Source File:** [`phase4.routes.js:183`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L183)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.21 `POST` /api/v1/subscriptions/subscribe

- **Method:** `POST`
- **Canonical URL:** `/api/v1/subscriptions/subscribe`
- **Source File:** [`phase4.routes.js:212`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L212)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.22 `GET` /api/v1/subscriptions/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/subscriptions/me`
- **Source File:** [`phase4.routes.js:222`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L222)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.23 `POST` /api/v1/subscriptions/:sid/cancel

- **Method:** `POST`
- **Canonical URL:** `/api/v1/subscriptions/:sid/cancel`
- **Source File:** [`phase4.routes.js:229`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L229)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `sid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 26.24 `POST` /api/v1/kyc/me/submit

- **Method:** `POST`
- **Canonical URL:** `/api/v1/kyc/me/submit`
- **Source File:** [`phase4.routes.js:235`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L235)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.25 `GET` /api/v1/kyc/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/kyc/me`
- **Source File:** [`phase4.routes.js:256`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L256)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.26 `GET` /api/v1/admin/kyc

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/kyc`
- **Source File:** [`phase4.routes.js:262`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L262)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 26.27 `POST` /api/v1/admin/kyc/:kid/approve

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/kyc/:kid/approve`
- **Source File:** [`phase4.routes.js:267`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L267)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `kid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 26.28 `POST` /api/v1/admin/kyc/:kid/reject

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/kyc/:kid/reject`
- **Source File:** [`phase4.routes.js:272`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L272)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `kid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 26.29 `GET` /api/v1/users/:user_id/trust-score

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/:user_id/trust-score`
- **Source File:** [`phase4.routes.js:279`](file:///d:/BizReels%20Website/backend/src/routes/phase4.routes.js#L279)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 27. Video Reels & Social Feeds

> Short-form video management, feed generation, view count tracking, boost promotions, and reel shares.

### 27.1 `GET` /api/v1/reels/saved

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reels/saved`
- **Source File:** [`reelRoutes.js:28`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L28)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 27.2 `GET` /api/v1/reels/my-reels

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reels/my-reels`
- **Source File:** [`reelRoutes.js:29`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L29)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 27.3 `GET` /api/v1/reels/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reels/`
- **Source File:** [`reelRoutes.js:30`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L30)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 27.4 `GET` /api/v1/reels/public/:id

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reels/public/:id`
- **Source File:** [`reelRoutes.js:44`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L44)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 27.5 `GET` /api/v1/reels/:id/comments

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reels/:id/comments`
- **Source File:** [`reelRoutes.js:45`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L45)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 27.6 `GET` /api/v1/reels/:id/product-details

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reels/:id/product-details`
- **Source File:** [`reelRoutes.js:46`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L46)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 27.7 `GET` /api/v1/reels/:id

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reels/:id`
- **Source File:** [`reelRoutes.js:47`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L47)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 27.8 `POST` /api/v1/reels/

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reels/`
- **Source File:** [`reelRoutes.js:50`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L50)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 27.9 `DELETE` /api/v1/reels/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/reels/:id`
- **Source File:** [`reelRoutes.js:60`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L60)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 27.10 `POST` /api/v1/reels/:id/view

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reels/:id/view`
- **Source File:** [`reelRoutes.js:61`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L61)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 27.11 `POST` /api/v1/reels/:id/like

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reels/:id/like`
- **Source File:** [`reelRoutes.js:62`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L62)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 27.12 `POST` /api/v1/reels/:id/comments

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reels/:id/comments`
- **Source File:** [`reelRoutes.js:64`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L64)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 27.13 `DELETE` /api/v1/reels/comments/:commentId

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/reels/comments/:commentId`
- **Source File:** [`reelRoutes.js:65`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L65)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `commentId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 27.14 `POST` /api/v1/reels/:id/save

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reels/:id/save`
- **Source File:** [`reelRoutes.js:67`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L67)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 27.15 `POST` /api/v1/reels/:id/unsave

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reels/:id/unsave`
- **Source File:** [`reelRoutes.js:68`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L68)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 27.16 `POST` /api/v1/reels/:id/boost

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reels/:id/boost`
- **Source File:** [`reelRoutes.js:69`](file:///d:/BizReels%20Website/backend/src/routes/reelRoutes.js#L69)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 28. Referrals & Gamified Rewards

> Referral code generation, reward credits, referral tracking, and invite leaderboards.

### 28.1 `GET` /api/v1/referrals/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/referrals/me`
- **Source File:** [`referral.routes.js:12`](file:///d:/BizReels%20Website/backend/src/routes/referral.routes.js#L12)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 28.2 `GET` /api/v1/referrals/dashboard

- **Method:** `GET`
- **Canonical URL:** `/api/v1/referrals/dashboard`
- **Source File:** [`referral.routes.js:13`](file:///d:/BizReels%20Website/backend/src/routes/referral.routes.js#L13)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 28.3 `GET` /api/v1/referrals/link

- **Method:** `GET`
- **Canonical URL:** `/api/v1/referrals/link`
- **Source File:** [`referral.routes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/referral.routes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 28.4 `GET` /api/v1/referrals/list

- **Method:** `GET`
- **Canonical URL:** `/api/v1/referrals/list`
- **Source File:** [`referral.routes.js:19`](file:///d:/BizReels%20Website/backend/src/routes/referral.routes.js#L19)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 28.5 `GET` /api/v1/referrals/code

- **Method:** `GET`
- **Canonical URL:** `/api/v1/referrals/code`
- **Source File:** [`referral.routes.js:22`](file:///d:/BizReels%20Website/backend/src/routes/referral.routes.js#L22)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 28.6 `GET` /api/v1/referrals/admin/analytics

- **Method:** `GET`
- **Canonical URL:** `/api/v1/referrals/admin/analytics`
- **Source File:** [`referral.routes.js:25`](file:///d:/BizReels%20Website/backend/src/routes/referral.routes.js#L25)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 28.7 `GET` /api/v1/referrals/admin/list

- **Method:** `GET`
- **Canonical URL:** `/api/v1/referrals/admin/list`
- **Source File:** [`referral.routes.js:26`](file:///d:/BizReels%20Website/backend/src/routes/referral.routes.js#L26)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 28.8 `POST` /api/v1/referrals/admin/status

- **Method:** `POST`
- **Canonical URL:** `/api/v1/referrals/admin/status`
- **Source File:** [`referral.routes.js:27`](file:///d:/BizReels%20Website/backend/src/routes/referral.routes.js#L27)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 28.9 `GET` /api/v1/referrals/admin/config

- **Method:** `GET`
- **Canonical URL:** `/api/v1/referrals/admin/config`
- **Source File:** [`referral.routes.js:28`](file:///d:/BizReels%20Website/backend/src/routes/referral.routes.js#L28)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 28.10 `POST` /api/v1/referrals/admin/config

- **Method:** `POST`
- **Canonical URL:** `/api/v1/referrals/admin/config`
- **Source File:** [`referral.routes.js:29`](file:///d:/BizReels%20Website/backend/src/routes/referral.routes.js#L29)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 28.11 `GET` /api/v1/referrals/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/referrals/`
- **Source File:** [`referral.routes.js:32`](file:///d:/BizReels%20Website/backend/src/routes/referral.routes.js#L32)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 29. Content Reporting & Violation Flagging

> Community safety reporting for inappropriate listings, spam reels, or fraudulent vendors.

### 29.1 `POST` /api/v1/reports

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reports`
- **Source File:** [`report.routes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/report.routes.js#L18)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 29.2 `GET` /api/v1/admin/reports

- **Method:** `GET`
- **Canonical URL:** `/api/v1/admin/reports`
- **Source File:** [`report.routes.js:47`](file:///d:/BizReels%20Website/backend/src/routes/report.routes.js#L47)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 29.3 `POST` /api/v1/admin/reports/:rid/resolve

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/reports/:rid/resolve`
- **Source File:** [`report.routes.js:55`](file:///d:/BizReels%20Website/backend/src/routes/report.routes.js#L55)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `rid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 29.4 `POST` /api/v1/admin/reports/:rid/dismiss

- **Method:** `POST`
- **Canonical URL:** `/api/v1/admin/reports/:rid/dismiss`
- **Source File:** [`report.routes.js:65`](file:///d:/BizReels%20Website/backend/src/routes/report.routes.js#L65)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `rid` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 30. Requirements, RFQs & Bidding

> Customer project briefs, vendor quote bids, counter-offers, and deal escrow locking.

### 30.1 `GET` /api/v1/requirements/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/requirements/`
- **Source File:** [`requirementRoutes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/requirementRoutes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 30.2 `GET` /api/v1/requirements/quotes

- **Method:** `GET`
- **Canonical URL:** `/api/v1/requirements/quotes`
- **Source File:** [`requirementRoutes.js:25`](file:///d:/BizReels%20Website/backend/src/routes/requirementRoutes.js#L25)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 30.3 `POST` /api/v1/requirements/

- **Method:** `POST`
- **Canonical URL:** `/api/v1/requirements/`
- **Source File:** [`requirementRoutes.js:127`](file:///d:/BizReels%20Website/backend/src/routes/requirementRoutes.js#L127)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** customer, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 30.4 `POST` /api/v1/requirements/quotes

- **Method:** `POST`
- **Canonical URL:** `/api/v1/requirements/quotes`
- **Source File:** [`requirementRoutes.js:137`](file:///d:/BizReels%20Website/backend/src/routes/requirementRoutes.js#L137)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** vendor, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 30.5 `GET` /api/v1/requirements/:id

- **Method:** `GET`
- **Canonical URL:** `/api/v1/requirements/:id`
- **Source File:** [`requirementRoutes.js:147`](file:///d:/BizReels%20Website/backend/src/routes/requirementRoutes.js#L147)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** customer, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 30.6 `PUT` /api/v1/requirements/:id

- **Method:** `PUT`
- **Canonical URL:** `/api/v1/requirements/:id`
- **Source File:** [`requirementRoutes.js:155`](file:///d:/BizReels%20Website/backend/src/routes/requirementRoutes.js#L155)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** customer, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 30.7 `DELETE` /api/v1/requirements/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/requirements/:id`
- **Source File:** [`requirementRoutes.js:164`](file:///d:/BizReels%20Website/backend/src/routes/requirementRoutes.js#L164)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** customer, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 30.8 `GET` /api/v1/requirements/:id/quotes

- **Method:** `GET`
- **Canonical URL:** `/api/v1/requirements/:id/quotes`
- **Source File:** [`requirementRoutes.js:174`](file:///d:/BizReels%20Website/backend/src/routes/requirementRoutes.js#L174)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** customer, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 30.9 `PATCH` /api/v1/requirements/quotes/:quoteId

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/requirements/quotes/:quoteId`
- **Source File:** [`requirementRoutes.js:183`](file:///d:/BizReels%20Website/backend/src/routes/requirementRoutes.js#L183)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** customer, admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `quoteId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `403 Forbidden`: Access denied for current active role.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 30.10 `DELETE` /api/v1/requirements/quotes/:quoteId

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/requirements/quotes/:quoteId`
- **Source File:** [`requirementRoutes.js:192`](file:///d:/BizReels%20Website/backend/src/routes/requirementRoutes.js#L192)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `quoteId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 31. Reviews & Ratings

> Verified purchase ratings, customer review comments, photos, and vendor response.

### 31.1 `GET` /api/v1/reviews/user/:userId

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reviews/user/:userId`
- **Source File:** [`reviewRoutes.js:14`](file:///d:/BizReels%20Website/backend/src/routes/reviewRoutes.js#L14)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `userId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 31.2 `GET` /api/v1/reviews/listing/:listingId

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reviews/listing/:listingId`
- **Source File:** [`reviewRoutes.js:15`](file:///d:/BizReels%20Website/backend/src/routes/reviewRoutes.js#L15)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `listingId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 31.3 `GET` /api/v1/reviews/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/reviews/`
- **Source File:** [`reviewRoutes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/reviewRoutes.js#L18)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 31.4 `POST` /api/v1/reviews/

- **Method:** `POST`
- **Canonical URL:** `/api/v1/reviews/`
- **Source File:** [`reviewRoutes.js:19`](file:///d:/BizReels%20Website/backend/src/routes/reviewRoutes.js#L19)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 31.5 `DELETE` /api/v1/reviews/:id

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/reviews/:id`
- **Source File:** [`reviewRoutes.js:20`](file:///d:/BizReels%20Website/backend/src/routes/reviewRoutes.js#L20)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 32. Full-Text Search & Algolia

> 

### 32.1 `GET` /api/v1/search/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/search/`
- **Source File:** [`search.routes.js:8`](file:///d:/BizReels%20Website/backend/src/routes/search.routes.js#L8)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 32.2 `GET` /api/v1/search/suggest

- **Method:** `GET`
- **Canonical URL:** `/api/v1/search/suggest`
- **Source File:** [`search.routes.js:60`](file:///d:/BizReels%20Website/backend/src/routes/search.routes.js#L60)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 33. SEO, Sitemaps & Crawler Previews

> Dynamic XML sitemaps, robots.txt directives, and social media OpenGraph HTML previews.

### 33.1 `GET` /api/v1/seo/listing/:idOrSlug

- **Method:** `GET`
- **Canonical URL:** `/api/v1/seo/listing/:idOrSlug`
- **Source File:** [`seo.routes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/seo.routes.js#L18)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `idOrSlug` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 33.2 `GET` /api/v1/seo/product/:idOrSlug

- **Method:** `GET`
- **Canonical URL:** `/api/v1/seo/product/:idOrSlug`
- **Source File:** [`seo.routes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/seo.routes.js#L18)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `idOrSlug` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 33.3 `GET` /api/v1/seo/sitemap.xml

- **Method:** `GET`
- **Canonical URL:** `/api/v1/seo/sitemap.xml`
- **Source File:** [`seo.routes.js:23`](file:///d:/BizReels%20Website/backend/src/routes/seo.routes.js#L23)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 33.4 `GET` /api/v1/seo/sitemap

- **Method:** `GET`
- **Canonical URL:** `/api/v1/seo/sitemap`
- **Source File:** [`seo.routes.js:23`](file:///d:/BizReels%20Website/backend/src/routes/seo.routes.js#L23)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 33.5 `GET` /api/v1/seo/sitemap-index.xml

- **Method:** `GET`
- **Canonical URL:** `/api/v1/seo/sitemap-index.xml`
- **Source File:** [`seo.routes.js:30`](file:///d:/BizReels%20Website/backend/src/routes/seo.routes.js#L30)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 33.6 `GET` /api/v1/seo/robots.txt

- **Method:** `GET`
- **Canonical URL:** `/api/v1/seo/robots.txt`
- **Source File:** [`seo.routes.js:37`](file:///d:/BizReels%20Website/backend/src/routes/seo.routes.js#L37)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 34. Vendor/Creator Subscriptions & Add-ons

> Recurring subscription tiers (Basic, Pro, Enterprise), add-on features, and Razorpay billing.

### 34.1 `GET` /api/v1/subscriptions/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/subscriptions/me`
- **Source File:** [`subscription.routes.js:11`](file:///d:/BizReels%20Website/backend/src/routes/subscription.routes.js#L11)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 34.2 `GET` /api/v1/subscriptions/plans

- **Method:** `GET`
- **Canonical URL:** `/api/v1/subscriptions/plans`
- **Source File:** [`subscription.routes.js:12`](file:///d:/BizReels%20Website/backend/src/routes/subscription.routes.js#L12)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 34.3 `POST` /api/v1/subscriptions/purchase

- **Method:** `POST`
- **Canonical URL:** `/api/v1/subscriptions/purchase`
- **Source File:** [`subscription.routes.js:13`](file:///d:/BizReels%20Website/backend/src/routes/subscription.routes.js#L13)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 34.4 `POST` /api/v1/subscriptions/cancel

- **Method:** `POST`
- **Canonical URL:** `/api/v1/subscriptions/cancel`
- **Source File:** [`subscription.routes.js:14`](file:///d:/BizReels%20Website/backend/src/routes/subscription.routes.js#L14)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 34.5 `GET` /api/v1/subscriptions/history

- **Method:** `GET`
- **Canonical URL:** `/api/v1/subscriptions/history`
- **Source File:** [`subscription.routes.js:15`](file:///d:/BizReels%20Website/backend/src/routes/subscription.routes.js#L15)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 34.6 `POST` /api/v1/subscriptions/upgrade

- **Method:** `POST`
- **Canonical URL:** `/api/v1/subscriptions/upgrade`
- **Source File:** [`subscription.routes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/subscription.routes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 34.7 `POST` /api/v1/subscriptions/downgrade

- **Method:** `POST`
- **Canonical URL:** `/api/v1/subscriptions/downgrade`
- **Source File:** [`subscription.routes.js:17`](file:///d:/BizReels%20Website/backend/src/routes/subscription.routes.js#L17)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 35. Wallet Transactions & History

> Audit trail of all financial movements, credits, debits, and balance receipts.

### 35.1 `GET` /api/v1/transactions/vendor

- **Method:** `GET`
- **Canonical URL:** `/api/v1/transactions/vendor`
- **Source File:** [`transaction.routes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/transaction.routes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 35.2 `GET` /api/v1/transactions/creator

- **Method:** `GET`
- **Canonical URL:** `/api/v1/transactions/creator`
- **Source File:** [`transaction.routes.js:30`](file:///d:/BizReels%20Website/backend/src/routes/transaction.routes.js#L30)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 36. File & Image Uploads

> Multipart file upload endpoints for product photos, KYC proofs, and reel videos.

### 36.1 `POST` /api/v1/upload/image

- **Method:** `POST`
- **Canonical URL:** `/api/v1/upload/image`
- **Source File:** [`upload.routes.js:12`](file:///d:/BizReels%20Website/backend/src/routes/upload.routes.js#L12)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: multipart/form-data`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 37. Users & Profile Management

> User identity management, avatar updates, saved addresses, follower lists, and preferences.

### 37.1 `GET` /api/v1/users/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/`
- **Source File:** [`user.routes.js:19`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L19)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.2 `GET` /api/v1/users/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/me`
- **Source File:** [`user.routes.js:107`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L107)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.3 `PATCH` /api/v1/users/me

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/users/me`
- **Source File:** [`user.routes.js:122`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L122)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.4 `GET` /api/v1/users/me/onboarding-checklist

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/me/onboarding-checklist`
- **Source File:** [`user.routes.js:127`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L127)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.5 `GET` /api/v1/users/me/saved

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/me/saved`
- **Source File:** [`user.routes.js:133`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L133)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.6 `POST` /api/v1/users/me/switch-role

- **Method:** `POST`
- **Canonical URL:** `/api/v1/users/me/switch-role`
- **Source File:** [`user.routes.js:233`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L233)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.7 `POST` /api/v1/users/me/add-role

- **Method:** `POST`
- **Canonical URL:** `/api/v1/users/me/add-role`
- **Source File:** [`user.routes.js:249`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L249)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.8 `POST` /api/v1/users/me/fcm-token

- **Method:** `POST`
- **Canonical URL:** `/api/v1/users/me/fcm-token`
- **Source File:** [`user.routes.js:258`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L258)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.9 `DELETE` /api/v1/users/me/fcm-token/:token

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/users/me/fcm-token/:token`
- **Source File:** [`user.routes.js:267`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L267)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `token` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 37.10 `DELETE` /api/v1/users/me

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/users/me`
- **Source File:** [`user.routes.js:272`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L272)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.11 `DELETE` /api/v1/users/profile

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/users/profile`
- **Source File:** [`user.routes.js:272`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L272)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.12 `DELETE` /api/v1/users/delete-account

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/users/delete-account`
- **Source File:** [`user.routes.js:272`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L272)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.13 `GET` /api/v1/users/me/role-activity

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/me/role-activity`
- **Source File:** [`user.routes.js:280`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L280)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.14 `GET` /api/v1/users/creators/public

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/creators/public`
- **Source File:** [`user.routes.js:328`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L328)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.15 `PATCH` /api/v1/users/me

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/users/me`
- **Source File:** [`user.routes.js:403`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L403)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.16 `GET` /api/v1/users/me/interests

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/me/interests`
- **Source File:** [`user.routes.js:505`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L505)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.17 `PATCH` /api/v1/users/me/interests

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/users/me/interests`
- **Source File:** [`user.routes.js:514`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L514)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.18 `GET` /api/v1/users/me/activity-counts

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/me/activity-counts`
- **Source File:** [`user.routes.js:545`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L545)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.19 `GET` /api/v1/users/me/activities

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/me/activities`
- **Source File:** [`user.routes.js:637`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L637)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.20 `POST` /api/v1/users/me/track-interaction

- **Method:** `POST`
- **Canonical URL:** `/api/v1/users/me/track-interaction`
- **Source File:** [`user.routes.js:789`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L789)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 37.21 `GET` /api/v1/users/:userId

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/:userId`
- **Source File:** [`user.routes.js:834`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L834)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `userId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 37.22 `GET` /api/v1/users/:userId/profile

- **Method:** `GET`
- **Canonical URL:** `/api/v1/users/:userId/profile`
- **Source File:** [`user.routes.js:834`](file:///d:/BizReels%20Website/backend/src/routes/user.routes.js#L834)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `userId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 38. Vendor Storefront Offers & Vouchers

> Vendor-specific coupons, buy-one-get-one deals, min-order discounts, and voucher claims.

### 38.1 `GET` /api/v1/vendors/me/offers

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/me/offers`
- **Source File:** [`vendor-offer.routes.js:14`](file:///d:/BizReels%20Website/backend/src/routes/vendor-offer.routes.js#L14)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 38.2 `GET` /api/v1/vendors/me/offers/categories

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/me/offers/categories`
- **Source File:** [`vendor-offer.routes.js:63`](file:///d:/BizReels%20Website/backend/src/routes/vendor-offer.routes.js#L63)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 38.3 `POST` /api/v1/vendors/me/offers

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/offers`
- **Source File:** [`vendor-offer.routes.js:72`](file:///d:/BizReels%20Website/backend/src/routes/vendor-offer.routes.js#L72)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 38.4 `PUT` /api/v1/vendors/me/offers/:offerId

- **Method:** `PUT`
- **Canonical URL:** `/api/v1/vendors/me/offers/:offerId`
- **Source File:** [`vendor-offer.routes.js:197`](file:///d:/BizReels%20Website/backend/src/routes/vendor-offer.routes.js#L197)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `offerId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 38.5 `DELETE` /api/v1/vendors/me/offers/:offerId

- **Method:** `DELETE`
- **Canonical URL:** `/api/v1/vendors/me/offers/:offerId`
- **Source File:** [`vendor-offer.routes.js:261`](file:///d:/BizReels%20Website/backend/src/routes/vendor-offer.routes.js#L261)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `offerId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 38.6 `POST` /api/v1/vendors/me/offers/:offerId/duplicate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/offers/:offerId/duplicate`
- **Source File:** [`vendor-offer.routes.js:279`](file:///d:/BizReels%20Website/backend/src/routes/vendor-offer.routes.js#L279)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `offerId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 38.7 `PATCH` /api/v1/vendors/me/offers/:offerId/status

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/vendors/me/offers/:offerId/status`
- **Source File:** [`vendor-offer.routes.js:319`](file:///d:/BizReels%20Website/backend/src/routes/vendor-offer.routes.js#L319)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `offerId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 38.8 `POST` /api/v1/vendors/me/offers/:offerId/validate-coupon

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/offers/:offerId/validate-coupon`
- **Source File:** [`vendor-offer.routes.js:342`](file:///d:/BizReels%20Website/backend/src/routes/vendor-offer.routes.js#L342)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `offerId` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 38.9 `GET` /api/v1/vendors/me/referral-offer-stats

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/me/referral-offer-stats`
- **Source File:** [`vendor-offer.routes.js:413`](file:///d:/BizReels%20Website/backend/src/routes/vendor-offer.routes.js#L413)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

## 39. Vendor Management & Storefronts

> Store setup, business profile, opening hours, delivery zones, and verification badges.

### 39.1 `GET` /api/v1/vendors/me/verification-status

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/me/verification-status`
- **Source File:** [`vendor.routes.js:33`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L33)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.2 `POST` /api/v1/vendors/me/send-contact-otp

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/send-contact-otp`
- **Source File:** [`vendor.routes.js:34`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L34)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.3 `POST` /api/v1/vendors/me/verify-contact

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/verify-contact`
- **Source File:** [`vendor.routes.js:35`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L35)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.4 `POST` /api/v1/vendors/me/verify-document

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/verify-document`
- **Source File:** [`vendor.routes.js:36`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L36)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.5 `POST` /api/v1/vendors/me/verify-payment

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/verify-payment`
- **Source File:** [`vendor.routes.js:37`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L37)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.6 `POST` /api/v1/vendors/me/verification/pan

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/verification/pan`
- **Source File:** [`vendor.routes.js:41`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L41)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.7 `POST` /api/v1/vendors/me/verification/aadhaar/initiate

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/verification/aadhaar/initiate`
- **Source File:** [`vendor.routes.js:42`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L42)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.8 `POST` /api/v1/vendors/me/verification/aadhaar/verify-otp

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/verification/aadhaar/verify-otp`
- **Source File:** [`vendor.routes.js:43`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L43)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.9 `POST` /api/v1/vendors/me/verification/gstin

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/verification/gstin`
- **Source File:** [`vendor.routes.js:44`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L44)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.10 `POST` /api/v1/vendors/me/verification/bank

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/verification/bank`
- **Source File:** [`vendor.routes.js:45`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L45)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.11 `POST` /api/v1/vendors/me/verification/upi

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/verification/upi`
- **Source File:** [`vendor.routes.js:46`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L46)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.12 `GET` /api/v1/vendors/me/settings

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/me/settings`
- **Source File:** [`vendor.routes.js:54`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L54)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.13 `POST` /api/v1/vendors/me/send-settings-otp

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/send-settings-otp`
- **Source File:** [`vendor.routes.js:104`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L104)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.14 `POST` /api/v1/vendors/me/settings

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/settings`
- **Source File:** [`vendor.routes.js:141`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L141)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.15 `GET` /api/v1/vendors/me/profile

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/me/profile`
- **Source File:** [`vendor.routes.js:377`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L377)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.16 `PUT` /api/v1/vendors/me/profile

- **Method:** `PUT`
- **Canonical URL:** `/api/v1/vendors/me/profile`
- **Source File:** [`vendor.routes.js:417`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L417)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.17 `PATCH` /api/v1/vendors/me/profile

- **Method:** `PATCH`
- **Canonical URL:** `/api/v1/vendors/me/profile`
- **Source File:** [`vendor.routes.js:418`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L418)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.18 `GET` /api/v1/vendors/me/offers/legacy

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/me/offers/legacy`
- **Source File:** [`vendor.routes.js:427`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L427)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.19 `POST` /api/v1/vendors/me/offers/legacy

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/me/offers/legacy`
- **Source File:** [`vendor.routes.js:434`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L434)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.20 `GET` /api/v1/vendors/ifsc-lookup/:ifsc

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/ifsc-lookup/:ifsc`
- **Source File:** [`vendor.routes.js:467`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L467)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `ifsc` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 39.21 `GET` /api/v1/vendors/:user_id

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/:user_id`
- **Source File:** [`vendor.routes.js:494`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L494)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 39.22 `GET` /api/v1/vendors/:user_id/profile

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/:user_id/profile`
- **Source File:** [`vendor.routes.js:538`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L538)
- **Authentication:** Optional
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 39.23 `GET` /api/v1/vendors/:user_id/listings

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/:user_id/listings`
- **Source File:** [`vendor.routes.js:688`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L688)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 39.24 `GET` /api/v1/vendors/:user_id/followers/count

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/:user_id/followers/count`
- **Source File:** [`vendor.routes.js:698`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L698)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

### 39.25 `GET` /api/v1/vendors/leaderboard/fast-responders

- **Method:** `GET`
- **Canonical URL:** `/api/v1/vendors/leaderboard/fast-responders`
- **Source File:** [`vendor.routes.js:708`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L708)
- **Authentication:** Public
- **Required Roles:** None (Public)
- **Headers:**
  - `Content-Type: application/json`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 39.26 `POST` /api/v1/vendors/:user_id/reveal-contact

- **Method:** `POST`
- **Canonical URL:** `/api/v1/vendors/:user_id/reveal-contact`
- **Source File:** [`vendor.routes.js:748`](file:///d:/BizReels%20Website/backend/src/routes/vendor.routes.js#L748)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **URL Path Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `user_id` | String (ObjectId) | Yes | Identifier of target resource. |
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `404 Not Found`: Resource ID not found.
  - `500 Internal Server Error`: Server execution error.

---

## 40. Wallet & Customer Financial Ledger

> Double-entry balance tracking, recharge orders, transaction receipts, and cashbacks.

### 40.1 `GET` /api/v1/wallet/

- **Method:** `GET`
- **Canonical URL:** `/api/v1/wallet/`
- **Source File:** [`walletRoutes.js:16`](file:///d:/BizReels%20Website/backend/src/routes/walletRoutes.js#L16)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 40.2 `GET` /api/v1/wallet/me

- **Method:** `GET`
- **Canonical URL:** `/api/v1/wallet/me`
- **Source File:** [`walletRoutes.js:17`](file:///d:/BizReels%20Website/backend/src/routes/walletRoutes.js#L17)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 40.3 `GET` /api/v1/wallet/balance

- **Method:** `GET`
- **Canonical URL:** `/api/v1/wallet/balance`
- **Source File:** [`walletRoutes.js:18`](file:///d:/BizReels%20Website/backend/src/routes/walletRoutes.js#L18)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 40.4 `POST` /api/v1/wallet/recharge

- **Method:** `POST`
- **Canonical URL:** `/api/v1/wallet/recharge`
- **Source File:** [`walletRoutes.js:19`](file:///d:/BizReels%20Website/backend/src/routes/walletRoutes.js#L19)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "amount": 500
  }
  ```
- **Fields Table:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `amount` | `Number` | Yes | Amount in INR to deposit (min 1 INR) |
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 40.5 `GET` /api/v1/wallet/transactions

- **Method:** `GET`
- **Canonical URL:** `/api/v1/wallet/transactions`
- **Source File:** [`walletRoutes.js:20`](file:///d:/BizReels%20Website/backend/src/routes/walletRoutes.js#L20)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 40.6 `GET` /api/v1/wallet/topup-packs

- **Method:** `GET`
- **Canonical URL:** `/api/v1/wallet/topup-packs`
- **Source File:** [`walletRoutes.js:21`](file:///d:/BizReels%20Website/backend/src/routes/walletRoutes.js#L21)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 40.7 `GET` /api/v1/wallet/credit-rates

- **Method:** `GET`
- **Canonical URL:** `/api/v1/wallet/credit-rates`
- **Source File:** [`walletRoutes.js:22`](file:///d:/BizReels%20Website/backend/src/routes/walletRoutes.js#L22)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 40.8 `POST` /api/v1/wallet/subscribe

- **Method:** `POST`
- **Canonical URL:** `/api/v1/wallet/subscribe`
- **Source File:** [`walletRoutes.js:23`](file:///d:/BizReels%20Website/backend/src/routes/walletRoutes.js#L23)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 40.9 `POST` /api/v1/wallet/payout

- **Method:** `POST`
- **Canonical URL:** `/api/v1/wallet/payout`
- **Source File:** [`walletRoutes.js:24`](file:///d:/BizReels%20Website/backend/src/routes/walletRoutes.js#L24)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Request Body:** Accepts JSON formatted request body adhering to domain schema.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 40.10 `GET` /api/v1/wallet/vendor

- **Method:** `GET`
- **Canonical URL:** `/api/v1/wallet/vendor`
- **Source File:** [`walletRoutes.js:29`](file:///d:/BizReels%20Website/backend/src/routes/walletRoutes.js#L29)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

### 40.11 `GET` /api/v1/wallet/creator

- **Method:** `GET`
- **Canonical URL:** `/api/v1/wallet/creator`
- **Source File:** [`walletRoutes.js:35`](file:///d:/BizReels%20Website/backend/src/routes/walletRoutes.js#L35)
- **Authentication:** Required (JWT Bearer)
- **Required Roles:** Any authenticated user
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Query Parameters:** Supports `page` (default: 1), `limit` (default: 20), `search`, `status`, `sort`.
- **Success Response (200/201):**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Missing or expired access token.
  - `400 Bad Request`: Invalid request payload or validation failure.
  - `500 Internal Server Error`: Server execution error.

---

