# Native Mobile Integration Guide (Android & iOS)

This module is designed specifically for mobile software engineers building the native BizReels client applications.

---

## Documents Index

| Document | Description |
|---|---|
| [**ANDROID_GUIDE.md**](./ANDROID_GUIDE.md) | **Complete Android Native Manual:** Retrofit Coroutine API interfaces, OkHttp single-flight 401 token authenticators, deep links, and Razorpay checkout flows. |
| [**ORDER_FLOW_GUIDE.md**](./ORDER_FLOW_GUIDE.md) | **Order Flow & Shipping Architecture:** Exhaustive 770+ line guide detailing order placement, escrow transitions, Shiprocket courier tracking, and status webhooks. |

---

## Quick Reference for Android Developers
- **Base URL:** `https://bizreels.in/api/v1/`
- **Auth Header:** `Authorization: Bearer <token>`
- **Deep Link Scheme:** `bizreel://auth/callback` and `bizreel://reels/{id}`
- **Google Sign-In:** Use native Google Identity SDK, obtain `idToken`, and call `POST /api/v1/auth/google/token`.
