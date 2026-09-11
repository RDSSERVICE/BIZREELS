# 📊 Complete Architecture & Flow Report: Vendor Offers Section

---

## 1. Overview & Architecture

The **Offer System** in BizReels allows vendors to create, manage, distribute, and track promotional deals, coupon codes, and discounts. Offers integrate across the vendor panel, reels engine, real-time push notifications, customer marketplace, and product detail pages.

```
+-------------------------------------------------------------------------+
|                              VENDOR PANEL                               |
|                                                                         |
|  [Listings Page: Offers Tab]            [Reels Wizard: Promo Offers]    |
|        (OffersTab.jsx)                   (CreateReelWizardModal.jsx)    |
|               │                                       │                 |
|               ▼                                       ▼                 |
|  [Offer Creation / Edit Modal] <──────────────────────┘                 |
|       (OfferFormModal.jsx)                                              |
+-------------------------------------------------------------------------+
                                    │
                                    ▼ (RTK Query)
+-------------------------------------------------------------------------+
|                           REDUX API LAYER                               |
|                     (features/vendor/vendorApi.js)                      |
|                                                                         |
|  • getVendorOffers        • createVendorOffer     • updateVendorOffer   |
|  • deleteVendorOffer      • duplicateVendorOffer  • toggleOfferStatus   |
+-------------------------------------------------------------------------+
                                    │
                                    ▼ (HTTP / REST)
+-------------------------------------------------------------------------+
|                           BACKEND CONTROLLERS                           |
|                      (backend/src/routes/vendor.routes.js)              |
|                                                                         |
|  GET    /api/v1/vendors/me/offers                                       |
|  POST   /api/v1/vendors/me/offers (Triggers parallel customer notify)   |
|  PUT    /api/v1/vendors/me/offers/:offerId                              |
|  DELETE /api/v1/vendors/me/offers/:offerId                              |
|  POST   /api/v1/vendors/me/offers/:offerId/duplicate                    |
|  PATCH  /api/v1/vendors/me/offers/:offerId/status                       |
+-------------------------------------------------------------------------+
             │                                              │
             ▼                                              ▼
+-------------------------+             +----------------------------------+
|      DATABASE STORAGE   |             |   REAL-TIME CUSTOMER BROADCAST   |
|                         |             |                                  |
| User.vendorProfile      |             |  notificationService.create()   |
|     .offers[]           |             |  • Real-time in-app notification |
|                         |             |  • Linked to /notifications      |
+-------------------------+             +----------------------------------+
                                                        │
                                                        ▼
+--------------------------------------------------------------------------+
|                           CUSTOMER TOUCHPOINTS                           |
|                                                                          |
| 1. Search Filter: "With Offers" (SearchListingsPage.jsx)                 |
| 2. Listing Detail: Active Deal + Live Countdown (ListingDetailPage.jsx)  |
| 3. Customer Home: Active Offers Banner (ActiveOffersPanel.jsx)           |
| 4. Reel Viewer: Instant Promo Deal Bar (ReelsTab.jsx)                    |
+--------------------------------------------------------------------------+
```

---

## 2. Frontend Modules & User Interaction

### 2.1 File Map
- **Offers Tab Component**: `frontend/src/pages/vendor/listings/OffersTab.jsx`
- **Offer Form & Modal**: `frontend/src/pages/vendor/listings/OfferFormModal.jsx`
- **Main Listings Container**: `frontend/src/pages/vendor/listings/VendorListingsPage.jsx`
- **Reel Promotion Wizard**: `frontend/src/pages/vendor/reels/CreateReelWizardModal.jsx`
- **Vendor API Slice**: `frontend/src/features/vendor/vendorApi.js`

---

### 2.2 Offer Types Supported
In `OfferFormModal.jsx`, vendors can configure 7 distinct offer categories:

1. **Percentage Discount (`percentage`)**: e.g., `20% OFF`
2. **Flat Amount Discount (`fixed`)**: e.g., `₹500 OFF`
3. **Buy One Get One (`bogo`)**: BOGO deal configurations
4. **Bundle Offer (`bundle`)**: Multi-item bundle promotions
5. **Festival Offer (`festival`)**: Seasonal/holiday campaigns
6. **Flash Sale (`flash_sale`)**: Urgent high-discount campaigns
7. **Limited Time Offer (`limited_time`)**: Time-capped promotions

---

### 2.3 Offer Form Parameters & Controls
- **Title & Description**: Headline and promotional description.
- **Discount Configuration**:
  - Discount type (`percentage` vs `fixed`)
  - Discount numeric value
- **Coupon Code Generator**:
  - Input field with an instant generator (⚡) that creates unique codes like `BIZ4K9A2`.
- **Validity Window**:
  - `startDate` (with `datetime-local` input)
  - `endDate` (validated to ensure it is in the future and after start date)
- **Spend & Cap Constraints**:
  - `minOrderAmount`: Minimum purchase amount required to use the discount.
  - `maxDiscountLimit`: Maximum discount cap for percentage offers.
  - `usageLimit`: Total redemptions allowed across all users.
