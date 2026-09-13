# Reel Boosting, Dynamic Credit Rates & Direct CDN Streaming Engineering Guide

> **Document Status**: Production Specification (v2.1)  
> **Target Audience**: Full-Stack Engineers, Backend Developers, Frontend Engineers, Mobile (Android/iOS) Developers, QA Engineers  
> **Source Code Locations**:
> - **Backend Services**: `backend/src/services/action-charge.service.js`, `backend/src/services/boost.service.js`, `backend/src/services/wallet.service.js`
> - **Backend Controllers**: `backend/src/controllers/reelController.js`, `backend/src/controllers/vendorController.js`, `backend/src/controllers/walletController.js`
> - **Backend Routes**: `backend/src/routes/reelRoutes.js`, `backend/src/routes/admin.routes.js`, `backend/src/routes/walletRoutes.js`
> - **Frontend Components**: `frontend/src/pages/vendor/reels/ReelBoostModal.jsx`, `ReelBoostPromptModal.jsx`, `CreateReelWizardModal.jsx`, `frontend/src/pages/home/Pricing.jsx`, `frontend/src/pages/admin/app-settings/AdminCreditRatesPage.jsx`
> - **Database Models**: `Reel.js`, `Admin.js` (`AppSettings`, `SubscriptionPlan`), `Phase4.js` (`Wallet`), `WalletTransactionV2.model.js`

---

## 1. Executive Summary & Core Rules

### 1.1 Pricing & Deduction Logic
1. **Rate is Dynamic & Admin-Configurable**:
   * The baseline rate is **2.00 Credits per day** (`2.00 Credits/day`).
   * Administrators can adjust this rate anytime in the Admin Console (`/admin/credit-rates` or AppSettings key: `credit_rates`).
   * The rate is **never hardcoded** in calculations; both backend and frontend resolve it dynamically from `AppSettings`.
2. **Formula**:
   $$\text{Total Cost} = \begin{cases} 0 \text{ Credits (1 Free Boost Used)}, & \text{if vendor has free\_reel\_boosts} > 0 \\ \text{durationDays} \times \text{ratePerDay}, & \text{if vendor has free\_reel\_boosts} = 0 \end{cases}$$
   * **1 Day**: $1 \times 2.00 = 2.00\text{ Credits}$
   * **3 Days**: $3 \times 2.00 = 6.00\text{ Credits}$
   * **7 Days**: $7 \times 2.00 = 14.00\text{ Credits}$
   * **14 Days**: $14 \times 2.00 = 28.00\text{ Credits}$
   * **30 Days**: $30 \times 2.00 = 60.00\text{ Credits}$
   * **Custom $N$ Days (1–90)**: $N \times 2.00\text{ Credits}$
3. **Plan Entitlement Priority**:
   * Vendors on active subscription recharge packs receive free boost tokens:
     - **Starter (₹499)**: 1 Free Boost
     - **Growth (₹1,199)**: 3 Free Boosts
     - **Business (₹2,199)**: 5 Free Boosts
   * If `wallet.free_reel_boosts > 0`, the boost consumes **1 free boost token** regardless of duration, and **0 credits** are deducted.
4. **Consecutive Extensions**:
   * If a reel is already boosted (`boostExpiresAt > Date.now()`), boosting again extends from the current expiration date rather than overriding it:
     $$\text{newExpiration} = \max(\text{now}, \text{currentExpiration}) + (\text{durationDays} \times 86,400,000\text{ ms})$$

---

## 2. End-to-End Sequence Diagram

