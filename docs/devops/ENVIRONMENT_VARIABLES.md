# Environment Variables

The application requires specific configurations configured in `.env` files.

---

## 1. Backend Configuration (`backend/.env`)

| Variable Name | Required | Default / Value | Description |
| :--- | :--- | :--- | :--- |
| **`PORT`** | Yes | `8001` | The network port the Express application server listens on. |
| **`NODE_ENV`** | Yes | `development` | The runtime environment (`development`, `production`). |
| **`MONGO_URL`** | Yes | `mongodb://localhost:27017/bizreels` | Connection URL pointing to the MongoDB cluster. |
| **`DB_NAME`** | Yes | `bizreels` | Target database name inside MongoDB. |
| **`JWT_SECRET`** | Yes | `dev-secret-change-in-production` | Secret token used to sign authentication access and refresh keys. |
| **`ACCESS_TOKEN_MINUTES`**| Yes | `15` | Expiry duration for signed access tokens (in minutes). |
| **`REFRESH_TOKEN_DAYS`** | Yes | `30` | Expiry duration for signed refresh tokens (in days). |
| **`CORS_ORIGINS`** | Yes | `http://localhost:5173,http://localhost:3000` | Comma-separated list of allowed origin URLs for CORS security. |
| **`MSG91_AUTH_KEY`** | No | `your-msg91-auth-key` | Auth credential for the MSG91 SMS OTP system. |
| **`MSG91_TEMPLATE_ID`** | No | `your-template-id` | Template ID configured for OTP delivery in MSG91. |
| **`MSG91_SENDER_ID`** | No | `your-sender-id` | Registered Sender ID for MSG91 outbound SMS. |
| **`MSG91_DEV_MODE`** | Yes | `true` | When set to `true`, bypasses MSG91 API requests and logs OTP codes to the console. |
| **`CLOUDINARY_CLOUD_NAME`**| No | `your-cloud-name` | Cloud name identifier for Cloudinary media bucket. |
| **`CLOUDINARY_API_KEY`** | No | `your-api-key` | API access key credentials for Cloudinary uploads. |
| **`CLOUDINARY_API_SECRET`**| No | `your-api-secret` | API signature secret credentials for Cloudinary uploads. |
| **`CLOUDINARY_DEV_MODE`** | Yes | `true` | When `true`, saves media assets under a testing sandbox folder. |
| **`RAZORPAY_KEY_ID`** | No | `your-key-id` | API Key ID registered in Razorpay checkout settings. |
| **`RAZORPAY_KEY_SECRET`** | No | `your-key-secret` | API Secret Key registered in Razorpay checkout settings. |
| **`RAZORPAY_WEBHOOK_SECRET`**| No | `your-webhook-secret` | Signature verification key for Razorpay webhooks. |
| **`RAZORPAY_DEV_MODE`** | Yes | `true` | When `true`, allows bypass simulations on payment confirmations. |
| **`GOOGLE_CLIENT_ID`** | No | `your-google-client-id` | Client ID credential for Google OAuth integrations. |
| **`GOOGLE_CLIENT_SECRET`**| No | `your-google-client-secret` | Client Secret credential for Google OAuth integrations. |
| **`GOOGLE_AI_API_KEY`** | No | `your-gemini-ai-key` | API authorization key for Google Gemini model APIs. |
| **`SHIPROCKET_EMAIL`** | No | `your-shiprocket-email` | Shiprocket account email for JWT authentication. |
| **`SHIPROCKET_PASSWORD`** | No | `your-shiprocket-password` | Shiprocket account password for JWT authentication. |
| **`SHIPROCKET_API_TOKEN`** | No | `your-shiprocket-token` | Optional direct pre-generated Shiprocket bearer token. |
| **`SHIPROCKET_PICKUP_PINCODE`** | No | `110001` | Default origin pickup pincode for courier rate lookups. |
| **`ADMIN_PHONE`** | Yes | `9999999999` | Mobile phone number linked to the system's default admin profile. |
| **`ADMIN_NAME`** | Yes | `Admin` | Default name label for the platform administrator. |
| **`ALLOW_DEV_ADMIN_LOGIN`**| Yes | `true` | Toggles the dev admin bypass login endpoint. |
| **`DEV_ADMIN_OVERRIDE_TOKEN`**| No | `your-dev-token` | Secret string required to authenticate via the dev admin login route. |
| **`META_APP_ID`** | No | `your_meta_app_id` | Meta Developer App ID for WhatsApp Business Cloud API & Embedded Signup. |
| **`META_APP_SECRET`** | No | `your_meta_app_secret` | Meta App Secret for validating incoming webhook signatures (HMAC-SHA256). |
| **`META_WA_VERIFY_TOKEN`** | No | `bizreels_whatsapp_verify_2026` | Token used by Meta to verify the incoming webhook callback URL. |
| **`META_WA_ACCESS_TOKEN`** | No | `your_system_user_token` | Permanent Meta System User Access Token for Graph API message operations. |
| **`META_WA_PHONE_NUMBER_ID`** | No | `your_phone_number_id` | Default BizReels fallback phone number ID in WhatsApp Business Platform. |
| **`META_WA_WABA_ID`** | No | `your_waba_id` | BizReels WhatsApp Business Account (WABA) ID. |
| **`WHATSAPP_PROVIDER`** | No | `meta` | Outbound and CRM WhatsApp provider selector (`meta` or `twilio`). |
| **`EXOTEL_SID`** | No | `your_exotel_sid` | Exotel Account SID for initiating click-to-call telephony. |
| **`EXOTEL_API_KEY`** | No | `your_exotel_api_key` | Exotel API Key credential for telephony REST requests. |
| **`EXOTEL_API_TOKEN`** | No | `your_exotel_api_token` | Exotel API Token credential for telephony REST requests. |
| **`EXOTEL_PHONE`** | No | `0XXXXXXXXXX` | Virtual Landline / Caller ID allocated by Exotel for proxy calls. |
| **`APP_URL`** | No | `https://api.yourdomain.com` | Base public server URL passed to Exotel for receiving call webhook callbacks. |

---

## 2. Frontend Configuration (`frontend/.env`)

| Variable Name | Required | Default / Value | Description |
| :--- | :--- | :--- | :--- |
| **`VITE_BACKEND_URL`** | Yes | `http://localhost:5000` | The target backend Express API server base URL. |
| **`VITE_API_URL`** | No | `http://localhost:5000/api/v1` | Explicit REST API prefix override. |
| **`VITE_GOOGLE_MAPS_API_KEY`** | No | `your_api_key` | Google Maps Platform JavaScript API Key. |
| **`VITE_META_APP_ID`** | No | `your_meta_app_id` | Meta Developer App ID for Facebook JS SDK (Embedded Signup popup). |
| **`VITE_META_CONFIG_ID`** | No | `your_config_id` | Meta Embedded Signup Configuration ID for onboarding WhatsApp numbers. |
