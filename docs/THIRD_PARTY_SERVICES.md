# Third-Party Services & Integrations

Emergent integrates with external systems to provide AI, payment, messaging, notification, and media storage capabilities.

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

## 4. Cloudinary (Media Hosting)

* **Service Module**: `backend/src/services/cloudinary.service.js`
* **Flow**:
  1. Client requests authorization signature parameters via `POST /media/sign` specifying folder destinations.
  2. Client uploads images or video files directly to Cloudinary endpoints using the signature parameters.
  3. Client posts the resulting secure Cloudinary URL back to the server. This prevents server-side memory saturation from large media uploads.

---

## 5. FCM Push Notifications (Firebase)

* **Service Module**: `backend/src/services/fcm.service.js`
* **API Details**: Connects via `firebase-admin` client libraries in production.
* **Behavior**: Registers FCM device tokens on login. Delivers background push notifications when listings receive updates or deals require attention.
