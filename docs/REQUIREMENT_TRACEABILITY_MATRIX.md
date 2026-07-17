# Requirement Traceability Matrix (RTM)
## BizReels Marketplace Platform

---

## 1. Traceability Mapping

| Req ID | Type | Description | DB Models / Indexes | Backend REST API | Frontend Screen / Component | Verification Method |
|---|---|---|---|---|---|---|
| **REQ-1.1** | Functional | Email & Google auth signup/login | `User`, `OTP`, `RefreshToken` | `POST /auth/register`<br>`POST /auth/login`<br>`POST /auth/otp/verify` | `pages/Login.jsx`<br>`pages/Register.jsx` | Integration test mock requests; valid email matching regex |
| **REQ-1.2** | Functional | Single-session role switching | `User` (`roles`, `activeRole`) | `PATCH /auth/switch-role` | `layouts/AppLayout.jsx` | Verify payload sets active role and dashboard updates layout |
| **REQ-2.1** | Functional | Geospatial proximity search | `Listing`, `User` (GeoJSON `Point` & `2dsphere` index) | `GET /listings` (using `$geoNear` radius queries) | `pages/Search.jsx`<br>`pages/Feed.jsx` | Mock longitude & latitude inputs to verify distance filter |
| **REQ-2.2** | Functional | AI copywriting description help | N/A | `POST /listings/ai-copy` | `pages/VendorDashboard.jsx` (modal trigger) | Click AI button and confirm description is populated from title |
| **REQ-3.1** | Functional | Custom requirement posting | `Requirement` (GeoJSON point, budget, deadline) | `POST /requirements` | `pages/RequirementsNew.jsx` | Verify requirement entry is saved with `status: "open"` |
| **REQ-3.2** | Functional | Local requirement bidding (quoting) | `Quote` (pricing, delivery days, pending) | `POST /requirements/quotes` | `pages/VendorDashboard.jsx` (Leads tab) | Verify quote is linked to parent requirement and vendor |
| **REQ-3.3** | Business Rule | Limit one quote per vendor per lead | Compound index `{ requirement: 1, vendor: 1 }` | `POST /requirements/quotes` | `pages/VendorDashboard.jsx` | Verify second quote request returns index violation error |
| **REQ-4.1** | Functional | Wallet Recharge ledger | `User` (`walletBalance`), `WalletTransaction` | `POST /wallet/recharge` | `pages/Profile.jsx` | Check ledger rows write balanced credit entries |
| **REQ-4.2** | Business Rule | Escrow Balance locking session | `User`, `Quote`, `WalletTransaction` | `PATCH /requirements/quotes/:quoteId` | `pages/VendorDashboard.jsx` | Trigger accept bid and check database session rolls back on low wallet |
| **REQ-5.1** | Functional | Upload video reels | `Reel` (creator, Cloudinary video/thumbnail links) | `POST /reels` | `pages/ReelsUpload.jsx` | Verify file uploads to Cloudinary and saves database path |
| **REQ-5.2** | Functional | View geolocated reels feed | `Reel` (`isDraft`, `isDeleted` checks) | `GET /reels` | `pages/ReelsFeed.jsx` | Scroll feed, verify likes increment and comments render |
| **REQ-5.3** | Functional | Visibility boosting credits | `User` (`subscription.boostCredits`), `Reel` (`isBoosted`) | `POST /reels/boost` | `pages/ReelsUpload.jsx` | Verify boost credit decreases and `isBoosted` sets true |
| **REQ-6.1** | Functional | Campaign Hiring workspace | `HireRequest` (vendor, creator, budget, status) | `POST /hires`<br>`PATCH /hires/:id` | `pages/CreatorDashboard.jsx`<br>`pages/VendorDashboard.jsx` | Verify funds lock on Creator acceptance and release on Completion |
| **REQ-7.1** | Non-Functional | Account locking on brute logins | `User` (`loginAttempts`, `lockUntil`) | `POST /auth/login` | `pages/Login.jsx` | Mock 5 failed requests and verify login returns locked state |
| **REQ-7.2** | Non-Functional | Soft delete protection | `isDeleted` and `deletedAt` timestamps | `DELETE /listings/:id`<br>`DELETE /reels/:id` | `pages/VendorDashboard.jsx` | Verify query filters exclude items with `isDeleted: true` |

---

## 2. Matrix Verification Summary
The traceability matrix spans 16 key requirements linking the MERN MVC layer. The verification methods combine automated API integration mocks with manual testing walkthroughs.
