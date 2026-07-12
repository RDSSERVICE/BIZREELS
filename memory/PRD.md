# Emergent — Local Social Commerce Super Platform

## Original problem statement (verbatim summary)
Multi-phase Instagram-style social commerce super platform for India. Web app first (React + FastAPI + MongoDB); Expo mobile port comes in Phase 7. Do NOT touch `/app/mobile/`.

## User personas
- **Customer** — discovers vendors/services via reels, chats, negotiates, posts requirements.
- **Vendor** — local shop / service provider listing offerings.
- **Creator** — hired for shoots, content, collaborations.
- **Admin** — moderation, reports/block queue, analytics.

A single user may hold multiple roles simultaneously (`roles[]`) with a single `current_role` used to shape the UI.

## Core requirements (fixed)
- MongoDB collections (names FROZEN): `users`, `otp_requests`, `refresh_tokens`, `audit_logs`.
- All backend routes under `/api/v1/*` (`/api/health` and `/api/openapi.json` are the exceptions).
- Phone OTP + JWT auth (MSG91 provider, dev mode + real mode both supported).
- Soft delete only (`is_deleted`), no hard deletes ever.
- API versioning stable; never rename endpoints.
- OpenAPI spec always exposed at `/api/openapi.json` for the testing agent.

## Architecture
- **Backend** — FastAPI + Motor. Folder-per-concern: `routes/`, `services/`, `models/`, `middleware/`, `utils/`. Startup hook creates indexes + seeds admin.
- **Frontend** — CRA + Tailwind + Shadcn/UI + react-router-dom + react-i18next (en/hi resources ready). Mobile-first phone-sized viewport.

## Phase progress

### ✅ Phase 0 — Auth foundation (completed 2026-02)
- MSG91 SMS OTP integration with clean DEV_MODE fallback (`OTP_DEV_MODE=true` returns `dev_otp` in response, logs to console, does NOT throw).
- 6-digit OTP, sha256 hashed, 5-min TTL (Mongo TTL index on `otp_requests.expires_at`).
- Rate limit: 3 OTP requests / phone / 10 minutes (in-memory sliding window).
- JWT access token (15 min) + opaque refresh token (30 days, sha256 hashed, TTL index). Rotation + reuse detection + family burn on `/refresh`.
- Multi-role users, seed admin `9999999999` on startup (gated by `SEED_ADMIN_ON_STARTUP`).
- REST endpoints: `/api/v1/auth/otp/send|verify|refresh|logout`, `/api/v1/users/me` (GET, PATCH), `/api/v1/users/me/switch-role`, `/api/v1/users/me/add-role`.
- Frontend routes: `/`, `/login`, `/verify-otp`, `/onboarding`, `/dashboard`, `/profile`.
- i18n skeleton: `en.json` populated, `hi.json` scaffold ready.
- Security audit completed and all findings addressed (dev_otp gating, `.env` gitignored, refresh rotation + reuse detection, constant-time OTP compare).

### ✅ Phase 1 — Categories + Listings + Cloudinary media (completed 2026-02)
- New Mongo collections: `categories` (hierarchical parent/child), `listings` (multi-type: new_product / old_product / service). All previous collections untouched.
- Category tree seeded on first startup: 10 top-level with 4–6 sub-categories each. Endpoints under `/api/v1/categories/`.
- Listing endpoints under `/api/v1/listings/`: create (with auto-vendor-role via `?become_vendor=true`), paginated list with filters + text search + cursor, detail by slug, PATCH, status transitions (active/paused/sold/expired), soft delete, `/vendor/me`.
- Type-specific validation: `new_product` requires `stock`; `old_product` requires `condition`; `service` requires `service_charges_type` and forbids stock/condition/warranty.
- 10-image + 1-reel (≤30s soft client-side + duration recorded) media caps. Slug generation + collision suffixing. GeoJSON Point stored for future geo queries; 2dsphere + text indexes created.
- Cloudinary integration under `/api/v1/media/{sign,upload}` with clean DEV_MODE fallback (`CLOUDINARY_DEV_MODE=true`): files written to `/app/backend/uploads/` and served via `/api/uploads/<file>` static mount. Response shape mirrors real Cloudinary.
- New frontend routes: `/browse`, `/browse/:categorySlug`, `/listing/:slug`, `/vendor/dashboard`, `/vendor/listing/new`, `/vendor/listing/:id/edit`. Dashboard updated with "Become a Vendor" confirmation modal.
- Multi-step wizard (6 steps: type → category → details → media → location → review) with progress bar, localStorage draft auto-save (debounced), geolocation button.

