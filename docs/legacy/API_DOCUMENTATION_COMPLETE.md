# Complete API Documentation Specification
## BizReels REST API v1 & Sockets Protocol

> [!TIP]
> **Interactive Swagger UI Documentation**:  
> View and test all backend endpoints interactively in your browser at [http://localhost:5000/api-docs](http://localhost:5000/api-docs) (or [http://localhost:5000/docs](http://localhost:5000/docs)).  
> Raw OpenAPI 3.0 specification JSON is available at `/api-docs.json`.  
> For comprehensive architectural analysis and schema breakdown, see [SWAGGER_DOCUMENTATION.md](file:///d:/BizReels%20Website/docs/SWAGGER_DOCUMENTATION.md).

---

## 1. Authentication Domain

### 1.1 `POST /auth/register`
- **Description**: Registers a user credentials session.
- **Permissions**: Public (no token).
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "roles": ["customer", "vendor"]
  }
  ```
- **Validation Rules**: Email format validation, password minlength 8 characters, roles must be from enum array.
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "user": {
        "_id": "60d5ecb8b3b3a2a4b8f72381",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "roles": ["customer", "vendor"],
        "activeRole": "customer"
      }
    }
  }
  ```
- **Error Codes**: `400 Bad Request` (Validation errors), `409 Conflict` (Email already exists).

### 1.2 `POST /auth/login`
- **Description**: Email and password session creation.
- **Permissions**: Public.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK)**:
  - *Headers*: `Set-Cookie: refreshToken=<JWT>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
  - *Body*:
    ```json
    {
      "success": true,
      "message": "Login successful.",
      "data": {
        "accessToken": "eyJhbGciOi...",
        "user": {
          "_id": "60d5ecb8b3b3a2a4b8f72381",
          "name": "Jane Doe",
          "email": "jane@example.com",
          "activeRole": "customer"
        }
      }
    }
    ```
- **Error Codes**: `401 Unauthorized` (Invalid credentials), `403 Forbidden` (Account locked).

### 1.3 `POST /auth/otp/request`
- **Description**: Dispatches a transient verification OTP code to email/phone.
- **Permissions**: Public.
- **Request Body**: `{ "email": "jane@example.com" }` or `{ "phone": "+919876543210" }`
- **Success Response (200 OK)**: `{ "success": true, "message": "OTP code dispatched." }`

### 1.4 `POST /auth/otp/verify`
- **Description**: Validates the transient OTP code.
- **Permissions**: Public.
- **Request Body**: `{ "email": "jane@example.com", "code": "123456" }`
- **Success Response (200 OK)**: Sets refresh cookie and returns standard login tokens.

### 1.5 `PATCH /auth/switch-role`
- **Description**: Changes the user active workspace profile.
- **Permissions**: Authenticated.
- **Request Body**: `{ "role": "vendor" }`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Role switched to vendor.",
    "data": {
      "user": { "_id": "...", "activeRole": "vendor" }
    }
  }
  ```

---

## 2. Listings Domain (Products & Services)

