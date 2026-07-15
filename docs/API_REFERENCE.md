# API Reference

All REST API endpoints are prefix-routed under `/api/v1`. Access tokens must be sent via the standard HTTP header: `Authorization: Bearer <JWT_ACCESS_TOKEN>`.

---

## 1. Authentication (`/auth`)

* `POST /auth/otp/send`  
  Triggers a 6-digit SMS OTP code (MSG91). Rate-limited to 3 requests per phone per 10 minutes.  
  *Payload*: `{ "phone": "10-digit-string" }`
* `POST /auth/otp/verify`  
  Verifies OTP, creates or updates a User record, and returns tokens.  
  *Payload*: `{ "phone": "string", "otp": "6-digit-string", "name": "optional", "roles": ["customer"], "referral_code": "optional" }`  
  *Response*: `{ "access_token": "jwt", "refresh_token": "jwt", "user": { ... } }`
* `POST /auth/refresh`  
  Rotates expired access tokens. Requires a valid refresh token.  
  *Payload*: `{ "refresh_token": "string" }`
* `POST /auth/logout`  
  Revokes the active refresh token.  
  *Payload*: `{ "refresh_token": "string" }`
* `POST /auth/google/session-exchange`  
  Exchanges a Google OAuth session token for JWT credentials.  
  *Payload*: `{ "session_id": "string" }`
* `POST /auth/dev/admin-login` (Development mode only)  
  Bypass auth to log in as administrative phone profile.  
  *Payload*: `{ "token": "override-token-string" }`

---

## 2. Users & KYC (`/users`, `/kyc`)

* `GET /users/me` — Fetches current authenticated user profile.
* `PATCH /users/me` — Updates profile info (name, profile_pic, city, dob, gender).
* `POST /users/me/switch-role` — Switches the current active interface role (customer/vendor/creator/admin).
* `POST /users/me/add-role` — Requests to activate a secondary role scope.
* `GET /users/me/role-activity` — Retrieves history details for the active user.
* `POST /users/me/fcm-token` — Registers an FCM device token for web notifications.
* `DELETE /users/me/fcm-token/:token` — Deregisters the device token.
* `GET /users/:userId/trust-score` — Fetches calculated trust metrics.
* `POST /kyc/me/submit` — Uploads KYC verification documents.  
  *Payload*: `{ "doc_type": "aadhaar|pan|driving_license|passport", "doc_number": "string", "doc_url": "url", "selfie_url": "url" }`
* `GET /kyc/me` — Returns status details of the caller's KYC document submission.

---

## 3. Categories & Listings (`/categories`, `/listings`)

* `GET /categories` — Lists all categories.
* `GET /categories/:slug` — Gets category info by slug.
* `GET /listings` — Queries listings using filters.  
  *Query Parameters*: `lat`, `lng`, `distance_km`, `category_id`, `sub_category_id`, `type`, `price_min`, `price_max`, `q` (text search), `page`, `limit`.
* `GET /listings/:slug` — Retrieves a listing by slug.
* `POST /listings` — Creates a listing. Set query `?become_vendor=true` to auto-enroll vendor scope.  
  *Payload*: Listing object.
* `PATCH /listings/:id` — Updates listing settings.
* `DELETE /listings/:id` — Soft-deletes a listing.
* `POST /listings/:id/status` — Changes status (`active`, `paused`, `sold`, `expired`).
* `GET /listings/vendor/me` — Lists the authenticated vendor's listings.
* `POST /listings/:id/like` — Likes or un-likes a listing.
* `POST /listings/:id/save` — Saves or unsaves a listing.
* `POST /listings/:id/watch` — Registers a user to watch listing availability.  
  *Payload*: `{ "phone": "10-digit-string" }`
* `POST /listings/:id/boost` — Promotes a listing to the top of search feeds.  
  *Payload*: `{ "duration_days": 3|7|15, "payment_method": "credits|balance_inr" }`

---

## 4. Chat & Negotiator Deals (Root `/`)

* `POST /chat/threads` — Initiates a chat conversation.  
  *Payload*: `{ "participant_id": "string", "thread_type": "listing|requirement|direct", "context_id": "string" }`
* `GET /chat/threads/me` — Lists the user's active chat conversations.
* `GET /chat/threads/:id` — Details a specific chat thread.
* `GET /chat/threads/:id/messages` — Retrieves paginated message history.
* `POST /chat/threads/:id/messages` — Appends a new chat message.  
  *Payload*: `{ "type": "text|image|location|quote", "text": "...", "media": { ... }, "shared_location": { ... } }`
