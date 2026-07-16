# AI Context Map (Master Project Memory)

This document is the primary entry point for AI agents. It summarizes the repository purpose, stack, current state, database collections, routing, business logic, integrations, and coding conventions.

---

## 1. Project Core & Technology Stack

* **Purpose**: BizReels is a local social commerce application tailored for the Indian marketplace. It connects buyers with nearby shops/creators, supporting video reels discovery, requirement posting, direct real-time chat, bargaining negotiations, KYC Trust badges, and wallets.
* **Architecture**: Unified Monolithic MERN Stack.
  * **Frontend**: React 19 SPA compiled with Vite, styled with Tailwind CSS and customized Shadcn UI wrappers. Outfit (headings) and Manrope (body) typography.
  * **Backend**: Node.js & Express API, running Socket.IO for real-time bidirectional communication, and `node-cron` schedules.
  * **Database**: MongoDB using Mongoose schemas.
  * **Key Packages**: `socket.io`, `mongoose`, `razorpay`, `cloudinary`, `joi`, `winston`, `axios`, `sonner`, `@radix-ui/*`.

---

## 2. Codebase Directory Map

```
ecommerce-app/
├── backend/            # Express REST & Socket.IO server (Port 8001)
│   ├── src/
│   │   ├── config/     # db connection, index.js config loader
│   │   ├── middleware/ # auth.middleware (JWT), role.middleware (role checking)
│   │   ├── models/     # 22 Mongoose Schemas (Category, User, Listing, Deal...)
│   │   ├── routes/     # Versioned endpoints (v1 prefixes mapped in routes/index.js)
│   │   ├── services/   # Business logic layers (ai, payments, contact reveal...)
│   │   └── utils/      # rateLimit, ApiError wrappers, logger config
│   └── server.js       # Node entry script launching HTTP & WebSockets
│
└── frontend/           # React 19 Client Web Application (Port 3000)
    ├── src/
    │   ├── components/ # App widgets (PhoneScreen, BottomNav, ReelItem...)
    │   ├── context/    # AuthContext (user session & Socket event routing)
    │   ├── lib/        # api.js client, socket.js connection, i18n locales
    │   ├── pages/      # Route pages (Dashboard, Onboarding, ListingForm...)
    │   └── App.js      # App navigation and routes index mapper
```

---

## 3. Database Collection Schema Registry

All models map to lowercase, snake_case collection names inside MongoDB:

| Collection Name | Model Class | Key Properties | Indexes / Constraints |
| :--- | :--- | :--- | :--- |
| **`users`** | `User` | `phone`, `name`, `roles`, `kyc_status`, `is_active`, `trust_score` | `{ is_deleted: 1 }` |
| **`listings`** | `Listing` | `vendor_id`, `type`, `title`, `price`, `images`, `reel`, `location` | `{ 'location.geo': '2dsphere' }`, Text index on title/desc |
| **`categories`** | `Category` | `name`, `slug`, `parent_id`, `sort_order`, `is_active` | `{ slug: 1 }` (unique) |
| **`chat_threads`**| `ChatThread` | `participants`, `thread_type`, `context_id`, `unread_count` | `{ participants: 1, context_id: 1, thread_type: 1 }` |
| **`messages`** | `ChatMessage` | `thread_id`, `sender_id`, `receiver_id`, `type`, `text`, `media` | `{ thread_id: 1, _id: -1 }` |
| **`deals`** | `Deal` | `thread_id`, `buyer_id`, `seller_id`, `current_offer`, `status` | `{ thread_id: 1 }`, enum statuses |
| **`proposals`** | `Proposal` | `requirement_id`, `vendor_id`, `message`, `quoted_price`, `status` | `{ requirement_id: 1 }` |
| **`requirements`**| `Requirement` | `customer_id`, `title`, `budget_max`, `location.geo`, `status` | `{ 'location.geo': '2dsphere' }`, Text index |
| **`follows`** | `Follow` | `follower_id`, `following_id` | Unique compound: `{ follower_id: 1, following_id: 1 }` |
| **`interactions`**| `Interaction` | `user_id`, `listing_id`, `type` (like, save) | Unique compound: `{ user_id: 1, listing_id: 1, type: 1 }` |
| **`otp_requests`**| `OtpRequest` | `phone`, `otp_hash`, `verified`, `expires_at` | TTL Index on `expires_at` |
| **`refresh_tokens`**| `RefreshToken` | `user_id`, `token_hash`, `revoked`, `expires_at` | TTL Index on `expires_at` |
| **`reviews`** | `Review` | `reviewer_id`, `target_id`, `rating`, `comment`, `reply` | `{ target_type: 1, target_id: 1, _id: -1 }` |
| **`notifications`**| `Notification`| `user_id`, `type`, `title`, `body`, `action_url`, `is_read` | `{ user_id: 1, _id: -1 }` |
| **`wallets`** | `Wallet` | `user_id`, `credits`, `balance_inr_paise`, `is_frozen` | `{ user_id: 1 }` (unique) |
| **`payments`** | `Payment` | `user_id`, `purpose`, `amount_paise`, `razorpay_order_id`, `status` | `{ razorpay_order_id: 1 }` (unique) |
| **`subscriptions`**| `Subscription`| `user_id`, `plan` (monthly/yearly), `status`, `expires_at` | `{ user_id: 1 }` |
| **`kyc_documents`**| `KycDocument` | `user_id`, `doc_type`, `doc_number`, `doc_url`, `status` | `{ user_id: 1 }`, `{ status: 1 }` |