```
Vendor Frontend UI              Reel Controller                 Action Charge Service              MongoDB Atlas / Wallet
      │                                │                                  │                                  │
      │── 1. POST /reels/:id/boost ───>│                                  │                                  │
      │   { durationDays: 7 }          │── 2. Verify Reel Ownership ────>│                                  │
      │                                │                                  │── 3. Check Free Boost Tokens ───>│
      │                                │                                  │   (wallet.free_reel_boosts > 0?) │
      │                                │                                  │<── Free Boosts: 0 ───────────────│
      │                                │                                  │                                  │
      │                                │                                  │── 4. Get Dynamic Rate ───────────>│
      │                                │                                  │   AppSettings: key='credit_rates'│
      │                                │                                  │<── Rate: 2.00 Credits/Day ───────│
      │                                │                                  │                                  │
      │                                │                                  │── 5. Calc Cost: 7 * 2.00 = 14 Cr │
      │                                │                                  │── 6. Check Balance (>= 14 Cr) ──>│
      │                                │                                  │── 7. Atomic Decrement: -14 Cr ──>│
      │                                │                                  │── 8. Log WalletTransactionV2 ───>│
      │                                │<── 9. Deduction Success ─────────│                                  │
      │                                │                                                                     │
      │                                │── 10. Update Reel { isBoosted: true, boostExpiresAt: +7d } ────────>│
      │                                │── 11. Socket Emit: 'reel:updated' to Vendor Room ──────────────────>│
      │<── 12. 200 OK Response ────────│                                                                     │
      │   { isBoosted: true, ... }     │                                                                     │
```

---

## 3. Complete API Specifications

### 3.1 `POST /api/v1/reels/:id/boost` — Boost Reel Visibility
Activates high-priority discovery feed and local search placement for the targeted video reel.

* **Method**: `POST`
* **URL**: `/api/v1/reels/:id/boost`
* **Auth**: Bearer JWT (Vendor / Creator owning the reel)
* **Headers**:
  ```http
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```
* **Path Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `id` | String (ObjectId) | Yes | MongoDB `_id` of the reel to boost |
* **Request Body**:
  ```json
  {
    "durationDays": 7
  }
  ```
  *(Accepts `durationDays`, `duration_days`, or `days`. Min: 1, Max: 90. Defaults to 1 if omitted).*

* **Success Response (200 OK — Paid Boost)**:
  ```json
  {
    "success": true,
    "message": "Reel boosted successfully.",
    "data": {
      "success": true,
      "type": "credits",
      "usedFreeBoost": false,
      "durationDays": 7,
      "ratePerDay": 2.0,
      "freeBoostRemaining": 0,
      "remainingFreeBoosts": 0,
      "deductedAmount": 14.0,
      "creditsDeducted": 14.0,
      "newBalance": 86.0,
      "referenceId": "boost_paid_1789332000000",
      "boostedUntil": "2026-09-21T01:40:00.000Z",
      "boostExpiresAt": "2026-09-21T01:40:00.000Z"
    }
  }
  ```

* **Success Response (200 OK — Free Plan Boost Used)**:
  ```json
  {
    "success": true,
    "message": "Reel boosted successfully.",
    "data": {
      "success": true,
      "type": "free_boost",
      "usedFreeBoost": true,
      "durationDays": 7,
      "ratePerDay": 2.0,
      "freeBoostRemaining": 2,
      "remainingFreeBoosts": 2,
      "deductedAmount": 0,
      "creditsDeducted": 0,
      "boostedUntil": "2026-09-21T01:40:00.000Z",
      "boostExpiresAt": "2026-09-21T01:40:00.000Z"
    }
  }
  ```

* **Error Responses**:
  - `400 Bad Request`:
    ```json
    { "success": false, "message": "Insufficient credits to boost reel for 7 days. Needed: 14.00 Credits (7 days × 2.00 Credits/day), Available: 5.00 Credits. Please recharge your wallet." }
    ```
  - `403 Forbidden`:
    ```json
    { "success": false, "message": "You can only boost your own reels" }
    ```
  - `404 Not Found`:
    ```json
    { "success": false, "message": "Reel not found" }
    ```

---

### 3.2 `GET /api/v1/wallet/credit-rates` — Public Credit Schedule
Returns official dynamic rate schedule for all customer actions and boosts.

