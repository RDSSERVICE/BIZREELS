# Third-Party Services & Integrations

BizReels integrates with external systems to provide AI, payment, messaging, notification, and media storage capabilities.

---

## 1. Google Gemini (Multimodal AI)

* **Service Module**: `backend/src/services/ai.service.js`
* **API Details**: Direct HTTP calls to the Google Gemini developer API endpoints, utilizing structured JSON output configurations.
* **Key Implementations**:
  * **Listing Generator**: Analyzes text descriptions and image parameters to suggest categories, listing titles, and keywords.
  * **Requirements Parser**: Scans buyer requirement strings to identify matching categories and extract budget ranges.
  * **Negotiation Coach**: Recommends counter-offer amounts and generates reply templates based on deal history logs.
* **Security Controls**: Implements **daily API call limits per user** to prevent API key quota exhaustion.

---

## 2. Razorpay (Payments)

* **Service Module**: `backend/src/services/razorpay.service.js`
* **Flow**:
  1. Client calls `POST /payments/order`. Server initiates an order token via `razorpay.orders.create()` and returns the signature.
  2. Client launches Razorpay's checkout widget.
  3. Upon payment completion, Razorpay returns transaction hashes (`razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`).
  4. Client sends tokens to `POST /payments/verify`. The server verifies the signature using an HMAC SHA256 signature match:
     ```javascript
     const generated_signature = crypto
       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
       .update(order_id + "|" + payment_id)
       .digest('hex');
     ```
  5. If the signature matches, the server credits the user's wallet.
* **Webhooks**: Configured webhook endpoints verify events using raw buffer payloads parsed inside `app.js` into `req.rawBody`.

---

## 3. MSG91 (SMS OTP Gateway)

* **Service Module**: `backend/src/services/msg91.service.js`
* **API Details**: Dispatches transactional OTP SMS templates to Indian phone numbers during login verifications.
* **Development Mode**: If `MSG91_DEV_MODE` is `true`, OTP codes are generated locally and written to server logs, bypassing MSG91 API requests.

---

## 4. Cloudinary (Media Hosting & Direct CDN Streaming)

* **Backend Service Module**: `backend/src/services/cloudinary.service.js`
* **Frontend Helper**: `frontend/src/lib/api.js` (`mediaApi.uploadMediaStream`)
* **Architecture**: **Direct CDN Streaming (Gold Standard / Approach 1)**
* **Flow**:
  1. **Signature Generation**: Client issues authenticated `POST /api/v1/media/sign` specifying `folder` and `resource_type` ('video' or 'image'). Backend validates vendor session and generates a secure timestamped HMAC-SHA1 signature.
  2. **Direct Browser-to-Edge Stream**: Client directly streams the binary video file (up to 50MB) via multipart `FormData` to `https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload`. Live upload progress (`onUploadProgress`) powers the UI progress bar. Node.js processes **0 MB** of media traffic, completely avoiding memory buffering and thread blocking.
  3. **Fallback Proxy**: If Cloudinary credentials are omitted in development, `mediaApi.uploadMediaStream` gracefully falls back to streaming via `POST /api/v1/media/upload`.
  4. **Lightweight JSON Publish**: Once CDN upload resolves, the client sends only the clean CDN URL (`https://res.cloudinary.com/...`) in `POST /api/v1/reels` (`< 1 KB` payload). Base64 media data in JSON payloads is strictly prohibited.

---

## 5. FCM Push Notifications (Firebase)

* **Service Module**: `backend/src/services/fcm.service.js`
* **API Details**: Connects via `firebase-admin` client libraries in production.
* **Behavior**: Registers FCM device tokens on login. Delivers background push notifications when listings receive updates or deals require attention.

---

## 6. Shiprocket (Logistics & Dynamic Shipping Rates)

* **Service Module**: `backend/src/services/shiprocket.service.js`
* **API Details**: Interacts with the Shiprocket REST API (`https://apiv2.shiprocket.in/v1/external`) for authentication, courier serviceability checks, tracking, and rate lookup.
* **Authentication**: Obtains a 10-day cached JWT token via `POST /auth/login` using `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD`, or directly via `SHIPROCKET_API_TOKEN`.
* **Key Features**:
  * **Serviceability & Rate Lookup (`POST /courier/serviceability/`)**: Calculates live shipping rates from origin pincode to customer delivery pincode based on weight and dimensions.
  * **Free Delivery Rule**: Standard Flipkart-style threshold logic automatically waives delivery fees (`shippingFee: 0, isFree: true`) when order total >= ₹499.
  * **Fallback Handling**: Seamless fallback estimator if external Shiprocket API is unreachable.