### ✅ Phase 2 — Feed + Search + Geolocation + SEO (completed 2026-02)
- New Mongo collections: `follows`, `interactions`, `search_history`, `pincode_cache`. `listings` extended with `likes_count`, `saves_count`, `watchers[]` (all backward-compat).
- **Mixed-algorithm feed** at `GET /api/v1/feed/` and `GET /api/v1/feed/reels`. Scoring: proximity (30→0 linear within radius), freshness <24h (+20), followed vendor (+15), has reel (+10), has offer (+5). Anonymous & authed both supported.
- **Follow system** — `POST/DELETE /api/v1/follows/:user_id`, `GET /api/v1/follows/me/following`. Unique index on (follower_id, following_id).
- **Like / Save** — `POST /api/v1/listings/:id/like|save` toggle, counts denormalized on listing doc. Saved & liked lists at `/api/v1/interactions/me/saved|liked`.
- **Search & suggestions** — `GET /api/v1/search/` with text+filters (`q, category_id, sub_category_id, type, condition, price_min/max, is_negotiable, has_offer, lat/lng/radius, sort`), cursor pagination, geospatial via `$geoNear`. `GET /api/v1/search/suggest?q=…` returns 5 title + 3 category quick-picks. Searches logged to `search_history`.
- **Anonymous watchers (lead capture)** — `POST /api/v1/listings/:id/watch` accepting `{phone}`, no auth required. Rate-limit 5/hour per IP (in-memory sliding window). Dedup by phone. Frontend soft-gate on listing detail for anon viewers.
- **Location utils** — `POST /api/v1/utils/pincode-lookup` uses real free api.postalpincode.in (cached to `pincode_cache`). `POST /api/v1/utils/reverse-geocode` is a coarse mock (TODO for Google Geocoding). Frontend `useUserLocation()` hook manages permission + local persistence.
- **Public vendor profile** — `GET /api/v1/vendors/:user_id` (with follower/listings counts + viewer follow state), `/:user_id/listings`, `/:user_id/followers/count`. Frontend `/vendor/:vendorId` with All/Products/Services/Reels tabs, follow button, WhatsApp deep-link, share button.
- **SEO** — `GET /api/v1/seo/listing/:slug` returns OG-ready meta, `sitemap.xml` (dynamic) + `robots.txt`. Frontend uses `react-helmet-async` to inject tags into `<head>` on listing detail.
- **Frontend routes added:** `/feed` (Instagram-style vertical reels + injected grid rows every 5 reels), `/explore` (grid + search entry), `/search` (autocomplete + filter sheet with sort/price/radius/condition/negotiable/offer), `/vendor/:vendorId`, `/saved`. Bottom tab bar (Feed / Explore / Sell-for-vendors OR Saved / Me). Listing detail extended with like/save/share buttons, follow-vendor button, related listings, recently-viewed localStorage. Login/onboarding redirect target changed from `/dashboard` → `/feed`.

