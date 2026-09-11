# Cross-Platform API Recommendations (Web, Android, iOS)

> **Platform Version:** 1.4.0  
> **Audience:** Backend Team, System Architects, Mobile Leads  
> **Context:** Ensuring robust multi-client interoperability across React Web, Android (Kotlin), and future iOS (Swift) clients.  

---

## 1. Executive Summary

A full cross-platform compatibility analysis was performed across all 517 endpoints. While the current Node.js/Express backend functions well for the React web frontend, native mobile clients (Android & iOS) enforce strict static typing and strict serialization contracts. When a backend inconsistently returns a number as a string, alternates between `isDeleted` and `is_deleted`, or fails to supply machine-readable error codes, mobile parsing libraries (such as Retrofit, Moshi, and Kotlinx.serialization) can throw deserialization exceptions and crash.

This document classifies all recommendations into **Critical**, **Recommended**, and **Optional** tiers.

---

## 2. Critical Recommendations (Must Fix — High Failure Risk for Clients)

### 2.1 Mount `POST /api/v1/auth/google/session-exchange` Alias
* **Problem:** `frontend/src/lib/api.js`, `docs/AUTHENTICATION.md`, and `swagger.config.js` all call `/auth/google/session-exchange`. The route is missing from `authRoutes.js`.
* **Client Impact:** Immediate 404 unhandled exception when any client attempts this documented flow.
* **Fix:** Add route alias in `authRoutes.js`:
  ```javascript
  router.post(['/google/session-exchange', '/google/token'], authLimiter, authController.googleTokenLogin);
  ```

### 2.2 Fix Razorpay Amount Unit Discrepancy (INR vs Paise) in Response Envelopes
* **Problem:** In checkout (`POST /cart/checkout`) and subscription purchases (`POST /subscription/purchase-razorpay`), the returned payload contains `grand_total_inr` (e.g. `1350`) alongside `razorpay_order.amount` (e.g. `135000` paise).
* **Client Impact:** If mobile developers bind UI directly to `razorpay_order.amount`, the user sees prices inflated by 100x (e.g. ₹1,35,000 instead of ₹1,350).
* **Fix:** Always provide explicit, unambiguous field names in every payment envelope:
  - `amount_inr`: Float/Number in Rupees
  - `amount_paise`: Integer in Paise
  - Document clearly that `amount_paise` is strictly for the Razorpay SDK checkout invocation.

### 2.3 Add Safe Type Coercion / Normalization for Numeric Query Parameters
* **Problem:** Many listing and feed endpoints accept `page`, `limit`, `lat`, `lng`, and `radius` via `req.query`. If a client passes strings like `"page": "1"`, controllers using strict equality or mathematical operations can fail or perform string concatenation (e.g. `"1" + 1 = "11"`).
* **Client Impact:** Broken pagination or empty search feeds on Android.
* **Fix:** Apply a global query normalization middleware that safely parses numeric query strings into actual numbers before reaching controllers.

---

## 3. Recommended Improvements (Improves Maintainability & Quality)

### 3.1 Standardize Machine-Readable Error Codes
* **Problem:** Many controllers throw `ApiError.badRequest("Invalid input")` without specifying an error code string.
* **Client Impact:** Android clients cannot easily localize error messages or trigger context-specific UI flows without fragile string-matching on English error messages.
* **Fix:** Mandate standard error codes across all `ApiError` invocations:
  - `INVALID_PHONE_NUMBER`
  - `OTP_EXPIRED`
  - `INSUFFICIENT_WALLET_BALANCE`
  - `ITEM_OUT_OF_STOCK`
  - `LISTING_NOT_FOUND`

### 3.2 Standardize Soft-Delete Flag Naming Across Schemas
* **Problem:** `Reel` and `Listing` use `isDeleted: Boolean`, while `Admin`, `UserSubscription`, and `Phase4` use `is_deleted: Boolean`.
* **Client Impact:** Prevents shared base models in Android Kotlin; requires duplicate deserializers.
* **Fix:** Standardize on `is_deleted` across all Mongoose schemas, providing virtual getters for `isDeleted` during migration.

### 3.3 Consolidate Dual Auth Middlewares
* **Problem:** `middleware/auth.js` (`authenticate`) vs `middleware/auth.middleware.js` (`requireAuth`).
* **Client Impact:** Duplicate code maintenance and minor divergence in header extraction logic.
* **Fix:** Merge both into `middleware/auth.js` and re-export `requireAuth` as an alias.

### 3.4 Ensure All Timestamps Provide ISO-8601 UTC Strings
* **Problem:** Some older database documents store timestamps as raw numbers or inconsistent string formats.
* **Client Impact:** Parsing errors in Android `java.time.Instant.parse()`.
* **Fix:** Ensure all date fields are transformed to UTC ISO strings (`.toISOString()`) in JSON transform hooks.

---

## 4. Optional Improvements (Nice-to-Have Enhancements)

### 4.1 Implement Cursor-Based Pagination for Video Reel Feeds
* **Problem:** Video reel feeds currently use offset-based pagination (`page` and `limit`). As new reels are constantly published, users scrolling down may see duplicate reels when shifting pages.
* **Benefit:** Infinite scroll feeds in TikTok / Instagram style work significantly smoother with cursor pagination (`before_id` / `after_id`).

### 4.2 Standardize ETags and HTTP Caching Headers on Catalog Endpoints
* **Problem:** Catalog category lists and static CMS pages (`GET /categories`, `GET /cms/:slug`) rarely change but are fetched repeatedly.
* **Benefit:** Adding `Cache-Control: public, max-age=300` reduces mobile battery and data consumption.

### 4.3 Client Telemetry Header (`x-client-platform`)
* **Problem:** Backend cannot easily differentiate traffic originating from the React Web app vs the Android Native app.
* **Benefit:** Enables targeted analytics, platform-specific deprecation warnings, and tailored push notification routing.
