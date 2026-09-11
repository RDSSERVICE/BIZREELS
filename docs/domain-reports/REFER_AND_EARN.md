# 📊 Complete Architecture & Flow Report: Refer & Earn System

---

## 1. Executive Summary & Architecture Overview

The **Refer & Earn System** in BizReels is an enterprise-grade viral growth and reward engine. It allows vendors and users to invite other businesses/users to the platform using unique alphanumeric referral codes and personalized share links.

The system features **dual-sided wallet rewards**, **anti-fraud checks** (preventing self-referrals, duplicate claims, and IP abuse), **event-driven milestone eligibility** (such as first product listing or KYC approval), **real-time WebSocket notifications**, and **admin configuration controls**.

```
+-----------------------------------------------------------------------------------+
|                                 INVITATION FLOW                                   |
|                                                                                   |
|  [Vendor Panel: Refer & Earn]               [Copy Code / Native Web Share API]    |
|      (VendorReferralPage.jsx)              (https://bizreels.in/register?ref=CODE) |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
|                                REGISTRATION & CLAIM                               |
|                                                                                   |
|  [Register Page (Register.jsx)] ──► [Auth Controller / auth.service.js]           |
|                                          │                                        |
|                                          ▼                                        |
|                      [referralService.claimOnSignup(newUserId, code, ip)]         |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
|                        MULTI-LAYER FRAUD DETECTION ENGINE                         |
|                       (services/referral/referral.fraud.service.js)               |
|                                                                                   |
|  1. Self-Referral Check    : Disallows referrerId === newUserId                   |
|  2. Duplicate Check        : Enforces unique referred_user_id                     |
|  3. Rate Limiting Check    : Max referrals per day (Default: 10/day)              |
|  4. IP Abuse Prevention    : Max signups per IP address (Default: 5/day)          |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼ (If Passed)
+-----------------------------------------------------------------------------------+
|                               REFERRAL RECORD CREATION                            |
|                       (Status: 'pending' in Referral Collection)                  |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
|                          EVENT-DRIVEN MILESTONE TRIGGER                           |
|                                                                                   |
|  • Case 'registration'  : Award immediately upon signup                           |
|  • Case 'first_listing' : Triggered via listing.service.js (maybeAwardOnListing)   |
|  • Case 'kyc_approved'  : Triggered via kyc.service.js (maybeAwardOnKYC)          |
|  • Case 'first_deal'    : Triggered via deal.service.js (maybeAwardOnDealComplete)|
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
|                         DUAL-SIDED REWARD DISBURSEMENT                            |
|                      (services/referral/referral.reward.service.js)               |
|                                                                                   |
|  1. Referrer Wallet Credit : +200 Credits (walletService.earnCredits)             |
|  2. Referred User Credit   : +100 Credits (walletService.earnCredits)             |
|  3. Status Update          : 'pending' ──► 'credited'                             |
|  4. Real-Time Broadcast    : Socket events ('referral:reward_credited')           |
|  5. Push Notifications     : In-app alerts to both users                          |
+-----------------------------------------------------------------------------------+
```

---

## 2. Frontend Modules & User Interaction

### 2.1 File Map
- **Vendor Referral Page**: `frontend/src/pages/vendor/referrals/VendorReferralPage.jsx`
- **Navigation Route**: `/vendor/referrals` (registered in `frontend/src/routes/index.jsx` and `VendorLayout.jsx`)
- **Signup Page Integration**: `frontend/src/pages/auth/Register.jsx` (auto-extracts `?ref=` query param)
- **Vendor Wallet Page**: `frontend/src/pages/vendor/wallet/VendorWalletPage.jsx` (displays `referral_bonus` credits)
- **App Share Card**: `frontend/src/components/app/ReferralCard.jsx`

---

### 2.2 Vendor Referral Dashboard Features (`VendorReferralPage.jsx`)

1. **Invite Code & Link Hub**:
   - Displays 6-character unique uppercase referral code (e.g., `BIZ9X2`).
   - One-click **Copy Code** button with toast alert.
   - One-click **Copy Link** button (`https://bizreels.in/register?ref=CODE`).
   - **Native Web Share API** (`navigator.share`): Opens mobile/desktop native share sheet (WhatsApp, Telegram, SMS, Email).