### ✅ Phase 3 — Requirements + Chat (Socket.IO) + Negotiation + WhatsApp (completed 2026-02)
- New Mongo collections: `requirements`, `proposals`, `chat_threads`, `messages`, `deals`. Indexes: 2dsphere + text on requirements, unique (participants, context_id, thread_type) on chat_threads, (thread_id, _id desc) on messages, buyer/seller/status on deals.
- **Requirements** — `POST/GET/PATCH/DELETE /api/v1/requirements/`, `POST /:id/close`, `GET /:id/proposals`. Filters: category, city, urgency, budget_max, q. Views_count via BackgroundTasks. Auto-expire at +30 days.
- **Proposals** — `POST /api/v1/proposals/`, `GET /me/sent`, `POST /:id/shortlist|reject|accept`. Accept auto-creates a chat thread and posts a system message.
- **Chat** — `POST /api/v1/chat/threads` (dedup by participants+context), `GET /me`, `GET /:id`, `GET /:id/messages` (cursor paginated), `POST /:id/messages`, `POST /:id/read`, `POST /:id/archive`, `GET /unread-total`, `GET /presence/:userId`. Message types: text | image | video | listing_card | location | quote | system.
- **Socket.IO** — mounted at `/socket.io` with JWT-on-handshake auth (rejects invalid/expired tokens). Server events: `message:new`, `message:read`, `thread:typing`, `deal:updated`, `connected`. Client events: `thread:join`, `thread:leave`, `typing`. In-memory presence tracking.
- **Deals / Negotiation** — `POST /api/v1/deals/` (creates deal + posts `quote` message), `POST /:id/counter|accept|reject|cancel|complete`, `GET /me`, `GET /:id`. State machine: negotiating → accepted | rejected | expired | completed | cancelled. Background `expire_task_loop()` marks past-expiry deals every 5 min.
- **WhatsApp helper** — `GET /api/v1/utils/whatsapp-link?vendor_id=&listing_id=` returns preformatted wa.me URL. Frontend uses it on vendor profile.
- **Reel seed data** — 4 sample reels (Kolhapuri Chappals, Bridal Mehendi, Retro Vespa, Home-cooked Tiffin) added on first startup so `/feed/reels` is populated for demo. Uses public Cloudinary demo sample video URLs.
- **Frontend routes added:** `/requirements`, `/requirements/new`, `/requirements/:id`, `/chat`, `/chat/:threadId`, `/deals`. Bottom nav updated with Chat tab + real-time unread badge (via Socket.IO). ListingDetail "Chat with Vendor" now creates/opens a thread. `read_at` renders WhatsApp-style ticks (Check → CheckCheck → blue CheckCheck).
- **Watch rate limit** — confirmed as exactly 5 requests / hour / IP (allow first 5, block 6th).

