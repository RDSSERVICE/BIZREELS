# Platform API Inconsistencies & Discrepancy Audit

> **Platform Version:** 1.4.0  
> **Audit Status:** Complete Source-Code Cross-Reference  
> **Source of Truth:** Express Route Handlers, Controllers, Middlewares, and Mongoose Models (\`backend/src/\`)  

---

## 1. Overview

This document provides a comprehensive, unvarnished audit of all discrepancies, architectural conflicts, phantom routes, naming mismatches, and validation gaps discovered between the existing documentation/frontend code and the actual backend implementation.

Each issue is documented using the standard format specified in the platform audit directive.

---

## 2. Discrepancy Issue Catalog

### Issue 1: Phantom Endpoint `POST /api/v1/auth/google/session-exchange`

* **Endpoint:** `POST /api/v1/auth/google/session-exchange`
* **Current behavior:** Returns `404 Not Found` (Cannot POST `/api/v1/auth/google/session-exchange`).
* **Expected/likely behavior:** In `docs/AUTHENTICATION.md`, `docs/API_REFERENCE.md`, `backend/src/config/swagger.config.js`, and `frontend/src/lib/api.js`, this endpoint is documented and called to exchange a temporary Google session ID for JWT credentials.
* **Problem:** The endpoint does **not exist** in `backend/src/routes/authRoutes.js`. The backend actually provides native token exchange at `POST /api/v1/auth/google/token` and `POST /api/v1/auth/google/mobile`.
* **Impact on Android/Web:** **CRITICAL**. Any web or Android client following the documented session-exchange route fails immediately with an unhandled 404 error.
* **Recommended solution:** 
  1. Add an alias route `router.post('/google/session-exchange', authController.googleTokenLogin);` in `backend/src/routes/authRoutes.js`.
  2. Update frontend and documentation to standardize on `POST /api/v1/auth/google/token`.
* **Breaking change:** No (adding the route alias is strictly backward-compatible).
* **Priority:** **High**

---

### Issue 2: Dual-Mount Path Ambiguity (`/orders` vs `/vendor-orders`)

* **Endpoint:** `/api/v1/orders/*` vs `/api/v1/vendor-orders/*`
* **Current behavior:** `backend/src/routes/index.js` lines 67-68 mounts `orderRoutes.js` at **both** `/orders` and `/vendor-orders`:
  ```javascript
  router.use('/orders', lazyLoad('./orderRoutes'));
  router.use('/vendor-orders', lazyLoad('./orderRoutes'));
  ```
* **Expected/likely behavior:** A single, authoritative canonical resource path.
* **Problem:** Older internal route documentation lists `/vendor-orders`, while the Android Order Flow guide and frontend clients call `/orders`. This creates duplicate paths for the exact same operations.
* **Impact on Android/Web:** Low risk of failure since both work, but causes confusion for client engineers and complicates API analytics.
* **Recommended solution:** Standardize documentation on `/api/v1/orders` as canonical, and document `/vendor-orders` as a deprecated backward-compatibility alias.
* **Breaking change:** No.
* **Priority:** **Medium**

---

### Issue 3: Dual-Mount Path Ambiguity (`/inquiries` vs `/leads`)

* **Endpoint:** `/api/v1/inquiries/*` vs `/api/v1/leads/*`
* **Current behavior:** `backend/src/routes/index.js` lines 69-70 mounts `inquiryRoutes.js` at **both** `/inquiries` and `/leads`.
* **Expected/likely behavior:** Single canonical path for customer inquiries and RFQ leads.
* **Problem:** Divergent naming in documentation vs code.
* **Impact on Android/Web:** Low. Both work simultaneously.
* **Recommended solution:** Designate `/api/v1/inquiries` as canonical, retaining `/leads` as a permanent alias.
* **Breaking change:** No.
* **Priority:** **Low**

---

### Issue 4: Parallel & Fragmented Authentication Middleware Implementations

* **Endpoint:** All protected endpoints across the backend.
* **Current behavior:** Two parallel middleware files exist:
  - `backend/src/middleware/auth.js` (`authenticate`, `authorize`)
  - `backend/src/middleware/auth.middleware.js` (`requireAuth`, `optionalAuth`)
* **Expected/likely behavior:** A unified, single authentication middleware module.
* **Problem:** Different route files import different middlewares (e.g. `authRoutes.js` uses `authenticate`, whereas `vendor.routes.js` and `cart.routes.js` use `requireAuth`). While both inspect `Authorization: Bearer <token>`, their error message envelopes and cookie parsing semantics have subtle variations.
* **Impact on Android/Web:** Clients may receive slightly different error messages (`"Authentication required"` vs `"No token provided"`) depending on which domain endpoint they hit.
* **Recommended solution:** Consolidate both files into `backend/src/middleware/auth.js` with consistent export aliases (`authenticate` / `requireAuth`).
* **Breaking change:** No.
* **Priority:** **Medium**

---

### Issue 5: Discrepant OTP Dispatch Endpoints (`/auth/otp/send` vs `/auth/otp/request`)

* **Endpoint:** `POST /api/v1/auth/otp/send` vs `POST /api/v1/auth/otp/request`
* **Current behavior:** `POST /auth/otp/send` applies strict `authValidation.sendOtp` Joi validation schema. `POST /auth/otp/request` routes to `authValidation.requestOtp`.
* **Expected/likely behavior:** Unified, unambiguous OTP request endpoint.
* **Problem:** `API_DOCUMENTATION_COMPLETE.md` and `api.md` document `/auth/otp/request`, whereas `AUTHENTICATION.md` documents `/auth/otp/send`.
* **Impact on Android/Web:** Clients calling `/auth/otp/request` may encounter differing validation error messages compared to `/auth/otp/send`.
* **Recommended solution:** Standardize client integration on `POST /api/v1/auth/otp/send`.
* **Breaking change:** No.
* **Priority:** **Medium**

---

### Issue 6: Deprecated Boost Endpoints Still Documented in Reference Docs

* **Endpoint:** `POST /api/v1/reels/boost`, `POST /api/v1/wallet/subscribe`
* **Current behavior:** Explicitly removed in `backend/src/routes/index.js:201`:
  ```javascript
  // NOTE: Boost endpoints removed — boost system deprecated in favor of subscriptions
  ```
* **Expected/likely behavior:** Documentation matches code reality.
* **Problem:** `docs/API_ENDPOINT_LIST.md` still lists `POST /reels/boost` and `POST /wallet/subscribe` as active features.
* **Impact on Android/Web:** Mobile engineers attempting to build video boost UI will call non-existent endpoints resulting in 404 errors.
* **Recommended solution:** Update `API_ENDPOINT_LIST.md` to indicate boost deprecation and point developers to the Subscription Plan API (`/api/v1/subscriptions`).
* **Breaking change:** No.
* **Priority:** **High**

---

### Issue 7: Inconsistent Soft-Delete Field Naming Across Mongoose Models

* **Endpoint:** All resource retrieval endpoints (`GET /listings`, `GET /reels`, `GET /admin/users`, `GET /subscriptions`).
* **Current behavior:** 
  - `models/Reel.js` and `models/Listing.js` use **camelCase**: `{ isDeleted: { type: Boolean, default: false } }`.
  - `models/Admin.js`, `models/UserSubscription.model.js`, and `models/Phase4.js` use **snake_case**: `{ is_deleted: { type: Boolean, default: false } }`.
* **Expected/likely behavior:** Uniform convention (either all `isDeleted` or all `is_deleted`).
* **Problem:** Query filters must alternate between `isDeleted: { $ne: true }` and `is_deleted: { $ne: true }` depending on the collection.
* **Impact on Android/Web:** Internal query bug hazard; client filtering logic must handle both conventions.
* **Recommended solution:** Add virtual fields or standard Mongoose plugin ensuring both `isDeleted` and `is_deleted` resolve identically.
* **Breaking change:** No (if implemented via virtual getter).
* **Priority:** **Medium**

---

### Issue 8: Inconsistent Timestamps Naming (`created_at` vs `createdAt`)

* **Endpoint:** All API response payloads.
* **Current behavior:**
  - Some models (`Offer.js`, `Phase4.js`) explicitly declare `{ created_at: { type: Date, default: Date.now } }`.
  - Other models (`User.js`, `Listing.js`) use `{ timestamps: true }`, generating `createdAt` and `updatedAt`.
* **Expected/likely behavior:** Consistent date field names across all entity responses.
* **Impact on Android/Web:** Android Kotlin data classes cannot use a single base model or JSON adapter for timestamps without custom deserializers.
* **Recommended solution:** Normalize responses in API serializers so both `createdAt` and `created_at` are populated.
* **Breaking change:** No.
* **Priority:** **Medium**

---

### Issue 9: AI Copywriting Route Location Discrepancy

* **Endpoint:** `POST /api/v1/listings/ai-copy` vs `POST /api/v1/ai/generate-description`
* **Current behavior:** `docs/API_ENDPOINT_LIST.md` documents `POST /listings/ai-copy`. The actual route is registered in `ai.routes.js` at `POST /ai/generate-description` (or `POST /ai/listing-description`).
* **Expected/likely behavior:** Documentation reflects actual route mount.
* **Problem:** Developers looking in `listingRoutes.js` cannot find the endpoint.
* **Impact on Android/Web:** 404 error if calling documented `/listings/ai-copy`.
* **Recommended solution:** Update docs to point to `/api/v1/ai/generate-description`.
* **Breaking change:** No.
* **Priority:** **Medium**

---

### Issue 10: Validation Coverage Gap Across Non-Core Routes

* **Endpoint:** Over 350 endpoints across `admin.routes.js`, `creator.routes.js`, `vendor.routes.js`.
* **Current behavior:** Only 6 validation files exist in `backend/src/validations/`. Routes without validation rely on inline controller destructuring or Mongoose runtime casting.
* **Expected/likely behavior:** Explicit validation middleware on all mutation routes (POST/PUT/PATCH).
* **Problem:** Invalid data types (e.g. string passed instead of number) result in unhandled Mongoose `CastError` or uncaught exceptions returning generic 500 errors instead of helpful 400 validation envelopes.
* **Impact on Android/Web:** Poor developer debugging experience; unexpected 500 errors instead of field error lists.
* **Recommended solution:** Gradually introduce Joi/express-validator schemas across all operational routes.
* **Breaking change:** No.
* **Priority:** **Medium**