---

## 4. Key Security & Business Logic checkpoints

* **Scraper Protection (Phone reveals)**: Phone numbers are masked. Access is restricted to 5 reveals/day, bypassed if:
  * Active Chat Thread exists.
  * Active Deal negotiation exists.
  * Customer has an active Pro subscription.
  * Customer spends 5 credits to reveal target contact.
* **Atomic KYC Trust+ Payouts**: Awards profile completion bonuses exactly once using atomic updates:
  ```javascript
  User.findOneAndUpdate(
    { _id, has_received_profile_complete_bonus: { $ne: true } },
    { $set: { has_received_profile_complete_bonus: true }, $inc: { trust_score: 15 } }
  )
  ```
* **Deal Bargaining Rules**: Offer prices progress through `negotiating` -> `accepted` | `rejected` | `expired` | `cancelled` -> `completed`. Accepting locks listings. Deal completions utilize database locks to prevent race conditions during payout transfers.

---

## 5. Third-Party Integrations

* **Google Gemini API**: Implements structured JSON prompts for category guessing, text improvements, matching demands to nearby vendors, and chat negotiator assistance. Calls are daily-capped per user.
* **Razorpay Gateway**: Backend signs order IDs at `/payments/order`. Frontend mounts SDK widget. Verification at `/payments/verify` uses SHA256 HMAC hashes. Webhook endpoint parses raw buffer buffers into `req.rawBody` for webhook validations.
* **MSG91 (SMS API)**: Routes phone verification OTPs. Sandbox stub active in development mode (`MSG91_DEV_MODE=true`).
* **Cloudinary**: Frontend requests signed parameters via `/media/sign` and uploads images/videos directly to Cloudinary buckets, bypassing backend routers.
* **FCM (Firebase Cloud Messaging)**: Delivers backend push alerts to active device registration tokens.

---

## 6. Coding & UI Guidelines

* **Platform constraints**: Written in vanilla React JS (utilizing `.js` files, not `.tsx`). Form elements and texts must be left-aligned.
* **Styling Tokens**: Custom dark theme backdrop colors (#000000, #0A0A0A, #121212) with subtle borders (`border-white/10`). Purple-Pink-Orange gradient accents only for primary buttons, tab indicators, or profile highlights.
* **Viewport**: Mobile-first canvas layout, centered on desktop using `<PhoneScreen>` layout shell limits (`max-w-md mx-auto`).
* **Micro-animations**: Targeted transition targets (e.g. `transition-transform`). Basic spinner indicators replaced by skeleton pulses (`animate-pulse`).
* **Accessibility**: Always add `data-testid` properties to buttons, links, inputs, and form controls (e.g., `data-testid="login-submit-button"`).

---

## 7. Developer Feature-Release Flow

Whenever code updates are introduced, developers must run the following routine before closing task issues:
1. **Build Verification**: Confirm clean builds (`npm run build` in frontend) and passing test blocks (`npm test` in backend).
2. **Docs update**: Revise impacted `/docs` markdown files (e.g. update `API_REFERENCE.md` if endpoint definitions changed).
3. **Change tracking**: Document releases under `docs/CHANGELOG.md`.
4. **Context refresh**: Synchronize modifications inside this `AI_CONTEXT.md` file to keep future agents aligned.
