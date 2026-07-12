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

## Prioritized backlog

### P0 — Phase 2: Feed + Search + Geolocation + SEO tags
- Reels/photo feed with mixed content types.
- Nearby search by geo + text search on tags/titles.

### P1 — Phase 3: Requirements + Chat (Socket.IO) + Negotiation + WhatsApp deep-links
### P2 — Phase 4: Reviews + Notifications + Wallet + Razorpay + Verified badge + Trust score
### P2 — Phase 5: Admin panel + Report/Block queue + Vendor analytics
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
