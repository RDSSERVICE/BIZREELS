# Environment Variables

The application requires specific configurations configured in `.env` files.

---

## 1. Backend Configuration (`backend/.env`)

| Variable Name | Required | Default / Value | Description |
| :--- | :--- | :--- | :--- |
| **`PORT`** | Yes | `8001` | The network port the Express application server listens on. |
| **`NODE_ENV`** | Yes | `development` | The runtime environment (`development`, `production`). |
| **`MONGO_URL`** | Yes | `mongodb://localhost:27017/emergent` | Connection URL pointing to the MongoDB cluster. |
| **`DB_NAME`** | Yes | `emergent` | Target database name inside MongoDB. |
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
| **`ADMIN_PHONE`** | Yes | `9999999999` | Mobile phone number linked to the system's default admin profile. |
| **`ADMIN_NAME`** | Yes | `Admin` | Default name label for the platform administrator. |
| **`ALLOW_DEV_ADMIN_LOGIN`**| Yes | `true` | Toggles the dev admin bypass login endpoint. |
| **`DEV_ADMIN_OVERRIDE_TOKEN`**| No | `your-dev-token` | Secret string required to authenticate via the dev admin login route. |

---

## 2. Frontend Configuration (`frontend/.env`)

| Variable Name | Required | Default / Value | Description |
| :--- | :--- | :--- | :--- |
| **`VITE_BACKEND_URL`** | Yes | `http://localhost:8001` | The target backend Express API server base URL. |
