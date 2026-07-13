# Emergent — Demo Walkthrough Script (3-minute pitch)

**Preview URL:** https://emergent-india-2.preview.emergentagent.com
**Seed state:** `POST /api/v1/admin/seed/reset-demo?wipe=true` (admin auth, dev-mode gated) produces `{users:45, listings:80, reviews:59, notifications:43, subscriptions:16, wallets:45}`.
**Fresh install auto-seeds** if collections have <20 listings (dev-mode). Toggle via `AUTO_SEED_ON_STARTUP` env.

---

## Phase 6b polish (2026-02)
- **Branded 404 page** at any unknown route (`NotFound.jsx`) with home CTA.
- **Global `<ErrorBoundary>`** wraps the entire app tree — friendly "Something went wrong" with Reload button on crashes.
- **Landing polish**: Category showcase (10 tiles), Testimonials (4 realistic quotes), City Champions widget (leverages Fast Responder leaderboard), "As featured in" press-logo row, dual CTA at bottom (Explore Listings / Start selling in 2 min).
- **Seed enhancement**: 15 new-product listings + 15 service listings now carry demo Cloudinary reel URLs → `/api/v1/feed/reels` returns **29 items** (spec ≥15).
- **TEST_ isolation**: Public `/listings` and `/feed` now regex-exclude titles starting with `TEST_` so test suites can't pollute the demo state.

## Personas (all use dev OTP — the send-OTP response returns `dev_otp`)

| Persona     | Role(s)                     | Phone         | Notes                                                     |
| ----------- | --------------------------- | ------------- | --------------------------------------------------------- |
| **Admin**   | admin, customer             | `9999999999`  | Seeded on startup. Access `/admin`, KYC queue, reports.   |
| **You**    | customer, vendor            | *fresh*       | Sign up with any 10-digit number; get 50 credits + code.  |
| Demo customers | customer                | *many, seeded* | Use listings, reviews, watchers. Names like Rahul Sharma. |
| Demo vendors | customer, vendor            | *many, seeded* | Some KYC-approved + subscribed → verified badge. Trust scores 20–92. |

You do NOT need to memorize any demo phone — the persona for the walkthrough is a **fresh signup with your own phone** on the recording device.

---

## 3-minute demo script

### 00:00 — Landing page (30s)
1. Open `/` — India-first marketplace hero.
2. Point out: hero copy in English + toggle language (top right, globe icon) → Hindi (हिन्दी). All UI translates.
3. Stats row (`vendors 20+ · listings 80+ · cities 10`) — pulled live from seed.
4. Testimonial-worthy: "reels-first · chat direct · deal fair".
5. Click **Get Started**.

### 00:30 — Buyer flow (60s)
1. **Login** with your phone → dev OTP banner shows the code → auto-fill available.
2. Land on `/feed` — mixed reels + listings. Point out: **Sponsored** pills on 5–10 boosted listings.
3. Search `/search` → filter by category `Electronics` → **iPhone 15**. Open listing detail.
4. Reels play; scroll to reviews. Show **⭐ 5** rating + 👍 Helpful button + Verified purchase chip.
5. Tap **Chat with vendor** → typing indicator + sticky chat. Send a message. If vendor is a fast responder we already see "Typically responds in ~10m" badge on their profile.
6. Back to feed. Tap the ❤️ / bookmark icons (save event fires under the hood — feeds analytics).

### 01:30 — Vendor flow (60s)
1. Tap **Me** → your name shown with **50 signup credits** in wallet. **Referral card** with your code + Copy / Share buttons (WhatsApp deep-link).
2. Tap the **Onboarding checklist** — 3/5 already done. Follow the last two steps (KYC + first review — skip for demo).
3. Post a listing via `/vendor/new` → snap a title + category + price → publish.
4. Tap **Boost** on the new listing → BoostModal → 3-day boost → **Pay with credits (300)** → instant activation → Sponsored badge appears on the ListingCard.
5. Tap **Analytics** on the dashboard → `/vendor/analytics` shows views, chats, conversion %, daily views bar chart, **top 5 listings**, and **Fast Responders in your city** at the bottom.

### 02:30 — Admin flow (30s)
1. Log out → login as `9999999999` (admin OTP).
2. `/admin` → live counters: 45 users, 20 vendors, 80 listings, GMV etc.
3. `/admin/kyc` → approve a pending KYC in 1 click → user's `verified_badge` flips.
4. `/admin/reports` → resolve an open report with **Takedown** → the reported listing is instantly hidden from feed/search.
5. `POST /admin/nudge/scan` (via API demo or "Trigger nudge" button) → boost nudge notifications fire for eligible dormant listings.

---