- **Catalog Targeting**:
  - Multi-select pill selector for specific **Products**
  - Multi-select pill selector for specific **Services**
- **Priority (0–10)**: Priority weight for display ordering.
- **Banner Image URL**: Optional custom banner graphic.

---

### 2.4 Offer Card Lifecycle Controls (`OffersTab.jsx`)
Each card in the vendor panel provides:
- **Status Indicator**: `Active`, `Scheduled`, `Draft`, `Expired`, `Disabled`.
- **Performance Metrics**:
  - 👁️ **Views**: `analytics.viewsCount`
  - 👥 **Used**: `usedCount`
  - 🛒 **Sales Generated**: `totalSales`
- **Action Buttons**:
  - **Edit** (`FiEdit2`): Pre-loads offer data into modal for updates.
  - **Pause / Activate** (`FiPause` / `FiPlay`): Instantly toggles status.
  - **Duplicate** (`FiCopy`): Clones the offer with a `(Copy)` suffix.
  - **Delete** (`FiTrash2`): Triggers a confirmation dialog before permanent deletion.

---

## 3. Backend Implementation & API Reference

### 3.1 REST API Routes (`backend/src/routes/vendor.routes.js`)

#### 1. `GET /api/v1/vendors/me/offers`
- **Auth**: Required (`requireAuth`)
- **Action**: Reads and returns `user.vendorProfile.offers` array.

#### 2. `POST /api/v1/vendors/me/offers`
- **Auth**: Required (`requireAuth`)
- **Action**:
  1. Validates required fields (`title`, `validTill`).
  2. Generates an `ObjectId` for the offer.
  3. Prepend (`unshift`) the new offer into `user.vendorProfile.offers`.
  4. Saves the user document.
  5. **Auto-Broadcast**: Queries all customer users (`User.find({ roles: 'customer' })`) and sends push notifications concurrently with coupon details, discount percentage, and expiry date.

#### 3. `PUT /api/v1/vendors/me/offers/:offerId`
- **Auth**: Required (`requireAuth`)
- **Action**: Finds offer by ID in `user.vendorProfile.offers`, applies updates, updates `updated_at` timestamp, and saves.

#### 4. `DELETE /api/v1/vendors/me/offers/:offerId`
- **Auth**: Required (`requireAuth`)
- **Action**: Filters out the offer by ID and persists changes.

#### 5. `POST /api/v1/vendors/me/offers/:offerId/duplicate`
- **Auth**: Required (`requireAuth`)
- **Action**: Clones existing offer with new ID, appends `(Copy)` to title, marks as inactive (`is_active: false`), and saves.

#### 6. `PATCH /api/v1/vendors/me/offers/:offerId/status`
- **Auth**: Required (`requireAuth`)
- **Action**: Updates `is_active` boolean based on status string (`active` vs `disabled`).

---

## 4. Customer Integration & Promotion Channels

### 4.1 Search & Discovery Filter
- **File**: `frontend/src/pages/customer/search/SearchListingsPage.jsx`
- **Filter**: `🔥 With Offers` checkbox queries backend `has_offer=true` to filter products/services with promotional pricing.

### 4.2 Live Countdown Timer on Product/Service Pages
- **Files**: `ListingDetailPage.jsx` & `ListingDetailModal.jsx`
- **Component**: `<OfferCountdown validTill={...} />` shows real-time `days`, `hours`, `minutes`, and `seconds` remaining until expiry.

### 4.3 Interactive Customer Home Carousel
- **File**: `frontend/src/components/offers/ActiveOffersPanel.jsx`
- **Features**: Real-time websocket updates (`offer:activated`, `offer:expired`), copyable coupon code with visual feedback (`FiCheck`), and automatic expiration handling.

### 4.4 Video Reels Promotion Integration
- **File**: `frontend/src/pages/vendor/reels/VendorReelsPage.jsx` & `CreateReelWizardModal.jsx`
- **Features**: When posting reels with purpose "Offer / Discount", vendors attach the dynamic offer directly, rendering a promo banner on the video stream.

---

## 5. Feature Checklist Matrix

| Capability | Vendor Panel | Customer View | Admin Console |
|---|:---:|:---:|:---:|
| Dynamic Percentage & Flat Discounts | ✅ | ✅ | ✅ |
| BOGO & Bundle Promotions | ✅ | ✅ | ✅ |
| Auto-Generated Coupon Codes | ✅ | ✅ | ✅ |
| Specific Product/Service Linking | ✅ | ✅ | ✅ |
| Minimum Spend & Max Cap Rules | ✅ | ✅ | ✅ |
| Real-time Push Notification to Customers | ✅ (Automated) | ✅ (Received) | ✅ |
| Duplicate / Clone Offer | ✅ | N/A | ✅ |
| Pause / Resume Toggle | ✅ | ✅ (Instant sync) | ✅ |
| Live Countdown Timers | ✅ | ✅ | ✅ |
| Reel Video Attachment | ✅ | ✅ | ✅ |
