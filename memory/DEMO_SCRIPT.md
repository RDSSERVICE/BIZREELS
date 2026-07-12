# Emergent — Demo Walkthrough Script (3-minute pitch)

**Preview URL:** https://emergent-india-2.preview.emergentagent.com
**Seed state:** `POST /api/v1/admin/seed/reset-demo?wipe=true` (admin auth, dev-mode gated) produces `{users:45, listings:80, reviews:59, notifications:43, subscriptions:16, wallets:45}`.
**Fresh install auto-seeds** if collections have <20 listings (dev-mode). Toggle via `AUTO_SEED_ON_STARTUP` env.

---

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
