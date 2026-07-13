# Iteration 2 — Socket.IO Real-time Chat + Create Listing + Polish

## What was implemented

### Socket.IO Real-time Chat
- Created `src/lib/socket.ts` — connects to backend with `path: /api/socket.io`, websocket+polling transports, token-based auth
- `getSocket()` — async initialization, reuses existing connection
- `getSocketSync()` — sync getter for emitting from handlers
- App-state-aware: auto-reconnect on foreground, disconnect on background via `AppState` listener
- `setupAppStateSocketHandler()` / `cleanupAppStateSocketHandler()` lifecycle helpers

### ChatThread real-time
- Removed 5s polling entirely
- Socket events: `message:new` → append to list + mark as delivered, `message:read` → update blue ticks, `thread:typing` → show typing indicator
- Emits: `thread:join` on mount, `thread:leave` on unmount, `typing` debounced (2s throttle)
- Added offer modal (₹ button) to create deals from within chat

### ChatList real-time
- Listens to `message:new` socket event → reloads thread list automatically

### Tab Layout unread badges
- Chat tab: `tabBarBadge` shows unread message count from `chatApi.unreadTotal()`
- Profile tab: Custom badge dot for unread notification count from `notifApi.unreadCount()`
- Both update in real-time via socket events (`message:new`, `notification:new`)

### Create Listing (6-step wizard)
- Step 1: Type picker (New Product / Used Product / Service) — big cards with gradient active state
- Step 2: Category picker (tree: `/api/v1/categories/?tree=true`) + sub-category chips
- Step 3: Details form — dynamic fields per type:
  - New product: title, description, price, offer_price, negotiable toggle, stock, warranty, tags
  - Used product: + condition picker (new/like_new/good/fair)
  - Service: + charges type (fixed/hourly/per_visit), experience years, service area km
- Step 4: Media upload — expo-image-picker (lazy-imported), up to 10 images, thumbnails with remove, upload to `/api/v1/media/upload`
- Step 5: Location — "Use my location" GPS button (expo-location lazy-imported), manual fields (area, city, pincode, state, address)
- Step 6: Review + Publish → `POST /api/v1/listings/`
- Sticky footer with Back/Next or Back/Publish buttons
- Gradient progress bar showing completion %
- Draft auto-save to AsyncStorage (key `emergent_listing_draft`, 500ms debounce)
- Become Vendor modal for non-vendors (adds vendor role then retries publish)

### Trust & Verification Badges
- `TrustBadge` component — color-coded by tier (elite=gold, top-rated=green, trusted=blue, default=gray)
- Blue verified tick (Ionicons checkmark-circle) shown wherever vendor appears
- Added to: ListingCard, ChatThread header, VendorProfile

### Referral Card
- `ReferralCard` component — shows code, Copy (expo-clipboard) + Share (native Share API) buttons
- Stats: credited/pending count + credits earned
- Added to Profile screen

### Language Toggle
- English / हिन्दी chip selector on Profile screen
- UI-level state (no full i18n yet — web app handles that)

### Dashboard — New Listing CTA
- Gradient "New Listing" card for vendors
- Routes to `/create-listing`

### Device Permissions (app.json)
- iOS: NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSLocationWhenInUseUsageDescription
- Android: CAMERA, READ_EXTERNAL_STORAGE, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION

## Dependencies installed
- socket.io-client
- expo-image-picker
- expo-location
- expo-clipboard

## Known Issues
- Media images show as placeholders in web preview due to browser ORB policy (works on native)
- expo-image-picker and expo-location are lazy-imported to avoid `createPermissionHook` error on web
- Language toggle is UI-only (visual state, no actual i18n translation framework wired up)