* `POST /chat/threads/:id/read` — Marks a thread's incoming messages as read.
* `POST /chat/threads/:id/archive` — Archives the thread.
* `GET /chat/unread-total` — Counts total unread messages across all threads.
* `POST /deals` — Starts a deal negotiation.  
  *Payload*: `{ "thread_id": "string", "listing_id": "string", "requirement_id": "optional", "buyer_id": "string", "seller_id": "string", "initial_offer": 500 }`
* `GET /deals/me` — Lists deals involving the caller.
* `GET /deals/:id` — Fetches deal status and counter history.
* `POST /deals/:id/counter` — Registers a counter-offer.  
  *Payload*: `{ "offer_amount": 450 }`
* `POST /deals/:id/accept` / `/reject` / `/cancel` — Updates deal state.
* `POST /deals/:id/complete` — Finalizes transaction and releases locking rules.

---

## 5. Requirements & Proposals (Root `/`)

* `POST /requirements` — Customer posts a demand request.  
  *Payload*: `{ "title": "string", "description": "string", "category_id": "string", "budget_max": 2000, "location": { ... } }`
* `GET /requirements` — Searches active requirements within proximity.
* `GET /requirements/:id` — Retrieves requirement details.
* `GET /requirements/:id/proposals` — Lists proposals sent by vendors.
* `POST /requirements/:id/close` — Marks requirement as closed/fulfilled.
* `POST /proposals` — Vendor sends a proposal for a requirement.  
  *Payload*: `{ "requirement_id": "string", "message": "string", "quoted_price": 1800 }`
* `GET /proposals/me/sent` — Lists proposals sent by the active vendor.
* `POST /proposals/:id/shortlist` / `/reject` / `/accept` — Processes a proposal status.

---

## 6. Financial Ledger & Payments (Root `/`)

* `GET /wallet/me` — Fetches current credits, balances, and is_frozen settings.
* `GET /wallet/me/transactions` — Lists past transaction ledger entries.
* `POST /payments/order` — Initializes a top-up request order in Razorpay.  
  *Payload*: `{ "amount_paise": 50000 }`
* `POST /payments/verify` — Validates Razorpay checkout signature.  
  *Payload*: `{ "razorpay_order_id": "string", "razorpay_payment_id": "string", "razorpay_signature": "string" }`
* `POST /payments/dev/simulate-success` — Instantly marks order as successful for local development.
* `GET /payments/me` — Lists the user's payment transactions history.
* `POST /subscriptions/subscribe` — Enrolls user in a subscription plan.  
  *Payload*: `{ "plan": "verified_monthly|verified_yearly" }`
* `GET /subscriptions/me` — Fetches active subscription detail metrics.
* `POST /subscriptions/:id/cancel` — Stops subscription auto-renewals.

---

## 7. AI Integrations (`/ai`)

* `POST /ai/generate-listing-content` — Recommends tags and categories from image payloads.
* `POST /ai/improve-description` — Automatically refines listing descriptions.
* `POST /ai/generate-title` — Generates a optimized title.
* `POST /ai/detect-category` — Matches products to categorizations.
* `POST /ai/parse-demand` — Parses customer requirements strings.
* `POST /ai/match-vendors` — Matches demand to nearby shop profiles.
* `POST /ai/suggest-price` — Estimates fair market values.
* `POST /ai/negotiate` — Recommends chat negotiator counters.

---

## 8. Admin Console Operations (`/admin`)

* `GET /admin/analytics/overview` — Aggregated system-wide totals.
* `GET /admin/users` — Queries lists of registered user profiles.
* `POST /admin/users/:id/ban` / `/unban` — Bans/unbans user profiles.
* `POST /admin/users/:id/freeze-wallet` / `/unfreeze-wallet` — Toggles wallet freezes.
* `POST /admin/users/:id/add-role` / `/remove-role` — Modifies user roles directly.
* `GET /admin/listings` — List of all listings (active, takendown).
* `POST /admin/listings/:id/takedown` / `/restore` — Toggles listing flags.
* `GET /admin/kyc` — Returns pending KYC documents queue.
* `POST /admin/kyc/:id/approve` — Approves documents and grants Trust badges.
* `POST /admin/kyc/:id/reject` — Rejects documents.  
  *Payload*: `{ "reason": "reason string" }`
* `GET /admin/reports` — Lists user flags and reports.
* `POST /admin/reports/:id/resolve` / `/dismiss` — Resolves/dismisses reported items.
