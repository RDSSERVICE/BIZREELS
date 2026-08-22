# BizReel App — Project Overview

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | Expo SDK 57 + React Native 0.86 |
| Navigation | Expo Router v4 (file-based routing) |
| Language | TypeScript 6 |
| Styling | React Native StyleSheet (no Tailwind) |
| Server State | TanStack Query v5 |
| Offline Cache | react-native-mmkv (sync, fast key-value store) |
| HTTP | axios |
| Forms | react-hook-form + zod (validation) |
| Animations | react-native-reanimated v4 |

## Environment Variables

Stored in `.env` at root. Expo reads them via `expo-constants`.

```
BASE_URL=https://bizreels-backend.onrender.com/api/v1
```

Accessed in code via `process.env.EXPO_PUBLIC_BASE_URL`

> **Important**: Expo only exposes env variables prefixed with `EXPO_PUBLIC_` to the client bundle.
> The key in `.env` was updated from `BASE_URL` → `EXPO_PUBLIC_BASE_URL` for this reason.

## Folder Structure

```
src/
├── app/                    # Expo Router pages (file = route)
│   ├── _layout.tsx         # Root layout — QueryClient, ThemeProvider
│   ├── (auth)/             # Auth group (no tab bar)
│   │   └── register.tsx    # Register screen
│   └── (tabs)/             # Authenticated tab screens
│       ├── home.tsx
│       ├── index.tsx       # Reels feed
│       ├── search.tsx
│       └── profile.tsx     # User profile screen ← /users/me
├── components/             # Shared UI components
│   └── ui/                 # Generic primitives
├── constants/
│   └── theme.ts            # ALL design tokens: colors, spacing, typography, radius
├── hooks/
│   └── use-theme.ts        # Returns current Colors[scheme]
├── lib/
│   ├── api.ts              # axios instance with base URL + interceptors
│   ├── query-client.ts     # TanStack QueryClient configured with AsyncStorage persister
│   └── storage.ts          # expo-secure-store backed token cache (in-memory + persisted)
├── features/
│   ├── auth/
│   │   ├── api.ts          # register / login / fetchCurrentUser / fetchUserProfile
│   │   ├── context.tsx     # AuthProvider — status: loading | authed | unauthed
│   │   ├── mutations.ts    # useRegister, useLogin TanStack mutations
│   │   ├── queries.ts      # useCurrentUserProfile — GET /users/me
│   │   ├── schema.ts       # Zod schemas for form validation
│   │   └── types.ts        # AuthUser, AuthResponse, UsersMeResponse, etc.
│   └── reels/
│       ├── api.ts          # fetchReelsFeed
│       ├── queries.ts      # useReelsFeed (infinite query)
│       ├── reel-item.tsx   # Single reel card component
│       └── types.ts        # Reel, ReelsFeedResponse, etc.
└── global.css              # Web CSS variables
```

## Theme System

