# Emergent — API & Frontend Testing Guide (Phase 0 + 1 + 2)

## Env
- Backend base URL: `${REACT_APP_BACKEND_URL}/api`. Local: `http://localhost:8001/api`.
- `OTP_DEV_MODE=true` → send-OTP response includes `dev_otp`.
- `CLOUDINARY_DEV_MODE=true` → uploads write to `/app/backend/uploads/` and are served at `/api/uploads/<file>`.

## Endpoints (37 total, all under `/api/v1/*` except `/api/health` & `/api/openapi.json`)

### Auth (Phase 0)
`POST /auth/otp/send`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout`
`GET /users/me`, `PATCH /users/me`, `POST /users/me/switch-role`, `/users/me/add-role`

### Categories (Phase 1)
`GET /categories/?top_level=true|tree=true|parent_id=…`, `GET /categories/<slug>`, admin POST/PATCH/DELETE.

### Listings (Phase 1)
`POST /listings/?become_vendor=true`, `GET /listings/`, `GET /listings/vendor/me`,
`GET /listings/<slug>`, `PATCH /listings/<id>`, `POST /listings/<id>/status`, `DELETE /listings/<id>`
**Phase 2 add-ons:** `POST /listings/<id>/like`, `POST /listings/<id>/save`, `POST /listings/<id>/watch` (anon, rate limited 5/hr/IP).

### Media (Phase 1)
`POST /media/sign`, `POST /media/upload` (multipart file).

### Feed (Phase 2)
`GET /feed/?type=all|reels|products|services|new_products|old_products&lat&lng&radius=10|any&cursor&limit`
`GET /feed/reels?lat&lng&radius=any&cursor&limit`
Response items include `viewer_state.{liked,saved}` when Authorization header present.

### Follow (Phase 2)
`POST /follows/<user_id>`, `DELETE /follows/<user_id>`, `GET /follows/me/following`.

### Interactions (Phase 2)
`GET /interactions/me/saved`, `GET /interactions/me/liked`.

### Search (Phase 2)
`GET /search/?q=&category_id=&sub_category_id=&type=&condition=&price_min=&price_max=&is_negotiable=&has_offer=&lat=&lng=&radius=&sort=recent|price_asc|price_desc&cursor=&limit=`
`GET /search/suggest?q=<2+chars>` → `{listings:[{title,slug,image,price}], categories:[{id,name,slug,icon_url}]}`.

### Location utils (Phase 2)
`POST /utils/pincode-lookup` body `{pincode:"110001"}` — real free API `api.postalpincode.in`, cached in `pincode_cache`.
`POST /utils/reverse-geocode` body `{lat,lng}` — mock (returns nearest Indian metro city + state).

### Vendors (Phase 2)
`GET /vendors/<user_id>` → `{id, name, followers_count, listings_count, viewer_following, kyc_status, phone}`
`GET /vendors/<user_id>/listings`
`GET /vendors/<user_id>/followers/count`

### SEO (Phase 2)
`GET /seo/listing/<slug>` → `{title, description, image, url, type}`
`GET /seo/sitemap.xml`, `GET /seo/robots.txt`.

## Frontend routes
Public: `/`, `/login`, `/verify-otp`, `/browse`, `/browse/:categorySlug`, `/listing/:slug`, `/feed`, `/explore`, `/search`, `/vendor/:vendorId`
Auth: `/onboarding`, `/dashboard`, `/profile`, `/saved`, `/vendor/dashboard`, `/vendor/listing/new`, `/vendor/listing/:id/edit`

Login/onboarding land users on `/feed` (Phase 2 change).

## Key data-testids (Phase 2 additions)
- Bottom nav: `bottom-nav`, `nav-feed`, `nav-explore`, `nav-add`, `nav-saved`, `nav-profile`.
- Feed: `feed-search-btn`, `feed-scroll`, `feed-loading`, `feed-empty`, `feed-load-more`, `allow-location-btn`, `later-location-btn`, `location-chip`, `reel-<slug>`, `reel-video-<slug>`, `like-<slug>`, `save-<slug>`, `share-<slug>`, `reel-detail-<slug>`.
- Search: `search-input`, `search-back-btn`, `search-filters-btn`, `search-suggestions`, `search-results`, `search-empty`, `suggest-listing-<slug>`, `suggest-category-<slug>`, `sort-trigger`, `price-min-input`, `price-max-input`, `radius-trigger`, `condition-filter-trigger`, `only-negotiable`, `only-with-offer`, `filters-clear-btn`, `filters-apply-btn`.
- Vendor profile: `vendor-back-btn`, `vendor-share-btn`, `vendor-header`, `vendor-tabs`, `tab-all|products|services|reels`, `follow-toggle-btn`, `vendor-chat-btn`, `vendor-whatsapp-btn`, `vendor-loading`.
- Listing detail (Phase 2 add): `listing-like-btn`, `listing-save-btn`, `listing-share-inline-btn`, `follow-vendor-btn`, `watch-listing-btn`, `related-section`, `watch-phone-input`, `watch-submit-btn`, `listing-action-bar`.
- Saved: `saved-listings`, `saved-empty`.
- Explore: `explore-search-btn`, `explore-search-input`, `explore-listings`.

## Feed scoring (algorithm cheatsheet)
Pool: last N=100 active listings (with geo `$geoNear` if lat/lng). Score each:
- `+30 → 0` linear based on distance within radius
- `+20` created <24h ago
- `+15` vendor is in viewer's follow list
- `+10` has a reel
- `+5`  has offer_price
Then sort by score DESC, `_id` DESC as tiebreaker. Cursor pagination uses `_id`.

## Anonymous watchers rate limit
`POST /listings/:id/watch` — 5 req / hour / IP (in-memory sliding window in `utils/rate_limit.py`, key = `watch:<ip>`). Response 429 on excess.
