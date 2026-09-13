# Vendor Subscription, Wallet & WhatsApp/Exotel Action Charging Architecture

> **Document Status**: Production Specification (v2.0)  
> **Target Audience**: Backend Engineers, Frontend Engineers, DevOps, Mobile Developers  
> **Source Code Locations**:
> - Backend Services: `backend/src/services/wallet.service.js`, `action-charge.service.js`, `whatsapp-meta.service.js`, `call.service.js`, `subscription-admin.service.js`
> - Models: `backend/src/models/WhatsAppLead.js`, `WhatsAppMessage.js`, `WhatsAppTrackingContext.js`, `CallRecord.js`, `ActionDedup.js`, `Admin.js` (SubscriptionPlan)
> - Frontend: `frontend/src/pages/vendor/wallet/WhatsAppLeadCrmTab.jsx`, `frontend/src/pages/home/Pricing.jsx`, `frontend/src/pages/admin/subscriptions/`

---

## 1. Executive Summary & Core Rules

1. **Vendor-Only Subscriptions**:
   * Subscriptions are strictly for **Vendors** (not Customers or Creators).
   * Operates on an additive **Pay-and-Recharge non-expiring credit model**.
2. **Cumulative Top-Ups**:
   * Purchasing a new plan does NOT cancel previous plans.
   * Credits (`wallet_credits`, `walletBalance`) and `free_reel_boosts` increment cumulatively upon each purchase.
3. **No Credit Expiration**:
   * Vendor recharge plans are exempt from hourly expiration crons. Credits remain valid until depleted by real customer interactions.
4. **Measurable Action Drawdown**:
   * Every measurable buyer action (Unique Views, Phone Calls, WhatsApp Leads, Inquiries) atomically consumes credits from the vendor's wallet balance.
5. **Strict 24-Hour Deduplication**:
   * Repeated interactions from the same customer within 24 hours are free of charge.

---

## 2. Approved Pricing Plans & Action Rates

### Recharge Packs

| Plan Title | Price (INR) | Included Credits | Free Reel Boosts | Badges & Benefits |
| :--- | :--- | :--- | :--- | :--- |
| **Starter** | ₹499 | **599 Credits** | 1 Boost | Non-expiring balance, standard local placement |
| **Growth** | ₹1,199 | **1,599 Credits** | 3 Boosts | Verified Gold Merchant Badge, priority routing |
| **Business** | ₹2,199 | **2,999 Credits** | 5 Boosts | VIP Gold Badge, top-tier feed placement |

### Action Consumption Rates

| Customer Action | Deduction | Deduplication Window | Deduction Trigger |
| :--- | :--- | :--- | :--- |
| **Meta WhatsApp Inbound Lead** | **2.50 Credits** | 24 Hours | Meta webhook receives incoming message |
| **Exotel Phone Call Connected** | **2.50 Credits** | 24 Hours | Exotel webhook receives call status `completed` |
| **Unique Listing / Reel View** | **0.20 Credits** | 24 Hours | Logged on unique IP/user reel view |
| **Chat Message Inquiry** | **0.10 Credits** | 24 Hours | Customer initiates direct chat thread |
| **Order / Deal Request** | **5.00 Credits** | 24 Hours | Customer submits order quotation request |
| **Additional Reel Boost Token** | **2.00 Credits** | Per Boost | Vendor boosts reel after free tokens are used |

---

## 3. Meta WhatsApp Cloud API & Embedded Signup

### Flow Diagram

```
Vendor Portal                   Meta Popup (FB SDK)              BizReels Backend                  Meta Cloud API
     │                                   │                              │                               │
     │── 1. Click "Connect WhatsApp" ───>│                              │                               │
     │                                   │── 2. Request phone number ──>│                               │
     │                                   │<── 3. Meta sends OTP (SMS) ──│                               │
     │                                   │                              │                               │
     │<── 4. Vendor enters Meta OTP ─────│                              │                               │
     │                                   │                              │                               │
     │<── 5. Returns { code, waba_id } ──│                              │                               │
     │                                                                  │                               │
     │────── 6. POST /api/v1/whatsapp/vendor/embedded-signup-callback ─>│                               │
     │                                                                  │── 7. Exchange code for Token ─>│
     │                                                                  │<── 8. Return System Token ────│
     │                                                                  │                               │
     │                                                                  │── 9. Subscribe WABA Webhook ──>│
     │                                                                  │<── 10. Webhook Registered ────│
     │                                                                  │                               │
     │<───── 11. 200 OK (Status: Connected) ───────────────────────────│                               │
```

