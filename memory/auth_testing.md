# Emergent Auth & API Testing Guide (Phase 0 + 1)

## Env
- Backend base URL: `${REACT_APP_BACKEND_URL}/api`.
- Local backend: `http://localhost:8001/api`.
- `OTP_DEV_MODE=true` → `dev_otp` field is returned in the send-OTP response.
- `CLOUDINARY_DEV_MODE=true` → uploads write to `/app/backend/uploads/` and are served via `/api/uploads/<file>`.

## Auth endpoints (`/api/v1`)
- `POST /auth/otp/send`      body `{ "phone": "9876543210" }`
- `POST /auth/otp/verify`    body `{ "phone", "otp", "name?", "roles?" }`
- `POST /auth/refresh`       body `{ "refresh_token" }` → returns NEW access + NEW refresh (rotated)
- `POST /auth/logout`        body `{ "refresh_token" }`
- `GET  /users/me`
- `PATCH /users/me`
- `POST /users/me/switch-role`  body `{ "role" }`
- `POST /users/me/add-role`     body `{ "role" }`  (rejects `admin`)

## Category endpoints (`/api/v1/categories`)
- `GET /` — `?top_level=true`, `?parent_id=<id>`, `?tree=true`
- `GET /<slug>` — includes children
- `POST /` (admin only)
- `PATCH /<id>` (admin only)
- `DELETE /<id>` (admin only, soft delete)

## Listing endpoints (`/api/v1/listings`)
- `POST /` — vendor required; use `?become_vendor=true` to auto-add vendor role
- `GET /` — filters: `type`, `category_id`, `sub_category_id`, `vendor_id`, `status`, `q`, `cursor`, `limit`
- `GET /vendor/me` — auth required, own listings including paused/sold
- `GET /<slug>` — public detail; increments `views_count` (background task)
- `PATCH /<id>` — owner or admin
- `POST /<id>/status` — body `{status: active|paused|sold|expired}`
- `DELETE /<id>` — soft delete

## Media endpoints (`/api/v1/media`)
- `POST /sign`  body `{ "folder": "listings/<vendor_id>", "resource_type": "image"|"video" }` → in dev mode returns `{mode:"proxy", mock:true}` telling client to POST the file to `/upload`.
- `POST /upload`  multipart `file`, form field `folder`, form field `resource_type` — returns `{url, secure_url, public_id, width, height, resource_type, duration}` (dev-mode paths look like `/api/uploads/<file>` and must be prefixed with `REACT_APP_BACKEND_URL` before rendering — see `resolveMediaUrl()` in `/app/frontend/src/lib/api.js`).

## Type-specific listing validation
| type          | required                                         | forbidden                              |
|---------------|--------------------------------------------------|----------------------------------------|
| `new_product` | `stock >= 0`                                     | `condition`                            |
| `old_product` | `condition` ∈ {new, like_new, good, fair}        | `stock`                                |
| `service`     | `service_charges_type` ∈ {fixed, hourly, per_visit}| `stock`, `condition`, `warranty`     |

Additional invariants:
- `price > 0` and (if provided) `offer_price < price`
- `location.area`, `location.city`, `location.pincode` are required
- Max 10 images per listing, 1 optional reel ≤ 30 s (soft-enforced client-side, server records duration)

## Frontend routes
- Public: `/`, `/login`, `/verify-otp`, `/browse`, `/browse/:categorySlug`, `/listing/:slug`
- Auth: `/onboarding`, `/dashboard`, `/profile`, `/vendor/dashboard`, `/vendor/listing/new`, `/vendor/listing/:id/edit`

## Key data-testids
Phase 0 IDs still valid. New Phase 1 IDs:
- Browse: `browse-search-input`, `category-grid`, `category-tile-<slug>`, `sub-chip-<slug>`, `sub-chip-all`, `listings-grid`, `listings-empty`, `listings-loading`, `load-more-btn`, `floating-add-listing`, `browse-profile-link`.
- Listing detail: `listing-title`, `listing-price`, `listing-media`, `listing-reel`, `listing-thumbnails`, `listing-description`, `listing-specs`, `listing-location`, `listing-tags`, `vendor-card`, `chat-vendor-btn`, `listing-share-btn`, `listing-back-btn`.
- Dashboard: `dashboard-browse-cta`, `dashboard-vendor-cta`, `dashboard-become-vendor-cta`.
- Vendor dashboard: `new-listing-btn`, `vendor-listings`, `vendor-listing-<slug>`, `edit-btn-<slug>`, `pause-btn-<slug>`, `resume-btn-<slug>`, `sold-btn-<slug>`, `delete-btn-<slug>`, `vendor-empty`, `empty-create-btn`.
- Listing form: `type-new_product`, `type-old_product`, `type-service`, `category-select`, `sub-category-select`, `title-input`, `description-input`, `price-input`, `offer-price-input`, `negotiable-switch`, `stock-input`, `warranty-input`, `bulk-price-input`, `condition-select`, `cond-<value>`, `charges-select`, `charges-<value>`, `exp-input`, `area-input`, `tags-input`, `area-locality-input`, `city-input`, `pincode-input`, `state-input`, `address-input`, `use-location-btn`, `form-back-btn`, `form-next-btn`, `form-publish-btn`, `form-progress`, `step-type`, `step-category`, `step-details`, `step-media`, `step-location`, `step-review`.
- Become-vendor modal: `become-vendor-confirm`, `become-vendor-cancel`.
- Media uploader: `media-uploader`, `upload-image-btn`, `upload-reel-btn`, `remove-image-<i>`, `remove-reel`.

## Startup seeds
- Admin user (see `test_credentials.md`) when `SEED_ADMIN_ON_STARTUP=true`.
- 10 top-level categories with 4–6 sub-categories each (Electronics, Fashion, Home & Furniture, Vehicles, Real Estate, Services, Food & Grocery, Beauty & Salon, Health & Fitness, Education & Coaching).