### ✅ Phase 4a — Reviews + Notifications + Wallet + Razorpay(DEV) + Subscriptions + KYC + Trust score (completed 2026-02)
- New Mongo collections: `reviews`, `notifications`, `wallets`, `wallet_transactions`, `payments`, `subscriptions`, `kyc_documents`. All existing collections untouched.
- **Reviews** — `POST/GET/PATCH/DELETE /api/v1/reviews/`, `POST /:rid/helpful`, `POST /:rid/reply`, `GET /vendor/:vendor_id/summary`. **Deal-gated when `deal_id` supplied** → 403 unless deal status=completed AND reviewer is buyer or seller. Listing/service reviews REQUIRE `deal_id`. Vendor-level reviews allowed without deal_id (is_verified_purchase=false). Vendor rating denormalized on `users.rating_avg` + `rating_count`. Listing reviews additionally send a notification to the listing owner (vendor_id).
- **Notifications** — `GET /api/v1/notifications/me`, `POST /:nid/read`, `POST /read-all`, `GET /me/unread-count`. Notification types: review, payment, subscription, kyc, deal, system. FCM push adapter in `notification_service` (DEV MODE logs only).
- **Wallet + Credits** — `GET /api/v1/wallet/me`, `POST /me/topup {amount_paise}`, `GET /me/transactions`. Two-balance model: `balance_inr_paise` (real money) + `credits` (non-withdrawable rewards). Credit rules: signup=50 (fired on new-user creation, ref_type='signup'), verified_purchase_review=10, first_listing=100, deal_completed=25, referral=200.
- **Razorpay (DEV MODE)** — `razorpay_service.create_order()` returns mock `order_id/receipt` when `RAZORPAY_DEV_MODE=true`. `POST /api/v1/payments/dev/simulate-success?payment_id=X` marks payment succeeded and triggers post-hooks (wallet credit / subscription activation).
- **Subscriptions** — `POST /api/v1/subscriptions/subscribe {plan}`, `GET /me`, `POST /:sid/cancel`. Plans: `verified_monthly` (₹99/mo), `verified_yearly` (₹999/yr). Verified badge shows on user only when BOTH subscription active AND KYC approved. Duplicate subscribe to a currently-active same-plan sub EXTENDS `expires_at` by plan-duration (no 409, no new row). `simulate-success` response includes `{payment, subscription:{id, ...}}` for subscription payments so frontend can cancel without a follow-up GET.
- **KYC** — `POST /api/v1/kyc/me/submit {doc_type, doc_number, doc_url, selfie_url?}`, `GET /me`. Admin queue: `GET /api/v1/admin/kyc`, `POST /admin/kyc/:kid/approve`, `POST /admin/kyc/:kid/reject` (accepts JSON `{reason}` body OR `?reason=` query for back-compat). On approve → `users.kyc_status=approved` + credit reward.
- **Trust score** — `GET /api/v1/users/:uid/trust-score`. Formula: `base 30 + min(30, completed_deals*3) + (avg_rating-3)*10 + min(10, chat_response_rate*10) + min(10, days_since_join/10) + 10 if kyc + 5 if active verified sub`. `avg_rating` aggregates ALL reviews on the user's vendor profile **and** on their listings/services. Breakdown includes `subs_pts`, `is_subscribed_verified`, `verified_purchase_count`, `total_reviews`. Denormalized to `users.trust_score` on each read.
- **Users** — `GET /api/v1/users/me` response extended with `is_subscribed_verified`, `verified_badge` (= subscribed AND kyc approved), `rating_avg`, `rating_count`, `trust_score`, `city`. Lazy-reconciles `is_subscribed_verified` against actual sub expiry on every read.
- **Public user profile** — `GET /api/v1/users/:id` (no auth) returns SAFE public fields only: `{id, name, roles, profile_pic, city, kyc_status, is_subscribed_verified, verified_badge, rating_avg, rating_count, followers_count, trust_score_tier, created_at}`. NO phone/email/dob/KYC docs. 400 on invalid ObjectId, 404 on unknown user.
- **Frontend routes added:** `/wallet`, `/subscriptions`, `/kyc`, `/notifications`, `/admin/kyc`. Reviews section embedded in `/vendor/:id` and `/listing/:slug`. Notifications bell in top-nav with unread count polled every 30s. Razorpay CTA opens dev-mode simulate button in DEV builds.
- **Tests**: 22 in `backend/tests/test_phase4a.py` (core Phase 4a) + 13 in `backend/tests/test_phase4a_hardening.py` (8-fix hardening). All green.

