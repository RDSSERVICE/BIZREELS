# Iteration 1 — Initial Mobile App Build

## Screens Implemented
- Landing (index.tsx) — hero image, stats, feature cards, CTAs
- Login — phone input with +91 prefix, validation
- Verify OTP — dev OTP banner, auto-fill, resend timer
- Onboarding — name input + role selection (Customer/Vendor/Creator)
- Feed — reels + grid layout, pull-to-refresh, search shortcut
- Explore — category chips, search bar, trending listings grid
- Chat List — thread list with unread badges, auth gate
- Profile — role chips, quick actions, edit form, logout
- Listing Detail — image gallery, like/save/share, vendor card with follow/chat, specs, related
- Search — debounced input, suggestions, results grid
- Browse (index) — categories + listings grid
- Browse (category) — sub-category filter chips + listings
- Chat Thread — message bubbles, gradient for own messages, read ticks, polling
- Saved — saved listings grid, pull-to-refresh
- Wallet — balance card, transactions, topup modal
- Notifications — list with read/unread state, read-all
- Deals — deal cards with status colors
- Dashboard — greeting, role chips, action CTAs
- Vendor Profile — avatar, stats, follow, tabs (all/products/services)

## Web-to-Mobile Mapping
| Web Route | Mobile Route | Component |
|-----------|-------------|-----------|
| / | /index | Landing page |
| /login | /login | Phone auth |
| /verify-otp | /verify-otp | OTP screen |
| /onboarding | /onboarding | Profile setup |
| /feed | /(tabs)/feed | Feed tab |
| /explore | /(tabs)/explore | Explore tab |
| /chat | /(tabs)/chat | Chat list tab |
| /profile | /(tabs)/profile | Me tab |
| /listing/:slug | /listing/[slug] | Listing detail |
| /search | /search | Search page |
| /browse | /browse/index | Browse all |
| /browse/:slug | /browse/[categorySlug] | Category view |
| /chat/:threadId | /chat-thread/[threadId] | Chat thread |
| /saved | /saved | Saved items |
| /wallet | /wallet | Wallet |
| /notifications | /notifications | Notifications |
| /deals | /deals | Deals |
| /dashboard | /dashboard | Dashboard |
| /vendor/:id | /vendor/[vendorId] | Vendor profile |

## Dependencies Installed
- axios

## Known Issues / Notes
- Media images show placeholder (📦) in web preview due to browser ORB policy blocking cross-origin media from backend. Works on native.
- No real-time socket.io integration (using 5s polling for chat instead). Could add socket.io later.
- Admin panel screens not implemented (low priority for mobile).
- Listing create/edit not implemented (complex form, deferred).