### 2.1 `GET /listings`
- **Description**: Queries proximity listings using GeoJSON filters.
- **Permissions**: Public.
- **Request Query Params**:
  - `lat` / `lng`: Latitude / Longitude coordinates.
  - `distance`: Radius search in kilometers (default: 10).
  - `type`: `product` | `service`.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "60d5ecb8b3b3a2...",
        "title": "Custom Cake Design",
        "price": 2500,
        "location": { "address": "Connaught Place" },
        "distance": 1.2
      }
    ]
  }
  ```

### 2.2 `POST /listings`
- **Description**: Adds a listing item.
- **Permissions**: Authenticated (Role restricted: `vendor`, `admin`).
- **Request Body**: Title, category, price, lat, lng, type, description.
- **Success Response (201 Created)**: Returns saved Listing item.

---

## 3. Custom Requirements & Quotes Bidding

### 3.1 `POST /requirements`
- **Description**: Customer posts custom requirements brief.
- **Permissions**: Authenticated (Customer role).
- **Request Body**: Title, category, budget, deadline date, lat, lng, description.
- **Success Response (201 Created)**: Returns created Requirement object.

### 3.2 `POST /requirements/quotes`
- **Description**: Vendor bids on local customer requirement lead.
- **Permissions**: Authenticated (Vendor role).
- **Request Body**: `{ "requirementId": "...", "price": 1800, "estimatedDelivery": "Date", "notes": "Cover note" }`
- **Success Response (201 Created)**: Returns created Quote proposal.

### 3.3 `PATCH /requirements/quotes/:quoteId`
- **Description**: Customer accepts Quote bid, initiating escrow debit lock.
- **Permissions**: Authenticated (Owner Customer of Requirement).
- **Success Response (200 OK)**: `{ "success": true, "message": "Quote accepted. Escrow budget locked." }`

---

## 4. Wallet & ledger

### 4.1 `POST /wallet/recharge`
- **Description**: Deposits funds into user wallet balance.
- **Permissions**: Authenticated.
- **Request Body**: `{ "amount": 10000 }`
- **Success Response (200 OK)**: Returns updated wallet balance and transactions list.

---

## 5. Reviews Domain

### 5.1 `POST /reviews`
- **Description**: Submits rating reviews for vendor or listing.
- **Permissions**: Authenticated.
- **Request Body**: `{ "targetUserId": "...", "targetListingId": "...", "rating": 5, "comment": "Excellent service!" }`
- **Success Response (201 Created)**: Returns Review details.

---

## 6. Shopping Cart & Multi-Vendor Checkout Domain (`/cart`)

### 6.1 `GET /cart` (or `/cart/me`)
- **Description**: Retrieves current authenticated customer's shopping cart, automatically hydrated with real-time product prices, images, vendor profiles, and grouped by vendor.
- **Permissions**: Authenticated.
- **Success Response (200 OK)**:
  ```json
  {
    "id": "64e5f...",
    "items": [
      {
        "listing_id": "60d5ecb8b3b3a2a4b8f72381",
        "quantity": 2,
        "variant_selection": null,
        "added_at": "2026-08-24T00:00:00.000Z"
      }
    ],
    "groups": [
      {
        "vendor_id": "60d5ecb8b3b3a2a4b8f72380",
        "vendor": {
          "id": "60d5ecb8b3b3a2a4b8f72380",
          "name": "Royal Electronics",
          "profile_pic": "https://..."
        },
        "items": [
          {
            "listing_id": "60d5ecb8b3b3a2a4b8f72381",
            "quantity": 2,
            "title": "Wireless Bluetooth Earbuds",
            "price": 1299,
            "line_total": 2598,
            "image": "https://..."
          }
        ],
        "subtotal": 2598
      }
    ],
    "total_items": 2,
    "total_amount": 2598
  }
  ```

### 6.2 `POST /cart/add` (or `/cart/me/add`)
- **Description**: Adds an item with quantity to the customer's cart or increments existing quantity up to 99.
- **Permissions**: Authenticated.
- **Request Body**:
  ```json
  {
    "listing_id": "60d5ecb8b3b3a2a4b8f72381",
    "quantity": 1,
    "variant_selection": null
  }
  ```
- **Success Response (200 OK)**: Returns full updated hydrated cart.

### 6.3 `PATCH /cart/items/:listing_id`
- **Description**: Updates the exact quantity of a listing in the cart (range: 1 - 99).
- **Permissions**: Authenticated.
- **Request Body**: `{ "quantity": 3 }`
- **Success Response (200 OK)**: Returns full updated hydrated cart.

### 6.4 `DELETE /cart/items/:listing_id`
- **Description**: Removes an item from the cart.
- **Permissions**: Authenticated.
- **Success Response (200 OK)**: Returns full updated hydrated cart.

### 6.5 `POST /cart/checkout`
- **Description**: Executes multi-vendor checkout. Accepts applied coupon discount, Shiprocket shipping charges, delivery address, and pincode. Allocates discounts and shipping fees across vendor deals, sends itemized chat messages, and clears the cart upon success.
- **Permissions**: Authenticated.
- **Request Body**:
  ```json
  {
    "address": "Flat 402, Sunshine Apts, New Delhi - 110001",
    "pincode": "110001",
    "couponCode": "WELCOME10",
    "couponDiscount": 150,
    "shippingCharges": 0
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "ok": true,
    "deals": [
      {
        "deal_id": "64e5f...",
        "vendor_id": "60d5ecb8...",
        "amount_paise": 244800,
        "item_count": 1
      }
    ]
  }
  ```

---

## 7. Offers & Coupons Domain

### 7.1 `POST /v1/offers/validate-coupon`
- **Description**: Validates a promo coupon code against active platform and vendor offers. Checks expiration date, min order amount, max discount cap, usage limits, and user limits.
- **Permissions**: Authenticated.
- **Request Body**:
  ```json
  {
    "couponCode": "FESTIVE20",
    "orderAmount": 1500,
    "vendorId": "60d5ecb8b3b3a2a4b8f72381",
    "listingId": "64e5f..."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "valid": true,
      "couponCode": "FESTIVE20",
      "discountAmount": 300,
      "finalAmount": 1200,
      "offerId": "64e5f...",
      "discountType": "percentage",
      "discountValue": 20
    }
  }
  ```

### 7.2 `GET /v1/offers/applicable`
- **Description**: Retrieves active applicable public coupons and offers for 1-click apply in checkout and cart drawers.
- **Permissions**: Authenticated.
- **Query Params**: `vendorId` (optional), `orderAmount` (optional).
- **Success Response (200 OK)**: Returns list of available coupon cards with code, title, discount info, and min order requirements.

### 7.3 `POST /v1/offers/calculate-shipping`
- **Description**: Calculates live courier shipping charges via Shiprocket API integration based on delivery pincode and weight. Automatically enforces Free Delivery rules for orders >= ₹499.
- **Permissions**: Public / Authenticated.
- **Request Body**:
  ```json
  {
    "deliveryPincode": "110001",
    "orderAmount": 650,
    "weightKg": 0.5
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "shippingFee": 0,
      "originalFee": 40,
      "isFree": true,
      "courierName": "Shiprocket Fast Express",
      "estimatedDays": "2-4 business days"
    }
  }
  ```

---

## 8. Subscriptions & Add-Ons Domain

### 8.1 `POST /v1/subscription/purchase-razorpay`
- **Description**: Initiates Razorpay payment order for subscription tiers with dynamic Add-Ons selection.
- **Permissions**: Authenticated.
- **Request Body**:
  ```json
  {
    "plan_id": "60d5ecb8b3b3a2a4b8f72381",
    "selected_addons": [
      {
        "id": "addon_1",
        "title": "Extra 50 Reels Uploads",
        "price_inr": 199,
        "quota_type": "reels_limit",
        "quota_value": 50
      }
    ]
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "payment_id": "...",
      "razorpay_order_id": "order_MN67...",
      "amount_paise": 119800,
      "plan_id": "60d5ecb8...",
      "plan_title": "Vendor Premium Pro",
      "base_price_inr": 999,
      "addons_total_inr": 199,
      "amount_inr": 1198,
      "selected_addons": [...]
    }
  }
  ```

### 8.2 `POST /v1/wallet/purchase-plan`
- **Description**: Purchases or upgrades a subscription plan directly with Wallet Balance, supporting selected Add-ons.
- **Permissions**: Authenticated.
- **Request Body**:
  ```json
  {
    "planId": "60d5ecb8b3b3a2a4b8f72381",
    "selected_addons": [...]
  }
  ```
- **Success Response (200 OK)**: Deducts `baseCost + addonsTotal`, activates subscription, and credits bonus quotas.

---

## 9. Sockets Protocol Specifications

| Event Namespace | Event Identifier | Direction | Payload Schema | Action Trigger |
|---|---|---|---|---|
| `/` | `join_conversation` | Client -> Server | `conversationId` string | Mounts user to thread chatroom. |
| `/` | `message` | Server -> Client | Message model JSON | Delivers live chat message. |
| `/` | `typing` | Client <-> Server | `{ conversationId, isTyping }` | Displays live active typing state. |
| `/` | `subscription:updated` | Server -> Client | `{ updated: true }` | Live refetch of user subscription & plans. |
| `/` | `wallet:updated` | Server -> Client | `{ balance, ... }` | Live balance update after transactions. |