* **Method**: `GET`
* **URL**: `/api/v1/wallet/credit-rates`
* **Auth**: Public (No auth required)
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Official vendor credit rate schedule loaded.",
    "data": {
      "rates": [
        {
          "action": "Verified WhatsApp Lead",
          "rate": "2.50 Credits",
          "description": "Charged when a customer sends an inbound message to your connected Meta WhatsApp Business number (includes 24-hour deduplication protection)",
          "category": "WhatsApp",
          "badge": "ACTION LEAD"
        },
        {
          "action": "Connected Exotel Voice Call",
          "rate": "2.50 Credits",
          "description": "Charged ONLY when a phone call connects between buyer and vendor for >= 10 seconds via Exotel (0 if busy, missed, or failed)",
          "category": "Telephony",
          "badge": "ACTION LEAD"
        },
        {
          "action": "Reel Feed Feature Boost",
          "rate": "Free / 2.00 Credits/day",
          "rateValue": 2.0,
          "description": "Plan-included free boosts (Starter: 1, Growth: 3, Business: 5) are consumed first. Additional boost duration costs 2.00 Credits per day",
          "category": "Promotion",
          "badge": "BOOST"
        },
        {
          "action": "Catalog Product & Service Listings",
          "rate": "0.00 Credits (FREE)",
          "description": "Unlimited catalog products and service offerings showcased on your verified store profile with zero listing fees",
          "category": "Catalog",
          "badge": "FREE"
        }
      ],
      "rawRates": {
        "whatsapp": 2.5,
        "callConnected": 2.5,
        "reelBoost1Day": 2.0,
        "reelBoostAdditional": 2.0,
        "uniqueView": 0.2
      },
      "boostRate": 2.0,
      "whatsappRate": 2.5,
      "callRate": 2.5
    }
  }
  ```

---

### 3.3 `GET /api/v1/admin/credit-rates` & `POST /api/v1/admin/credit-rates` — Admin Rate Configuration
Allows administrators to read and dynamically modify action credit rates.

* **GET `/api/v1/admin/credit-rates`**:
  * **Auth**: Bearer JWT (Admin role)
  * **Response**: Returns key-value object of configured credit costs.
* **POST `/api/v1/admin/credit-rates`**:
  * **Auth**: Bearer JWT (Admin role)
  * **Request Body**:
    ```json
    {
      "rates": {
        "uniqueView": 0.20,
        "whatsapp": 2.50,
        "callConnected": 2.50,
        "reelBoost1Day": 2.00,
        "reelBoostAdditional": 2.00,
        "orderRequest": 5.00
      }
    }
    ```
  * **Side Effects**:
    1. Updates MongoDB `AppSettings` document `{ key: 'credit_rates' }`.
    2. Syncs `reelBoost1Day` and `reelBoostAdditional`.
    3. Clears in-memory caches in `actionChargeService` and `vendorController`.
    4. Emits `admin:update` and `credit_rates:updated` WebSockets to connected clients.

---

## 4. Direct CDN Streaming Upload Architecture (Approach 1)

To prevent `HTTP 413 (Payload Too Large)` when uploading high-resolution (4K / 60fps) reels up to 50MB–100MB, BizReels uses **Direct Client-to-CDN Streaming**:

### 4.1 Flow Diagram

```
Browser / Mobile Client              Cloudinary / S3 CDN                 BizReels Node.js API
         │                                    │                                    │
         │── 1. Select Video/Image File ──────│                                    │
         │   (e.g., 45MB MP4)                 │                                    │
         │                                    │                                    │
         │── 2. Direct POST to CDN API ──────>│                                    │
         │   (Progress bar tracked in UI)     │                                    │
         │<── 3. Return Secure CDN URL ───────│                                    │
         │   https://res.cloudinary.com/...   │                                    │
         │                                    │                                    │
         │── 4. POST /api/v1/reels ───────────────────────────────────────────────>│
         │   Payload: { videoUrl: "https://...", caption: "...", ... }             │
         │   (Payload size: < 1 Kilobyte)                                          │
         │<── 5. 201 Created ──────────────────────────────────────────────────────│