2. **Dynamic Reward Explainer**:
   - Dynamically pulls live configured amounts from backend (e.g., `+200 credits` for referrer, `+100 credits` for referee).
3. **Program Status Metrics**:
   - 📊 **Total Referrals**: Total count of users who registered using the code.
   - ✅ **KYC / Listing Completed**: Count of successfully converted and credited referrals.
   - ⏳ **Pending Activation**: Count of referred users awaiting first action.
   - 💰 **Total Credits Earned**: Sum of credited referral rewards in INR.
4. **Referral Activity History Table**:
   - Columns: `Invited Name`, `Referred Phone` (masked for privacy: `98****12`), `Date Joined`, `Referrer Reward`, `Status` (`Credited` vs `Pending listing`).

---

### 2.3 User Signup Flow (`Register.jsx`)
- When a user visits an invite link (`/register?ref=BIZ9X2`), the page automatically reads the query parameter and populates the `Referral Code (Optional)` input field.
- If manually signing up, users can paste any valid vendor invite code.

---

## 3. Backend Implementation & Architecture

### 3.1 REST API Routes (`backend/src/routes/referral.routes.js`)

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/referrals/me` | `GET` | `requireAuth` | Returns referral code, share link, program summary metrics, and activity history list. |
| `/api/v1/referrals/dashboard` | `GET` | `requireAuth` | Alias for `/me` dashboard data. |
| `/api/v1/referrals/link` | `GET` | `requireAuth` | Generates shareable URL and promotional share text. |
| `/api/v1/referrals/list` | `GET` | `requireAuth` | Returns list of all users invited by the current authenticated user. |
| `/api/v1/referrals/code` | `GET` | `requireAuth` | Retrieves or lazily creates a referral code for the user. |
| `/api/v1/referrals/admin/analytics` | `GET` | `Admin` | Aggregated analytics (conversion rate, top referrers, total disbursements). |
| `/api/v1/referrals/admin/list` | `GET` | `Admin` | Paginated and filterable list of all platform referrals. |
| `/api/v1/referrals/admin/status` | `POST` | `Admin` | Manually update referral status (`credited`, `rejected`, `pending`). |
| `/api/v1/referrals/admin/config` | `GET` | `Admin` | Retrieves current platform settings for referral rewards. |
| `/api/v1/referrals/admin/config` | `POST` | `Admin` | Updates referral reward amounts, eligibility trigger, and daily caps. |

---

### 3.2 Code Generation Engine (`referral.service.js`)
- Uses cryptographically secure random values (`crypto.randomInt`) to generate unique 6-character uppercase alphanumeric codes (`CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'`).
- Checks collision in `User` collection and incorporates a fallback to 8 characters if required.
- Lazily created via `ensureCode(userId)` when a user views their dashboard or requests their link.

---

### 3.3 Multi-Layer Anti-Fraud Engine (`referral.fraud.service.js`)

Before any referral is recorded, `runAllChecks` evaluates:

| Check | Rule | Error / Log Reason |
|---|---|---|
| **Self-Referral** | `referrerId !== newUserId` | Prevents users from entering their own referral code. |
| **Duplicate Referral** | `Referral.findOne({ referred_user_id })` | A user can only be referred once across their account lifetime. |
| **Daily User Limit** | `count(referrer today) < max_referrals_per_day` | Caps maximum referrals per referrer in 24 hours (Default: 10). |
| **IP Abuse Prevention** | `count(ip today) < max_referrals_per_ip_daily` | Blocks automated bot signups from the same IP network (Default: 5). |

---

### 3.4 Reward Engine & Milestone Triggers (`referral.reward.service.js`)

The platform supports flexible, event-driven reward triggers configured in `PlatformSettings`:

1. **`registration`**: Rewards are disbursed immediately upon successful signup and OTP verification.
2. **`first_listing` (Default)**:
   - When a newly referred vendor creates their first product/service in `listing.service.js`, `maybeAwardOnListing(vendorId)` is invoked.
   - Checks if `Listing.countDocuments({ vendor }) >= 1`.