## Reset the demo any time
```bash
BASE=$REACT_APP_BACKEND_URL
ADMIN_TOK=<admin_access_token>
curl -s -X POST "$BASE/api/v1/admin/seed/reset-demo?wipe=true" -H "Authorization: Bearer $ADMIN_TOK"
```

## PWA install
- Chrome desktop: address bar shows install icon → click → "Emergent" opens standalone.
- Android Chrome: three-dot menu → "Install app". Home-screen icon uses the manifest icon.
- iOS Safari: Share → Add to Home Screen.

## i18n coverage
- `en.json`: 100% (source of truth).
- `hi.json`: ~85% (all landing/auth/onboarding/profile/dashboard/browse/common/language sections). New Phase 4-6 keys can be back-filled but the toggle mechanism works today.
- Missing keys fall back to English automatically (i18next default).

## Blockers / notes for future phases
- Real MSG91 / Cloudinary / Razorpay / FCM keys: flip DEV_MODE flags in `.env` when you provide them.
- Onboarding tour (react-joyride): deferred to Phase 6b (not blocking demo).
- Error boundaries + 404/500 branded pages: deferred to Phase 6b.


---

## 📱 Mobile App (Expo / React Native)

**Mobile Preview URL:** https://emergent-india-2.expo.preview.emergentagent.com
**Expo Go QR:** Scan the QR code from `http://localhost:3001` in Expo Go app.

### Mobile Demo Flow (2-minute walkthrough)

#### 00:00 — Landing & Auth (30s)
1. Open mobile app → dark hero with "Discover local. Deal fair." headline.
2. Stats row shows live listings/vendors/cities counts.
3. Tap **Get Started** → phone input with +91 prefix.
4. Enter any 10-digit number → dev OTP banner shows code → tap **Verify & Continue**.
5. Onboarding: enter name, select roles (Customer + Vendor) → **Continue** → lands on Feed tab.

#### 00:30 — Buyer Flow (30s)
1. **Feed tab** — scrollable reels + "Popular around you" grid. SPONSORED badges visible on boosted items.
2. Tap a listing → full detail: image gallery, price, like/save/share bar, vendor card with trust badge + blue verified tick.
3. Tap **Chat with Vendor** → real-time chat via Socket.IO. Typing indicator appears. Send a message. Tap ₹ button → send an offer.
4. Back. Tap **Explore** tab → category chips + trending listings. Tap a category → filtered view with sub-category chips.
5. Tap search icon → live search with auto-suggestions.

#### 01:00 — Vendor Flow (45s)
1. Tap **Me** tab → Profile shows: roles (gradient active chip), Wallet/Saved/Notifications/Deals shortcuts.
2. **Referral card** with code + Copy/Share buttons (opens native share sheet for WhatsApp).
3. **Language toggle**: English / हिन्दी.
4. Tap **Vendor Dashboard** → greeting + role chips + **New Listing** gradient CTA.
5. Tap **New Listing** → 6-step wizard:
   - Step 1: Type picker (New Product / Used / Service)
   - Step 2: Category + sub-category chips
   - Step 3: Details form (title, price, offer price, negotiable toggle, condition/charges)
   - Step 4: Media upload (expo-image-picker, up to 10 images)
   - Step 5: Location (Use my location GPS or manual entry)
   - Step 6: Review + Publish
6. Draft auto-saves to AsyncStorage.

#### 01:45 — Real-time Features (15s)
1. Chat tab shows unread badge count (Socket.IO real-time).
2. Notifications bell on Me tab updates live via `notification:new` socket event.
3. Chat thread: blue read ticks update in real-time via `message:read` event.
4. Typing indicator shows "typing..." when peer types.

### Mobile Architecture
- **Navigation**: expo-router file-based routing, bottom tabs (Feed/Explore/Chat/Me) + stack screens
- **API**: Same backend endpoints as web (`/api/v1/*`), full API client in `src/lib/api.ts`
- **Socket**: `socket.io-client` with auto-reconnect, app-state-aware (disconnect on background, reconnect on foreground)
- **Auth**: JWT with refresh token rotation, SecureStore for tokens
- **Design**: Dark theme, gradient accents (purple → pink → orange), glass cards, 8pt grid

---

## Preview / Testing URL

- **Testing domain** = the same preview URL: `https://emergent-india-2.preview.emergentagent.com`
- This IS the testing environment — no separate domain is provisioned.
- If the URL shows a "Frontend Preview Only — wake servers" banner or OTP send returns network-error,
  the pod is asleep. To wake it, ping the API once:
  `curl https://emergent-india-2.preview.emergentagent.com/api/health` — pod auto-wakes within ~30s.
- Once `/api/health` returns 200, refresh the browser and the full app is functional.
