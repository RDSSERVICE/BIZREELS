# Emergent Phase 0 — Auth Testing Guide (for tester agent)

## Env
- Backend base URL: `${REACT_APP_BACKEND_URL}/api` (production preview)
  - Frontend `.env` has `REACT_APP_BACKEND_URL` pointing at the preview host.
- Local backend also listens on `http://localhost:8001/api`.
- MSG91 is intentionally in DEV MODE (`OTP_DEV_MODE=true`). The `dev_otp` field is returned in the send-OTP response — use it directly to verify.

## Endpoints (versioned under `/api/v1`)
- `GET  /api/health`
- `GET  /api/openapi.json`
- `POST /api/v1/auth/otp/send`      body `{ "phone": "9876543210" }`
- `POST /api/v1/auth/otp/verify`    body `{ "phone": "9876543210", "otp": "123456", "name": "Priya", "roles": ["customer"] }`
- `POST /api/v1/auth/refresh`       body `{ "refresh_token": "..." }`
- `POST /api/v1/auth/logout`        body `{ "refresh_token": "..." }`
- `GET  /api/v1/users/me`           header `Authorization: Bearer <access_token>`
- `PATCH /api/v1/users/me`          body `{ "name?", "email?", "profile_pic?", "gender?", "dob?", "current_role?" }`
- `POST /api/v1/users/me/switch-role` body `{ "role": "vendor" }`
- `POST /api/v1/users/me/add-role`    body `{ "role": "creator" }`

## Frontend routes
- `/`           Landing (public)
- `/login`      Phone input + Send OTP
- `/verify-otp` OTP entry (dev banner shows OTP when dev mode)
- `/onboarding` New users (no name) pick name + roles
- `/dashboard`  Authenticated home
- `/profile`    Edit profile, switch role, add role, logout

## Key behaviours to verify
- Duplicate phone login returns SAME user (no error, roles preserved).
- New user without a name is auto-routed to `/onboarding`; onboarded users go straight to `/dashboard`.
- OTP TTL is 5 minutes; TTL index on `otp_requests.expires_at`.
- Refresh tokens are stored as sha256 hashes with TTL of 30 days.
- Rate limit on `POST /api/v1/auth/otp/send`: 3 requests per phone per 10 min (returns 429 on excess).
- Admin phone `9999999999` is seeded on startup with roles `["admin", "customer"]`.
- `admin` role can only be assigned by the seed — the `add-role` API rejects `admin`.

## Data test IDs on the frontend
- `landing-get-started-btn`, `landing-login-link`
- `phone-input`, `send-otp-btn`
- `otp-input`, `verify-otp-btn`, `resend-otp-btn`, `resend-timer`, `dev-otp-banner`, `dev-otp-value`
- `onboarding-name-input`, `role-option-customer|vendor|creator`, `onboarding-continue-btn`
- `dashboard-body`, `profile-link`, `logout-btn`, `role-chip-<role>`
- `profile-name-input`, `profile-email-input`, `profile-gender-trigger`, `profile-dob-input`, `profile-pic-input`, `profile-save-btn`, `profile-logout-btn`
- `switch-role-trigger`, `switch-role-option-<role>`
- `add-role-trigger`, `add-role-option-<role>`, `add-role-btn`