### Inbound Message Charging Mechanics
1. **Context Registration**: When a buyer clicks WhatsApp on a listing or reel, frontend calls `POST /api/v1/whatsapp/tracking-context` storing the customer phone and target vendor.
2. **Meta Webhook Arrival**: Meta sends payload to `POST /api/v1/whatsapp/webhook`.
3. **Signature Validation**: Backend computes HMAC-SHA256 of the raw payload using `META_APP_SECRET` and matches `X-Hub-Signature-256`.
4. **24-Hour Dedup Check**: Query `ActionDedup` for `action_type: 'whatsapp'` within `dedup_expires_at > new Date()`. If match exists, record message as duplicate with zero charge.
5. **Atomic Balance Decrement**:
   ```javascript
   const updatedWallet = await Wallet.findOneAndUpdate(
     { user_id: vendorId, credits: { $gte: 2.50 }, is_frozen: { $ne: true } },
     { $inc: { credits: -2.50, total_spent: 2.50 }, $set: { updated_at: new Date() } },
     { new: true }
   );
   ```
6. **Lead Record**: Create `WhatsAppLead` with `billed: true`, `charge_amount: 2.50`. If balance was insufficient, `billed: false` with low-balance alert.

---

## 4. Exotel Telephony Call Integration

### Flow Diagram

```
Customer Browser             BizReels Backend                     Exotel API                     Vendor Phone
     │                              │                                  │                              │
     │── 1. Click-to-Call Modal ───>│                                  │                              │
     │                              │── 2. POST /v1/Accounts/Calls ───>│                              │
     │                              │   (From: Customer, To: Vendor)   │                              │
     │                              │<── 3. Call SID returned ─────────│                              │
     │                              │                                  │── 4. Dials Vendor Phone ────>│
     │<── 5. Call Initialized ──────│                                  │                              │
     │                              │                                  │                              │
     │                              │<── 6. Webhook: Call Completed ───│                              │
     │                              │   (Status: completed, Dur > 0)   │                              │
     │                              │                                  │                              │
     │                              │── 7. Atomic 2.50 Credit Deduct ──│                              │
```

* **No Charge for Missed / Busy Calls**: Credits are ONLY deducted if the call status received from Exotel is `completed` with duration > 0.
* **Webhook Endpoint**: `POST /api/v1/webhooks/exotel/call`.

---

## 5. Environment Configuration Reference

### Backend (`backend/.env`)

```env
# Meta WhatsApp Cloud API
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_WA_VERIFY_TOKEN=bizreels_whatsapp_verify_2026
META_WA_ACCESS_TOKEN=your_system_user_permanent_token
META_WA_API_VERSION=v20.0
META_WA_PHONE_NUMBER_ID=your_phone_number_id
META_WA_WABA_ID=your_waba_id
META_WA_WEBHOOK_MODE=live
WHATSAPP_PROVIDER=meta

# Exotel Telephony
EXOTEL_SID=your_exotel_account_sid
EXOTEL_API_KEY=your_exotel_api_key
EXOTEL_API_TOKEN=your_exotel_api_token
EXOTEL_PHONE=0XXXXXXXXXX
APP_URL=https://api.yourdomain.com
```

### Frontend (`frontend/.env`)

```env
VITE_META_APP_ID=your_meta_app_id
VITE_META_CONFIG_ID=your_meta_embedded_signup_config_id
```

---

## 6. Real-Time Admin Synchronization Architecture

When an administrator edits subscription tiers or credit allocations in `/admin/subscriptions`:

```
Admin Dashboard (CreatePlanModal)
              │
              ▼
PATCH /api/v1/admin/subscription/plans/:id
              │
              ├─► 1. MongoDB `SubscriptionPlan` document updated
              │
              ├─► 2. Redis/Memory Cache Invalidation:
              │       - subscription:plans:all
              │       - subscription:plans:vendor
              │       - subscription:plans:creator
              │
              └─► 3. WebSockets Broadcast:
                      emitToAdmin('admin:update', { tags: ['SubscriptionPlans'] })
                      emitToRole('vendor', 'subscription:updated')
                      emitToRole('creator', 'subscription:updated')
```

### Frontend Subscribers
All frontend portals listen to the WebSocket and trigger RTK Query `refetch()`:
* **Public Pricing Page**: `Pricing.jsx` (`useGetSubscriptionPlansQuery({ role: 'vendor' })`)
* **Vendor Wallet**: `SubscriptionTab.jsx`
* **Vendor Listing Modals**: `SubscriptionModal.jsx`
* **Admin Plans List**: `PlansList.jsx`

This guarantees zero stale data without needing hard page reloads.