All design tokens live in `src/constants/theme.ts`:
- `Colors` — light/dark palettes including brand colors
- `BrandColors` — primary gold (#C8860A), accent, etc. (never changes with scheme)
- `Spacing` — numeric scale (half=2, one=4 … six=64)
- `Radius` — border radius scale
- `Typography` — font sizes and weights

To change the look of the whole app, edit `src/constants/theme.ts`.

## API

**Base URL**: `https://bizreels-backend.onrender.com/api/v1`

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Session hydration — verify stored token on app start |
| GET | `/users/me` | Full user profile for the Profile screen |

### Register / Login Response
```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": { "_id": "...", "name": "...", "email": "...", ... },
    "accessToken": "JWT...",
    "refreshToken": "string"
  }
}
```

> `POST /auth/login` returns the same shape.

### GET /users/me Response

Returns a **flat `{ user }` object** — no `success`/`data` wrapper.

```json
{
  "user": {
    "_id": "...",
    "name": "Test User",
    "email": "user@example.com",
    "roles": ["customer"],
    "current_role": "customer",
    "activeRole": "customer",
    "kyc_status": "unverified",
    "profile_pic": null,
    "avatarUrl": null,
    "gender": null,
    "dob": null,
    "occupation": null,
    "profession": null,
    "language": "English",
    "is_active": true,
    "is_subscribed_verified": false,
    "subscription": {
      "plan": "Free Member",
      "plan_id": null,
      "startedAt": null,
      "expiresAt": null,
      "boostCredits": 0,
      "autoRenew": false,
      "status": "inactive"
    },
    "rating_avg": 0,
    "rating_count": 0,
    "walletBalance": 0,
    "trust_score": null,
    "city": null,
    "followersCount": 0,
    "followingCount": 0,
    "chat_response_rate": 0,
    "avg_response_time_seconds": null,
    "customerProfile": {
      "savedListings": [],
      "interestsSelectedAt": null,
      "interests": []
    },
    "vendorProfile": null,
    "creatorProfile": null,
    "location": {
      "type": "Point",
      "coordinates": [0, 0],
      "address": null,
      "city": null,
      "district": null,
      "state": null,
      "pincode": null
    },
    "created_at": "...",
    "updated_at": "...",
    "id": "..."
  }
}
```

## Offline-First Caching Strategy

- TanStack Query is configured with an **AsyncStorage** persister (`@tanstack/query-async-storage-persister`).
- Persister serializes the full query cache to AsyncStorage on every cache change.
- On app start, the cache is rehydrated from AsyncStorage before the first render — stale data shows instantly while a background refetch runs.
- Auth tokens are stored in an in-memory cache (`tokenStore`) that is hydrated from AsyncStorage on startup. This keeps the axios interceptor synchronous while still persisting tokens across restarts.
- Mutations (register, login) are NOT cached — they always hit the network.
- Queries (user profile, listings, etc.) are cached and served from AsyncStorage when offline.

> **Note on MMKV**: `react-native-mmkv` v4 requires JSI/Nitro Modules and won't work in Expo Go — it needs a native dev build (`npx expo run:ios`). AsyncStorage is used instead as it works in both Expo Go and production. If you switch to a dev build, you can swap AsyncStorage for MMKV in `src/lib/storage.ts` and `src/lib/query-client.ts` without touching anything else.

## Navigation / Auth Flow

```
app/
├── (auth)/          ← group, no tab bar, unauthenticated screens
│   └── register.tsx
└── (tabs)/          ← group, shows tab bar, authenticated screens
    ├── index.tsx
    └── explore.tsx
```

Expo Router groups `(auth)` and `(tabs)` are used to separate authenticated from unauthenticated flows without affecting the URL path.

## Profile Screen

The profile screen (`src/app/(tabs)/profile.tsx`) fetches data from `GET /users/me` and displays a rich, scrollable layout.

### Data flow

```
profile.tsx
  └── useCurrentUserProfile()          ← src/features/auth/queries.ts
        └── fetchUserProfile()         ← src/features/auth/api.ts
              └── GET /users/me        ← axios instance (src/lib/api.ts)
                    └── Bearer token attached by request interceptor
```

### UI sections

| Section | Fields displayed |
|---------|-----------------|
| Header card | Avatar (image or gold initials fallback), name, role badge, email, KYC status pill, subscription plan pill |
| Stats row | Followers count, following count, rating avg + count |
| Wallet card | Wallet balance (₹), subscription plan + status |
| About section | Language, gender, date of birth, occupation, location (city + state), member since |
| Footer | Log Out button |

### States handled

- **Loading** — `ActivityIndicator` centered on screen while the query is in-flight.
- **Error** — error message + "Try Again" button that calls `refetch()`.
- **Pull to refresh** — `RefreshControl` on the `ScrollView` triggers a background `refetch()`.
- **No avatar** — falls back to a gold circle showing the user's initials.
- **Null fields** — any `null` value renders as `—` via the `capitalize` / `formatDate` helpers.

### Key files changed

| File | Change |
|------|--------|
| `src/features/auth/types.ts` | Expanded `AuthUser` with all `/users/me` fields; added `UserSubscription`, `UserLocation`, `CustomerProfile`, `UsersMeResponse` interfaces |
| `src/features/auth/api.ts` | Added `fetchUserProfile()` — `GET /users/me`, typed with `UsersMeResponse` |
| `src/features/auth/queries.ts` | New file — `useCurrentUserProfile()` TanStack Query hook (`staleTime` 5 min, `gcTime` 30 min) |
| `src/app/(tabs)/profile.tsx` | Full rebuild — scrollable profile with all sections above |