### ✅ Phase 4b — Boost + Watch price-drop + FCM scaffold + Admin panel + Report content + Review helpful + First-topup bonus (completed 2026-02)
- New Mongo collections: `reports`, `watcher_notifications`. `listings` extended with `boost_expires_at`, `boost_duration_days`, `boost_activated_at`, `is_takendown` (backward-compat). `users` extended with `fcm_tokens[]`, `is_banned`, `has_received_first_topup_bonus`.
- **Listing Boost** — `POST /api/v1/listings/:id/boost {duration_days:3|7|14, payment_method:"credits"|"inr"}`. Cost table: 3d = 300 credits / ₹99, 7d = 600 credits / ₹199, 14d = 1000 credits / ₹349. Only owner can boost. Credits path: instant activate (spends credits). INR path: creates payment order → simulate-success (or webhook) activates. Duplicate boost extends `boost_expires_at`. Boosted listings score +25 in feed and show a "Sponsored" pill (frontend). `GET /api/v1/listings/vendor/me/boosted` returns active boosted listings. Background loop expires stale boosts every 15 min.
- **Watch price-drop** — On `PATCH /listings/:id` where `price` or `offer_price` decreases (or stock goes 0→>0), the update handler fires a background task that iterates `watchers[]`. For registered users → in-app notification (`type:price_drop`). For phone-only watchers → MSG91 transactional SMS stub (dev-mode logs). Dedup: at most 1 notif/phone/listing per 24h (tracked in `watcher_notifications` collection).
- **FCM push scaffold** — `services/fcm_service.py` with `register_token/remove_token/send_push`. Dev mode logs full payload; real path uses `firebase-admin` with `FIREBASE_SERVICE_ACCOUNT_JSON` env (path or inline JSON). All existing `notification_service.create()` calls automatically send push via delegate. Endpoints: `POST /api/v1/users/me/fcm-token {token, platform}` and `DELETE /api/v1/users/me/fcm-token/:token`.
- **Admin panel** — `GET /api/v1/admin/analytics/overview` (total_users, active_users_last_7d, total_vendors, total_listings, active_listings, total_deals, completed_deals, total_gmv_paise, pending_kyc_count, open_reports_count). `GET /admin/users` (filters: q, role, is_active, kyc_status, is_subscribed_verified). `POST /admin/users/:id/{ban|unban|freeze-wallet|unfreeze-wallet|add-role|remove-role}` (admin role is never grantable/removable). `GET /admin/listings?flagged=&status=` + `POST /admin/listings/:id/{takedown|restore}` (takendown listings hidden from feed + search + public listings API). Frontend admin pages: `/admin`, `/admin/users`, `/admin/listings`, `/admin/reports`, `/admin/kyc`.
- **Report content** — `POST /api/v1/reports {target_type, target_id, reason, description?}` (reasons: spam|offensive|scam|wrong_category|other). Rate-limited 10/user/hr. `GET /admin/reports?status=open` + `POST /admin/reports/:id/{resolve|dismiss}` with action:takedown|warn|ban|none. Resolving with takedown auto-flips listing.is_takendown; resolving with ban flips user.is_banned. Frontend Reports admin page + `ReportButton` on listing detail + review cards.
- **Review helpful toggle** — `POST /api/v1/reviews/:id/helpful` toggles helpful mark; unique per (user, review) via `interactions.type='helpful'`. Denormalized `reviews.helpful_count`. Cannot mark own review helpful (403). Frontend Reviews section: helpful button (👍), filter chips (5★/4★/3★/verified), sort dropdown (recent/helpful/rating_high/rating_low).
- **First-topup bonus** — `wallet_service.deposit_inr` grants +50 credits (ref_type='first_topup_bonus') if (a) user created within 24h AND (b) topup ≥ ₹200 AND (c) `has_received_first_topup_bonus` was False. Idempotent via find-and-flip guard on the user doc.
- **Ban propagation** — banned users have `is_active=false`, so `require_auth` returns 401 for all subsequent API calls until unbanned.
- **Tests**: `backend/tests/test_phase4b.py` — 26 test cases across Boost / Price-drop / FCM / Admin / Reports / Helpful / First-topup / Regression. All green.

## Prioritized backlog

### P1 — Phase 5: Vendor analytics dashboard + i18n Hindi + PWA + demo polish + seed data
### P2 — Phase 6: Seed data + i18n Hindi/English + PWA + demo polish
### P3 — Phase 7: Expo mobile port (delegated to a different agent, `/app/mobile/`)

## Non-negotiable rules (project-wide)
- Never rename collections or endpoints.
- Soft delete only.
- All routes go through `/api/v1/*` (health + openapi excepted).
- Feature-based folder structure; thin controllers, logic in services.
- Rate limiting + input validation on every mutation endpoint.
- Never touch `/app/mobile/`.

## Deployment
Hosted in Emergent Kubernetes preview. Frontend: `REACT_APP_BACKEND_URL` env only. Backend: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `OTP_DEV_MODE`, `MSG91_*` env only. Switching from dev mode to real MSG91 is a 1-line `.env` change.