3. **`kyc_approved`**:
   - Triggered when admin approves vendor KYC documents in `kyc.service.js`.
4. **`first_deal`**:
   - Triggered upon completion of the user's first order/deal in `deal.service.js`.

---

### 3.5 Double-Entry Wallet Crediting
When milestone requirements are satisfied, `processReward()` executes:
1. **Referrer Wallet**:
   ```javascript
   await walletService.earnCredits(
     referrerId,
     config.referrer_reward, // 200 credits
     'Referral reward: invited a new vendor',
     'referral',
     `ref_reward_${referralId}`
   );
   ```
2. **Referred User Wallet**:
   ```javascript
   await walletService.earnCredits(
     referredUserId,
     config.referred_reward, // 100 credits
     'Welcome referral bonus',
     'referral',
     `ref_bonus_${referralId}`
   );
   ```
3. **Status Update**: `Referral.status` changes from `'pending'` to `'credited'`, saving `credited_at` and `trigger_event`.
4. **Real-time Notifications**:
   - Emits Socket.io events: `referral:reward_credited` and `referral:bonus_credited`.
   - Sends in-app push notifications with navigation redirect to `/wallet`.

---

## 4. Admin Management & Configuration

### 4.1 Platform Referral Settings Schema (`PlatformSettings`)

```javascript
{
  key: 'referral_config',
  value: {
    referrer_reward: 200,             // Bonus credits for the inviter
    referred_reward: 100,             // Welcome credits for the invitee
    max_referrals_per_day: 10,        // Daily cap per user
    max_referrals_per_ip_daily: 5,    // Daily cap per IP
    eligibility_event: 'first_listing',// 'registration' | 'first_listing' | 'kyc_approved' | 'first_deal'
    require_kyc: false,               // Boolean constraint
    is_active: true,                  // Global master switch
    min_days_before_reward: 0
  }
}
```

### 4.2 Admin Analytics & Leaderboard
The admin endpoint `/api/v1/referrals/admin/analytics` delivers:
- **Conversion Rate**: $\frac{\text{Credited Referrals}}{\text{Total Referrals}} \times 100\%$
- **Disbursement Totals**: Cumulative INR value of referral rewards and welcome bonuses.
- **Top 10 Referrers Leaderboard**: Ranks users by total invites and successful conversions.

---

## 5. Database Schema Reference

### 5.1 Referral Schema (`backend/src/models/Misc.js`)

```javascript
const referralSchema = new mongoose.Schema({
  referrer_id: { type: String, required: true, index: true },
  referred_user_id: { type: String, required: true, unique: true },
  referrer_name: { type: String, default: null },
  referred_name: { type: String, default: null },
  code_used: { type: String, default: null, index: true },
  status: { 
    type: String, 
    enum: ['pending', 'credited', 'rejected', 'expired'], 
    default: 'pending', 
    index: true 
  },
  reward_given: { type: Boolean, default: false },
  referrer_reward: { type: Number, default: 0 },
  referred_reward: { type: Number, default: 0 },
  credited_at: { type: String, default: null },
  trigger_event: { type: String, default: null },
  ip_address: { type: String, default: null },
  admin_remarks: { type: String, default: null },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

referralSchema.index({ referrer_id: 1, status: 1 });
referralSchema.index({ referrer_id: 1, created_at: -1 });
```

---

## 6. Complete Feature Matrix

| Feature | Capabilities |
|---|---|
| **Unique Code Generation** | 6-character uppercase alphanumeric, cryptographic randomness, collision-proof. |
| **Sharing Options** | Direct clipboard copy, customized share URL, Native Web Share API integration. |
| **Registration Capture** | Auto-extraction from URL query (`?ref=CODE`) or manual form input. |
| **Fraud Protection** | Self-referral prevention, duplicate claim prevention, user daily limits, IP rate limits. |
| **Milestone Triggers** | Registration, first product/service listing, KYC approval, first completed deal. |
| **Wallet Integration** | Double-sided credit disbursement with unique transaction idempotency keys. |
| **Real-Time Experience** | Live Socket.io alerts, in-app push notifications, privacy-masked phone numbers in history table. |
| **Admin Controls** | Live analytics, top referrers leaderboard, status management, configurable reward rules. |