```

### 4.2 Benefits
- **Zero Node.js Buffer Overhead**: Node.js never parses multi-megabyte `multipart/form-data` chunks in memory.
- **Immunity to 413 Errors**: Reverse proxies (Nginx, Vercel, Render) with strict 10MB/50MB body caps are completely bypassed during the media binary stream.
- **Instant Response Times**: The Node.js database write completes in < 50ms.

---

## 5. Database Schema & State Fields

### 5.1 `Reel` Document Boost Fields
When a reel is boosted, the controller atomically updates **both camelCase and snake_case properties** for universal backward and forward compatibility:

```javascript
{
  // Universal Discovery Flags
  isBoosted: true,
  is_boosted: true,
  boost_status: 'active',

  // Expiration Timestamps
  boostExpiresAt: ISODate("2026-09-21T01:40:00.000Z"),
  boosted_until: ISODate("2026-09-21T01:40:00.000Z"),

  // Metadata
  boostDurationDays: 7,
  boostActivatedAt: ISODate("2026-09-14T01:40:00.000Z")
}
```

### 5.2 Discovery Query Index
Feed recommendations and city-level search queries sort boosted reels first:
```javascript
Reel.find({ status: 'published', isDeleted: { $ne: true } })
  .sort({
    isBoosted: -1,        // Boosted reels pinned at the very top
    boostExpiresAt: -1,   // Active boost expiry recency
    createdAt: -1         // Newest organic content
  });
```

### 5.3 Financial Ledger Audit (`WalletTransactionV2`)
Every paid boost creates an immutable audit trail entry:
```javascript
{
  user_id: "vendor_object_id",
  transaction_type: "reel_boost",
  credit_debit: "debit",
  amount: 14.00,
  previous_balance: 100.00,
  updated_balance: 86.00,
  reference_id: "boost_paid_1789332000000",
  admin_remarks: "Reel Boost for 7 days (-14.00 Credits at 2.00 Credits/day)",
  meta: {
    reel_id: "reel_object_id",
    duration_days: 7,
    rate_per_day: 2.00,
    free_boost_used: false
  }
}
```

---

## 6. Frontend Integration Guidelines

### 6.1 Modal Component (`ReelBoostModal.jsx`)
* **Preset Durations**:
  - `1 Day`
  - `3 Days`
  - `7 Days (Recommended)`
  - `14 Days`
  - `30 Days`
* **Custom Days Selector**:
  - Clicking `+ Custom Days` toggles a numeric input (`min="1" max="90"`).
  - Dynamically computes and displays `activeDuration × ratePerDay`.
* **Insufficient Credits Alert**:
  - If `walletCredits < totalCost` and `freeReelBoosts === 0`, disables the CTA and renders deep-links to `/pricing` and `/vendor/wallet?tab=plans`.

### 6.2 Cache Invalidation Tags
When `boostReel` mutation succeeds, the following RTK Query tags must be invalidated:
```javascript
invalidatesTags: ['Reels', 'VendorDashboard', 'Wallet']
```
This triggers an instant re-render of vendor reels list, wallet balance, and metrics without page refresh.

---

## 7. Developer FAQs & Troubleshooting

### Q: Why did the rate show 10 credits previously?
> In legacy code, fallback values in `vendorController.js` and `AdminCreditRatesPage.jsx` had a static `10` when `reelBoost1Day` was undefined in the DB. This has been updated to `2` across all fallbacks, and the DB setting explicitly stores `reelBoost1Day: 2` and `reelBoostAdditional: 2`.

### Q: How can an admin change the reel boost rate to ₹X or Y credits?
> 1. Log in to the Admin Panel.
> 2. Navigate to **App Settings > Credit Rates** (`/admin/credit-rates`).
> 3. Update the **Reel Boost (1 Day)** field to any desired credit value (e.g., `3.00`).
> 4. Click **Save Settings**. The update broadcasts via WebSockets and invalidates server memory cache instantly. All vendor modals immediately compute with the new rate.

### Q: Can a vendor boost for 1 day?
> Yes. Both the `1 Day` preset pill and custom numeric input (`value="1"`) are available in `ReelBoostModal.jsx`.
