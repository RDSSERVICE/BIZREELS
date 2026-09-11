# Master API Contract Summary & Quick Reference

> **Platform Version:** 1.4.0  
> **Total Endpoints:** 517  
> **Base URL:** `https://bizreels.in/api/v1`  
> **Source of Truth:** Express Route Definitions (`backend/src/routes/`)  

---

## Complete API Contract Table

| Method | Canonical Endpoint | Auth | Role | Request Body | Standard Response | Expected Status |
|---|---|---|---|---|---|---|
| `PATCH` | `/api/v1/admin/me/profile` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/admin/me/password` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/users` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/customers` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/customers/stats` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/customers/export` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/customers/:user_id/details` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/users/:user_id/reset-password` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/users/:user_id/verify` | Required | admin | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/admin/users/:user_id/activate` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/vendors` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/vendors/stats` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/vendors/export` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/vendors/:user_id/details` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/creators` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/creators/stats` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/creators/export` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/creators/:user_id/details` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/users/:user_id/freeze-wallet` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/users/:user_id/unfreeze-wallet` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/users/:user_id/ban` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/users/:user_id/unban` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/users/:user_id/add-role` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/users/:user_id/remove-role` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/users/:user_id` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/admin/users/:user_id` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/admin/users/:user_id/suspend` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `DELETE` | `/api/v1/admin/users/:user_id` | Required | admin | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/admin/customers/:user_id` | Required | admin | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/admin/vendors/:user_id` | Required | admin | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/admin/creators/:user_id` | Required | admin | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/admin/users/:user_id/login-history` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/listings` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/listings/bulk-approve` | Required | admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/listings/:listing_id/takedown` | Required | admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/listings/:listing_id/restore` | Required | admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/reels/stats` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/reels` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/reels/:reel_id/takedown` | Required | admin | `{ videoUrl, caption, taggedListings }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/reels/:reel_id/restore` | Required | admin | `{ videoUrl, caption, taggedListings }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/reels/:reel_id/moderate` | Required | admin | `{ videoUrl, caption, taggedListings }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/reels/:reel_id/boost` | Required | admin | `{ videoUrl, caption, taggedListings }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/reels/bulk-action` | Required | admin | `{ videoUrl, caption, taggedListings }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/boost/plans` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/boost/plans` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PATCH` | `/api/v1/admin/boost/plans/:id` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `GET` | `/api/v1/admin/locations` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/locations` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/requirements` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/requirements/:id/approve` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/requirements/:id/reject` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/category-requests` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/category-requests/:id/approve` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/category-requests/:id/reject` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/wallet/stats` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/wallet/user-search` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/wallet/transactions` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/wallet/transactions/export/csv` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/wallet/transactions/export/excel` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/wallet/manual-credit` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/wallet/manual-debit` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/wallet/recharges` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/wallet/refunds` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/wallet/refunds/:id/approve` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/wallet/refunds/:id/reject` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/reviews` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `DELETE` | `/api/v1/admin/reviews/:id` | Required | admin | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/admin/chat/reported` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/notifications/broadcast` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/coupons` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/coupons` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/cms` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PUT` | `/api/v1/admin/cms/:slug` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `GET` | `/api/v1/admin/app-settings` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/admin/app-settings` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `GET` | `/api/v1/admin/security/logs` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/analytics/overview` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/nudge/scan` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/seed/reset-demo` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/dev/purge-test-data` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/dev/rotate-admin-phone` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/listings/:listing_id/dev-backdate` | Required | admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/settings/integrations` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/admin/settings/integrations` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/admin/settings/integrations/test` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/transactions` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/transactions.csv` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/orders` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/commission/config` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/commission/config` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/commission/lead-boost` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/commission/gst` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/commission/history` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/commission/analytics` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/commissions` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/commissions/summary` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/commissions/rate/global` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/commissions/rate/category` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/audit-log` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/subscription/plans` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/subscription/plans` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PATCH` | `/api/v1/admin/subscription/plans/:id` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/admin/subscription/plans/:id` | Required | admin | `None` | `{ success, message }` | `200 OK` |
| `POST` | `/api/v1/admin/subscription/plans/:id/activate` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/subscription/plans/:id/deactivate` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/subscription/plans/:id/archive` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/subscription/plans/:id/duplicate` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/subscription/user-subscriptions` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/subscription/user-subscriptions/:id/cancel` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/subscription/user-subscriptions/:id/extend` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/subscription/user-subscriptions/:id/renew` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/subscription/coupons` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/subscription/coupons` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PATCH` | `/api/v1/admin/subscription/coupons/:id` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/admin/subscription/coupons/:id` | Required | admin | `None` | `{ success, message }` | `200 OK` |
| `POST` | `/api/v1/admin/subscription/coupons/:id/toggle` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/subscription/invoices` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/subscription/invoices/:id/pdf` | Required | admin | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/admin/subscription/revenue` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/reports/financial` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/admin/locations/radius` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/admin/locations/radius` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `GET` | `/api/v1/admin/credit-rates` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/credit-rates` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/contact-submissions` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/admin/contact-submissions/:id` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/admin/contact-submissions/:id` | Required | admin | `None` | `{ success, message }` | `200 OK` |
| `POST` | `/api/v1/ai/generate-listing-content` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/transcribe-audio` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/improve-description` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/generate-title` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/detect-category` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/parse-demand` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/match-vendors` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/suggest-price` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/negotiate` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/generate-image` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/generate-reel` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/generate-specifications` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/ai/generate-description` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/analytics/` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/analytics/vendor` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/analytics/creator` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/analytics/summary` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/auth/register` | Public | Public | `{ name, email, password, phone, roles }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/login` | Public | Public | `{ email, password }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/auth/dev/admin-login` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/otp/send` | Public | Public | `{ phone, channel }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/otp/resend` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/otp/verify` | Public | Public | `{ phone, otp, name, roles }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/auth/otp/request` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/phone/send-otp` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/phone/verify-otp` | Public | Public | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/auth/send-otp` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/verify-otp` | Public | Public | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/auth/forgot-password` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/reset-password` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/refresh-token` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/refresh` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/auth/google` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/auth/google/callback` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/auth/app/google` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/auth/app/google/callback` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/auth/google/token` | Required | Any Auth | `{ idToken, role }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/auth/google/mobile` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/app/google` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/auth/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `PATCH` | `/api/v1/auth/profile` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/auth/users/:id/follow` | Required | Any Auth | `{}` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/users/:id/unfollow` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `DELETE` | `/api/v1/auth/profile` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/auth/me` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/auth/delete-account` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `POST` | `/api/v1/auth/logout` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/auth/logout-all` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PATCH` | `/api/v1/auth/switch-role` | Required | Any Auth | `{ role }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/auth/add-role` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/cart/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/cart/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `POST` | `/api/v1/cart/add` | Required | Any Auth | `{ listing_id, quantity, customization_notes }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/cart/me/add` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PATCH` | `/api/v1/cart/items/:listing_id` | Required | Any Auth | `{ quantity }` | `{ success, data }` | `200 OK` |
| `PATCH` | `/api/v1/cart/me/items/:listing_id` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/cart/items/:listing_id` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/cart/me/items/:listing_id` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `POST` | `/api/v1/cart/checkout` | Required | Any Auth | `{ delivery_address, payment_method }` | `{ success, data: { order_ids, razorpay_order } }` | `201 Created` |
| `POST` | `/api/v1/cart/me/checkout` | Required | Any Auth | `{ ...payload }` | `{ success, data: { order_ids, razorpay_order } }` | `201 Created` |
| `GET` | `/api/v1/categories/` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/categories/:slug` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/categories/` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/categories/bulk-upload` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PATCH` | `/api/v1/categories/:cid` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/categories/:cid` | Required | admin | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/chat/conversations` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/chat/:conversationId/messages` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/chat/messages` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `DELETE` | `/api/v1/chat/:conversationId/clear` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/chat/:conversationId` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/chat/messages/:messageId/me` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/chat/messages/:messageId/everyone` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/creator/me/verification-status` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/creator/me/send-contact-otp` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/creator/me/verify-contact` | Required | Any Auth | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/creator/me/verify-document` | Required | Any Auth | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/creator/me/verify-payment` | Required | Any Auth | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/creator/me/verification/pan` | Required | Any Auth | `{ pan_number, name }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/creator/me/verification/aadhaar/initiate` | Required | Any Auth | `{ aadhaar_number }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/creator/me/verification/aadhaar/verify-otp` | Required | Any Auth | `{ ref_id, otp }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/creator/me/verification/bank` | Required | Any Auth | `{ account_number, ifsc }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/creator/me/verification/upi` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/creator/dashboard` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/creator/portfolio` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/creator/portfolio/reels` | Required | Any Auth | `{ videoUrl, caption, taggedListings }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/creator/portfolio/images` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `DELETE` | `/api/v1/creator/portfolio/:type/:id` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/creator/pricing` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/creator/pricing` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `GET` | `/api/v1/creator/availability` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/creator/availability` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `GET` | `/api/v1/creator/orders` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/creator/orders/:id/status` | Required | Any Auth | `{ status, reason }` | `{ success, data }` | `200 OK` |
| `GET` | `/api/v1/creator-marketplace/discover` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/creator-marketplace/cities` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/creator-marketplace/categories` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/creator-marketplace/:id/profile` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/feed/` | Optional | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/feed/reels` | Optional | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/feed/home-trending` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/follows/:user_id` | Required | Any Auth | `{}` | `{ success, data }` | `201 Created` |
| `DELETE` | `/api/v1/follows/:user_id` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/follows/me/following` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/follows/me/followers` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/hires/` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/hires/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/hires/:id` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `PATCH` | `/api/v1/hires/:id/edit` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `PATCH` | `/api/v1/hires/:id/cancel` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/hires/campaign/:id/deliverable` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PATCH` | `/api/v1/hires/campaign/:id/milestone/:milestoneId/approve` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/identity/aadhaar/verify` | Required | Any Auth | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/identity/pan/verify` | Required | Any Auth | `{ pan_number, name }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/identity/gst/verify` | Required | Any Auth | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/identity/bank/verify` | Required | Any Auth | `{ account_number, ifsc }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `GET` | `/api/v1/identity/trust-plus/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/identity/me/status` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/identity/me/docs` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `DELETE` | `/api/v1/identity/docs/:doc_id` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/health` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/keep-alive` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/keepalive` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/users/me/referrals` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/users/me/referrals/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/subscription` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/subscription/plans` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/subscription/change` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/subscription/purchase-razorpay` | Required | Any Auth | `{ ...payload }` | `{ success, data: { razorpay_order, payment_id } }` | `201 Created` |
| `GET` | `/api/v1/vendor/dashboard` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendor/analytics/overview` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendor/analytics/listings` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendor/analytics/timeseries` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendor/analytics/boost-roi` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/vendor/analytics/simulate` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/vendor/analytics` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/reels/:id` | Public | Public | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/reels/share/:id` | Public | Public | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/cms/:slug` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/contact` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/newsletter/subscribe` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/inquiries/` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/inquiries/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/inquiries/:id/reply` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PATCH` | `/api/v1/inquiries/:id/reply` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `PATCH` | `/api/v1/inquiries/:id/close` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/inquiries/:id` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `POST` | `/api/v1/listings/:listing_id/like` | Required | Any Auth | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/listings/:listing_id/save` | Required | Any Auth | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/interactions/me/saved` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/interactions/me/liked` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/kyc/me/submit` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/kyc/me` | Required | admin | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/admin/kyc` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/kyc/:kid/approve` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/kyc/:kid/reject` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/users/:user_id/trust-score` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/listings/` | Optional | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/listings/limits/media` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/listings/ai-copy` | Optional | vendor, creator, admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/listings/bulk` | Optional | vendor, admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/listings/:id` | Optional | Public | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `POST` | `/api/v1/listings/:id/like` | Optional | Public | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/listings/:id/share` | Optional | Public | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/listings/:id/save` | Required | vendor, admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/listings/:id/unsave` | Required | vendor, admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/listings/:id/save-image` | Required | vendor, admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/listings/:id/unsave-image` | Required | vendor, admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/listings/:id/duplicate` | Required | vendor, admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/listings/:id/analytics` | Required | vendor, admin | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `PATCH` | `/api/v1/listings/:id/stock` | Required | vendor, admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/listings/` | Required | vendor, admin | `{ title, price, category, type, description }` | `{ success, data }` | `201 Created` |
| `PUT` | `/api/v1/listings/:id` | Required | vendor, admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `PATCH` | `/api/v1/listings/:id` | Required | vendor, admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/listings/:id` | Required | vendor, admin | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/live/` | Required | vendor, creator, admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/live/` | Required | vendor, creator, admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/live/:id/end` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/live/:id/join` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/live/:id/leave` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/live/:id/like` | Required | Any Auth | `{}` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/live/:id/comment` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/location/reverse-geocode` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/location/pincode-lookup` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/location/states` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/location/districts` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/media/sign` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/media/upload` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/notifications/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/notifications/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/notifications/unread-count` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/notifications/me/unread-count` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/notifications/read-all` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/notifications/read-all` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/notifications/me/read-all` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PATCH` | `/api/v1/notifications/:id/read` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/notifications/:id/read` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `DELETE` | `/api/v1/notifications/:id` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/offers/active` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/offers/:id/click` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/offers/validate-coupon` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/offers/applicable` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/offers/calculate-shipping` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/offers/admin/stats` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/offers/admin` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/offers/admin` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/offers/admin/bulk-status` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/offers/admin/bulk-delete` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PUT` | `/api/v1/offers/admin/:id` | Required | admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/offers/admin/:id` | Required | admin | `None` | `{ success, message }` | `200 OK` |
| `POST` | `/api/v1/offers/admin/:id/activate` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/offers/admin/:id/deactivate` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/offers/admin/:id/duplicate` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/offers/admin/:id/analytics` | Required | admin | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/onboarding/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/orders/shiprocket/webhook` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/orders/shipping/webhook` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/orders/razorpay/create-order` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/orders/` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/orders/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/orders/vendor/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/orders/:id` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/orders/:id/track` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `POST` | `/api/v1/orders/:id/shiprocket/sync` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PATCH` | `/api/v1/orders/:id/status` | Required | Any Auth | `{ status, reason }` | `{ success, data }` | `200 OK` |
| `PUT` | `/api/v1/orders/:id/status` | Required | Any Auth | `{ status, reason }` | `{ success, data }` | `200 OK` |
| `PATCH` | `/api/v1/orders/:id/cancel` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `PATCH` | `/api/v1/orders/:id` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `PUT` | `/api/v1/orders/:id` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/reviews` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/reviews` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/reviews/:rid` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/reviews/:rid` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `POST` | `/api/v1/reviews/:rid/reply` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/reviews/:rid/helpful` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/reviews/vendor/:vendor_id/summary` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/notifications/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/notifications/me/unread-count` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/notifications/:nid/read` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/notifications/me/read-all` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `DELETE` | `/api/v1/notifications/:nid` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/wallet/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/wallet/me/transactions` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/wallet/me/topup` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/payments/order` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/payments/verify` | Required | Any Auth | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/payments/dev/simulate-success` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/payments/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `POST` | `/api/v1/payments/webhook` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/subscriptions/subscribe` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/subscriptions/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `POST` | `/api/v1/subscriptions/:sid/cancel` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/kyc/me/submit` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/kyc/me` | Required | admin | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/admin/kyc` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/kyc/:kid/approve` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/kyc/:kid/reject` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/users/:user_id/trust-score` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/reels/saved` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/reels/my-reels` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/reels/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/reels/public/:id` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/reels/:id/comments` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/reels/:id/product-details` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/reels/:id` | Optional | Public | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `POST` | `/api/v1/reels/` | Optional | Public | `{ videoUrl, caption, taggedListings }` | `{ success, data }` | `201 Created` |
| `DELETE` | `/api/v1/reels/:id` | Optional | Public | `None` | `{ success, message }` | `200 OK` |
| `POST` | `/api/v1/reels/:id/view` | Optional | Public | `{ videoUrl, caption, taggedListings }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/reels/:id/like` | Required | Any Auth | `{}` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/reels/:id/comments` | Required | Any Auth | `{ text }` | `{ success, data }` | `201 Created` |
| `DELETE` | `/api/v1/reels/comments/:commentId` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `POST` | `/api/v1/reels/:id/save` | Required | Any Auth | `{ videoUrl, caption, taggedListings }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/reels/:id/unsave` | Required | Any Auth | `{ videoUrl, caption, taggedListings }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/reels/:id/boost` | Required | Any Auth | `{ videoUrl, caption, taggedListings }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/referrals/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/referrals/dashboard` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/referrals/link` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/referrals/list` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/referrals/code` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/referrals/admin/analytics` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/referrals/admin/list` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/referrals/admin/status` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/referrals/admin/config` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/referrals/admin/config` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/referrals/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/reports` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/admin/reports` | Required | admin | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/admin/reports/:rid/resolve` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/admin/reports/:rid/dismiss` | Required | admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/requirements/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/requirements/quotes` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/requirements/` | Required | customer, admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/requirements/quotes` | Required | vendor, admin | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/requirements/:id` | Required | customer, admin | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `PUT` | `/api/v1/requirements/:id` | Required | customer, admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/requirements/:id` | Required | customer, admin | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/requirements/:id/quotes` | Required | customer, admin | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `PATCH` | `/api/v1/requirements/quotes/:quoteId` | Required | customer, admin | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/requirements/quotes/:quoteId` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/reviews/user/:userId` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/reviews/listing/:listingId` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/reviews/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/reviews/` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `DELETE` | `/api/v1/reviews/:id` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/search/` | Optional | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/search/suggest` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/seo/listing/:idOrSlug` | Public | Public | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/seo/product/:idOrSlug` | Public | Public | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/seo/sitemap.xml` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/seo/sitemap` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/seo/sitemap-index.xml` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/seo/robots.txt` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/subscriptions/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/subscriptions/plans` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/subscriptions/purchase` | Required | Any Auth | `{ ...payload }` | `{ success, data: { razorpay_order, payment_id } }` | `201 Created` |
| `POST` | `/api/v1/subscriptions/cancel` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/subscriptions/history` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/subscriptions/upgrade` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/subscriptions/downgrade` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/transactions/vendor` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/transactions/creator` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/upload/image` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/users/` | Optional | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/users/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `PATCH` | `/api/v1/users/me` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `GET` | `/api/v1/users/me/onboarding-checklist` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/users/me/saved` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/users/me/switch-role` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/users/me/add-role` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/users/me/fcm-token` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `DELETE` | `/api/v1/users/me/fcm-token/:token` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/users/me` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/users/profile` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `DELETE` | `/api/v1/users/delete-account` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `GET` | `/api/v1/users/me/role-activity` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/users/creators/public` | Optional | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/users/me` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `GET` | `/api/v1/users/me/interests` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PATCH` | `/api/v1/users/me/interests` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `GET` | `/api/v1/users/me/activity-counts` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/users/me/activities` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/users/me/track-interaction` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/users/:userId` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/users/:userId/profile` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendors/me/offers` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendors/me/offers/categories` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/vendors/me/offers` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PUT` | `/api/v1/vendors/me/offers/:offerId` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `DELETE` | `/api/v1/vendors/me/offers/:offerId` | Required | Any Auth | `None` | `{ success, message }` | `200 OK` |
| `POST` | `/api/v1/vendors/me/offers/:offerId/duplicate` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `PATCH` | `/api/v1/vendors/me/offers/:offerId/status` | Required | Any Auth | `{ status, reason }` | `{ success, data }` | `200 OK` |
| `POST` | `/api/v1/vendors/me/offers/:offerId/validate-coupon` | Public | Public | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/vendors/me/referral-offer-stats` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendors/me/verification-status` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/vendors/me/send-contact-otp` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/vendors/me/verify-contact` | Required | Any Auth | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/vendors/me/verify-document` | Required | Any Auth | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/vendors/me/verify-payment` | Required | Any Auth | `{ ...payload }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/vendors/me/verification/pan` | Required | Any Auth | `{ pan_number, name }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/vendors/me/verification/aadhaar/initiate` | Required | Any Auth | `{ aadhaar_number }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/vendors/me/verification/aadhaar/verify-otp` | Required | Any Auth | `{ ref_id, otp }` | `{ success, data: { user, accessToken, refreshToken } }` | `200 OK` |
| `POST` | `/api/v1/vendors/me/verification/gstin` | Required | Any Auth | `{ gstin }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/vendors/me/verification/bank` | Required | Any Auth | `{ account_number, ifsc }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/vendors/me/verification/upi` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/vendors/me/settings` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/vendors/me/send-settings-otp` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/vendors/me/settings` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/vendors/me/profile` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `PUT` | `/api/v1/vendors/me/profile` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `PATCH` | `/api/v1/vendors/me/profile` | Required | Any Auth | `{ ...updates }` | `{ success, data }` | `200 OK` |
| `GET` | `/api/v1/vendors/me/offers/legacy` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/vendors/me/offers/legacy` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/vendors/ifsc-lookup/:ifsc` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendors/:user_id` | Optional | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendors/:user_id/profile` | Optional | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendors/:user_id/listings` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendors/:user_id/followers/count` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/vendors/leaderboard/fast-responders` | Public | Public | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/vendors/:user_id/reveal-contact` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/wallet/` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/wallet/me` | Required | Any Auth | `None (Query params)` | `{ success, data: { ...item } }` | `200 OK` |
| `GET` | `/api/v1/wallet/balance` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/wallet/recharge` | Required | Any Auth | `{ amount }` | `{ success, data: { razorpay_order, payment_id } }` | `201 Created` |
| `GET` | `/api/v1/wallet/transactions` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/wallet/topup-packs` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/wallet/credit-rates` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `POST` | `/api/v1/wallet/subscribe` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `POST` | `/api/v1/wallet/payout` | Required | Any Auth | `{ ...payload }` | `{ success, data }` | `201 Created` |
| `GET` | `/api/v1/wallet/vendor` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
| `GET` | `/api/v1/wallet/creator` | Required | Any Auth | `None (Query params)` | `{ success, data: [ ...items ], pagination }` | `200 OK` |
