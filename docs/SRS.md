# Software Requirement Specification (SRS)
## BizReels Marketplace Platform

---

## 1. Introduction

### 1.1 Purpose
This document provides a detailed specification of the software requirements for the **BizReels** platform. It outlines the functional and non-functional requirements, data schemas, API routes, security controls, and infrastructure configurations of the MERN stack application.

### 1.2 System Scope
BizReels combines local business catalog discovery with a short-video social interface. The system leverages:
- Node.js Express REST API server.
- Socket.io for real-time bidirectional message events.
- MongoDB Atlas with `2dsphere` indexes for geospatial queries.
- Cloudinary CDN for storing and streaming user media.
- Redis & BullMQ for asynchronous background job triggers.

---

## 2. Overall Description

### 2.1 Product Perspective
BizReels is a modular, decoupled application consisting of a React 19 frontend and an Express backend. It interfaces with external services for OAuth logins (Google) and CDN streaming (Cloudinary).

```
[ React Client ] <--- HTTP / REST ---> [ Express Server ] <--- Mongoose ---> [ MongoDB ]
       ^                                      |
       | <----------- Socket.io ------------->| <--- BullMQ ---> [ Redis Cache ]
```

### 2.2 User Classes & Roles
1. **Customer**: Standard consumer accounts. Restricted to viewing reels/listings, posting requirements, chatting, and funding escrow.
2. **Vendor**: Business accounts. Authorized to list products/services, bid on requirements, upload reels, start live streams, and hire creators.
3. **Creator**: Portfolio content-creator accounts. Authorized to upload reels, define pricing packages, accept campaign contracts, and stream live.
4. **Admin**: Platform administrators. Access to all dashboards, audit logs, and content moderation tools (document verification, content soft deletes).

---

## 3. System Features & Technical Specifications

### 3.1 Authentication & Multi-Role Authorization
- **SRS-F1.1**: User registration must accept name, email, phone, password, and onboarding roles selection.
- **SRS-F1.2**: JWT sessions must implement access token (short-lived, HTTP Header) and refresh token (long-lived, HttpOnly Cookie) rotations.
- **SRS-F1.3**: Switch active role API switches `activeRole` property on the user document if present in their `roles` array.
- **SRS-F1.4**: Security limiters: 5 failed login attempts lock accounts for 1 hour (`lockUntil` timestamp).

### 3.2 Geospatial Listings & AI Writing Tools
- **SRS-F2.1**: Catalog listings must store location coordinates as a GeoJSON Point:
  ```json
  "location": { "type": "Point", "coordinates": [longitude, latitude] }
  ```
- **SRS-F2.2**: The platform must support proximity queries using Mongoose `$geoNear` within a defined maximum distance (radius in meters).
- **SRS-F2.3**: AI copywriting helper must interface with LLM endpoints (or simulated AI wrappers) to generate descriptions based on category and title.

### 3.3 Custom Proximity Requirements & Quoting
- **SRS-F3.1**: Customers can post requirement briefs. The model stores budget, category, fulfillment deadline, and GeoJSON location.
- **SRS-F3.2**: Nearby category-matching vendors fetch requirements using geolocation indexes.
- **SRS-F3.3**: Quotes require a unique index on `{ requirement: 1, vendor: 1 }` to prevent multiple bids from the same vendor.

### 3.4 Ledger Escrow Wallet & Subscriptions
- **SRS-F4.1**: Double-entry ledger structure for all balance adjustments. Schema `WalletTransaction` tracks debit/credit links.
- **SRS-F4.2**: Accept quotes or accept hire contracts must execute within a Mongoose session transaction block:
  ```javascript
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    // 1. Debit buyer/vendor wallet
    // 2. Lock budget in escrow hold
    // 3. Write transaction log entries
  });
  ```
- **SRS-F4.3**: Subscriptions (Premium, Business, Creator) expire on target date timestamps. Expirations trigger via BullMQ background tasks.

### 3.5 Short Video Reels & Comments
- **SRS-F5.1**: Reels require video files uploaded to Cloudinary, returning URL strings and generated thumbnail URLs.
- **SRS-F5.2**: Comments feature handles parent-child relations for nested discussion drawers.
- **SRS-F5.3**: Boost status is represented by an indexable boolean: `isBoosted: { type: Boolean, default: false }`.

### 3.6 WebSockets Real-Time inbox
- **SRS-F6.1**: Socket server associates socket IDs with user IDs upon connection.
- **SRS-F6.2**: Rooms created for specific chats (`conversation:<conversationId>`) and broadcasts (`stream:<streamId>`).
- **SRS-F6.3**: Real-time events support: `typing`, `mark_seen`, `message`, `stream_message`.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- Responsive React client rendering utilizing glassmorphic Tailwind styling.
- Framer Motion transitions for sliders, modal overlays, drawer menus, and dashboard views.

### 4.2 Software Interfaces
- **Database**: MongoDB Atlas database. Mongoose library mapping document validations.
- **Media Store**: Cloudinary SDK configuration.
- **Asynchronous Runner**: BullMQ queue runner linked to a Redis server.

---

## 5. Non-Functional Requirements

### 5.1 Security
- Password hashing using `bcryptjs` with 12 salt rounds.
- CORS policy restricting origins. Helmet headers configured on Express.
- Express-rate-limiter restricting API traffic (e.g. max 100 requests per 15 minutes per IP).

### 5.2 Reliability & Soft Deletion
- Database schemas enforce `isDeleted` checks across Listings, Requirements, Reels, and Comments.
- Centralized exception handlers parse error instances (`ApiError.js`) and return standard JSON outputs.

### 5.3 Performance
- Location indexing strategy utilizes `2dsphere` type to resolve queries in < 200ms.
- Message broadcast delivery delay < 100ms for active Socket.io connections.
