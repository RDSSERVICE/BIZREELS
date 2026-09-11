# BizReels Client Request Payload Contracts

> **Audience:** Android (Kotlin) Engineers, Frontend (React) Engineers, API Consumers  
> **Source of Truth:** Route Controllers, Validations (`backend/src/validations/`), Mongoose Schemas  
> **Target Version:** 1.4.0  

---

## 1. Payload Serialization Guidelines for Clients

Before constructing request bodies, all client developers must observe these critical serialization invariants:

1. **Strict Types:**
   - Numbers must be serialized as numbers (e.g. `"price": 1200`, **not** `"price": "1200"`).
   - Booleans must be native JSON booleans (`true` / `false`), **not** `"true"` or `1`.
2. **Nullable Fields:**
   - When an optional field has no value, omit the key or send `null`. Do **not** send empty strings `""` for ObjectId or Number fields, as this causes Mongoose `CastError`.
3. **Identifiers:**
   - All MongoDB IDs (`_id`, `listing_id`, `vendorId`) are 24-character hexadecimal strings.
4. **Dates:**
   - Transmit dates in standard ISO-8601 UTC string format: `"2026-09-11T12:00:00.000Z"`.

---

## 1. Authentication & Session Payloads

### User Registration
* **Endpoint:** `POST /api/v1/auth/register`
* **Authentication:** Public
* **Content-Type:** `application/json`
* **Description:** Creates a new user account with email credentials.

**Sample Request Body:**
```json
{
  "name": "Arjun Verma",
  "email": "arjun.verma@example.com",
  "password": "SecurePassword123!",
  "phone": "9876543210",
  "roles": [
    "customer",
    "vendor"
  ]
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `name` | `String` | **Required** | `None` | 2-50 chars | User full display name. |
| `email` | `String` | **Required** | `None` | Valid RFC 5322 email | Unique account email address. |
| `password` | `String` | **Required** | `None` | Min 8 chars, 1 letter, 1 number | Raw password; hashed with bcrypt on server. |
| `phone` | `String` | **Optional** | `null` | 10 digits | Mobile number; sanitized to +91XXXXXXXXXX. |
| `roles` | `Array[String]` | **Optional** | `["customer"]` | ['customer', 'vendor', 'creator'] | Initial account capabilities. |

---

### Email & Password Login
* **Endpoint:** `POST /api/v1/auth/login`
* **Authentication:** Public
* **Content-Type:** `application/json`
* **Description:** Validates email credentials and issues session tokens.

**Sample Request Body:**
```json
{
  "email": "arjun.verma@example.com",
  "password": "SecurePassword123!"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `email` | `String` | **Required** | `None` | Valid email | Registered user email address. |
| `password` | `String` | **Required** | `None` | String | Account password. |

---

### Dispatch Mobile OTP (SMS or WhatsApp)
* **Endpoint:** `POST /api/v1/auth/otp/send`
* **Authentication:** Public (Rate limited: 3 req / 10 min)
* **Content-Type:** `application/json`
* **Description:** Dispatches 6-digit OTP to mobile phone.

**Sample Request Body:**
```json
{
  "phone": "9876543210",
  "channel": "sms"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `phone` | `String` | **Required** | `None` | 10-digit numeric string | Indian phone number without leading 0 or +91. |
| `channel` | `String` | **Optional** | `"sms"` | "sms", "whatsapp" | Delivery service provider channel. |

---

### Verify Mobile OTP & Authenticate
* **Endpoint:** `POST /api/v1/auth/otp/verify`
* **Authentication:** Public
* **Content-Type:** `application/json`
* **Description:** Verifies 6-digit OTP code and logs in or creates user.

**Sample Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "591240",
  "name": "Arjun Verma",
  "roles": [
    "customer"
  ],
  "referral_code": "BIZWIN99"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `phone` | `String` | **Required** | `None` | 10-digit numeric string | Phone number matching dispatch. |
| `otp` | `String` | **Required** | `None` | 4-6 digits string | OTP code entered by user. |
| `name` | `String` | **Optional** | `"User"` | String | Account name if user is being newly created. |
| `roles` | `Array[String]` | **Optional** | `["customer"]` | Subset of ['customer', 'vendor', 'creator'] | Initial roles. |
| `referral_code` | `String` | **Optional** | `null` | Alphanumeric | Invite code of referring friend. |

---

### Google Native Mobile ID Token Exchange
* **Endpoint:** `POST /api/v1/auth/google/token`
* **Authentication:** Public
* **Content-Type:** `application/json`
* **Description:** Exchanges Google Play Services Identity ID Token for JWT session.

**Sample Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "role": "customer",
  "referral_code": "BIZWIN99"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `idToken` | `String` | **Required** | `None` | Signed Google ID Token | JWT token provided by Google Mobile SDK. |
| `role` | `String` | **Optional** | `"customer"` | "customer", "vendor", "creator" | Active workspace role. |
| `referral_code` | `String` | **Optional** | `null` | Alphanumeric | Referral invite code. |

---

### Rotate Session Tokens
* **Endpoint:** `POST /api/v1/auth/refresh-token`
* **Authentication:** Public
* **Content-Type:** `application/json`
* **Description:** Rotates expired access token using valid refresh token.

**Sample Request Body:**
```json
{
  "refreshToken": "d8f3a9e10c7b..."
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `refreshToken` | `String` | **Optional (if cookie exists)** | `null` | JWT string | Mandatory for Android mobile clients without cookies. |

---

### Switch Active Workspace Role
* **Endpoint:** `PATCH /api/v1/auth/switch-role`
* **Authentication:** Required (Bearer Token)
* **Content-Type:** `application/json`
* **Description:** Swaps active role between customer, vendor, and creator.

**Sample Request Body:**
```json
{
  "role": "vendor"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `role` | `String` | **Required** | `None` | "customer", "vendor", "creator" | Target active role; user must possess this role. |

---

## 2. Shopping Cart & Multi-Vendor Checkout Payloads

### Add Item to Shopping Cart
* **Endpoint:** `POST /api/v1/cart/add`
* **Authentication:** Required
* **Content-Type:** `application/json`
* **Description:** Adds a product listing with quantity and notes to user's cart.

**Sample Request Body:**
```json
{
  "listing_id": "65e9b8f2d84712001a1c94b2",
  "quantity": 2,
  "customization_notes": "Gift packaging requested"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `listing_id` | `String (ObjectId)` | **Required** | `None` | 24-hex ObjectId | Target product listing ID. |
| `quantity` | `Number (Integer)` | **Required** | `1` | 1 - 99 | Number of units to purchase. |
| `customization_notes` | `String` | **Optional** | `""` | Max 300 chars | Special buyer instructions. |

---

### Update Cart Item Quantity
* **Endpoint:** `PATCH /api/v1/cart/items/:listing_id`
* **Authentication:** Required
* **Content-Type:** `application/json`
* **Description:** Adjusts quantity of an existing item in the cart.

**Sample Request Body:**
```json
{
  "quantity": 3
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `quantity` | `Number (Integer)` | **Required** | `None` | 1 - 99 | Updated quantity. |

---

### Multi-Vendor Direct Checkout
* **Endpoint:** `POST /api/v1/cart/checkout`
* **Authentication:** Required
* **Content-Type:** `application/json`
* **Description:** Transforms cart items into orders grouped by vendor, creates Razorpay payment order.

**Sample Request Body:**
```json
{
  "delivery_address": {
    "street": "Flat 402, Lotus Residency, 12th Cross",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560038",
    "phone": "9876543210"
  },
  "payment_method": "razorpay",
  "notes": "Please call before delivery"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `delivery_address` | `Object` | **Required** | `None` | Object | Delivery destination. |
| `delivery_address.street` | `String` | **Required** | `None` | 5-150 chars | Street line. |
| `delivery_address.city` | `String` | **Required** | `None` | 2-50 chars | City. |
| `delivery_address.state` | `String` | **Required** | `None` | 2-50 chars | Indian State. |
| `delivery_address.pincode` | `String` | **Required** | `None` | 6-digit string | Postal code. |
| `delivery_address.phone` | `String` | **Required** | `None` | 10-digit string | Delivery contact phone. |
| `payment_method` | `String` | **Required** | `"razorpay"` | "razorpay", "wallet", "cod" | Payment instrument. |
| `notes` | `String` | **Optional** | `""` | Max 300 chars | Delivery instructions. |

---

## 3. Catalog & Listings Payloads

### Create Catalog Listing
* **Endpoint:** `POST /api/v1/listings`
* **Authentication:** Required (Vendor or Admin)
* **Content-Type:** `application/json`
* **Description:** Publishes a new product or service listing to the marketplace.

**Sample Request Body:**
```json
{
  "title": "Handmade Bamboo Table Lamp",
  "description": "Eco-friendly natural bamboo table lamp with warm LED illumination.",
  "price": 1850,
  "category": "65e9c0f2d84712001a1c94d0",
  "type": "product",
  "stock": 25,
  "images": [
    "https://res.cloudinary.com/bizreels/image/upload/v1/lamp_main.jpg",
    "https://res.cloudinary.com/bizreels/image/upload/v1/lamp_side.jpg"
  ],
  "tags": [
    "bamboo",
    "lamp",
    "handicraft",
    "sustainable"
  ],
  "location": {
    "address": "Indiranagar, Bengaluru",
    "coordinates": [
      77.6408,
      12.9784
    ]
  }
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `title` | `String` | **Required** | `None` | 3-100 chars | Listing title. |
| `price` | `Number` | **Required** | `None` | Number >= 0 | Price in Indian Rupees (INR). |
| `category` | `String (ObjectId)` | **Required** | `None` | ObjectId or Category Name | Product classification. |
| `type` | `String` | **Optional** | `"product"` | "product", "service", "digital" | Listing fulfillment type. |
| `description` | `String` | **Optional** | `""` | Max 2000 chars | Product specifications and details. |
| `stock` | `Number (Integer)` | **Optional** | `1` | >= 0 | Available inventory. |
| `images` | `Array[String]` | **Optional** | `[]` | Array of valid URLs | Product gallery image URLs. |
| `tags` | `Array[String]` | **Optional** | `[]` | Max 10 tags | Search discovery keywords. |
| `location` | `Object` | **Optional** | `null` | GeoJSON Point | Location coordinates [longitude, latitude]. |

---

## 4. Video Reels & Social Payloads

### Upload & Publish Video Reel
* **Endpoint:** `POST /api/v1/reels`
* **Authentication:** Required (Creator, Vendor, or Admin)
* **Content-Type:** `application/json`
* **Description:** Publishes a short-form video reel linked to tagged catalog listings.

**Sample Request Body:**
```json
{
  "videoUrl": "https://res.cloudinary.com/bizreels/video/upload/v172607/lamp_demo.mp4",
  "caption": "How we weave our signature bamboo lamps by hand! #crafts #homedecor",
  "thumbnailUrl": "https://res.cloudinary.com/bizreels/image/upload/v172607/lamp_demo_thumb.jpg",
  "taggedListings": [
    "65e9b8f2d84712001a1c94b2"
  ],
  "category": "Art & Craft"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `videoUrl` | `String (URL)` | **Required** | `None` | Cloudinary/S3 MP4 URL | Transcoded video URL. |
| `caption` | `String` | **Optional** | `""` | Max 500 chars | Post description and hashtags. |
| `thumbnailUrl` | `String (URL)` | **Optional** | `Auto-generated` | Image URL | Video cover poster frame. |
| `taggedListings` | `Array[ObjectId]` | **Optional** | `[]` | List of valid Listing IDs | Interactive buyable items pinned in the video. |
| `category` | `String` | **Optional** | `"general"` | String | Content genre. |

---

### Toggle Like on Reel
* **Endpoint:** `POST /api/v1/reels/:id/like`
* **Authentication:** Required
* **Content-Type:** `application/json`
* **Description:** Idempotently toggles user like state on a reel.

**Sample Request Body:**
```json
{}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `:id` | `URL Param` | **Required** | `None` | ObjectId | Target Reel ID. |

---

### Post Comment on Reel
* **Endpoint:** `POST /api/v1/reels/:id/comments`
* **Authentication:** Required
* **Content-Type:** `application/json`
* **Description:** Adds a text comment to a reel.

**Sample Request Body:**
```json
{
  "text": "Where is your workshop located? Loving this finish!"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `text` | `String` | **Required** | `None` | 1-500 chars | Comment message text. |

---

## 5. Government KYC & Sandbox Verification Payloads

### Verify Indian PAN Card
* **Endpoint:** `POST /api/v1/identity/verification/pan`
* **Authentication:** Required (Vendor or Creator)
* **Content-Type:** `application/json`
* **Description:** Instant verification of Indian PAN with NSDL via Sandbox API.

**Sample Request Body:**
```json
{
  "pan_number": "ABCDE1234F",
  "name": "Arjun Verma"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `pan_number` | `String` | **Required** | `None` | 10-character uppercase string | Permanent Account Number. |
| `name` | `String` | **Required** | `None` | String | Name matching government records. |

---

### Initiate Aadhaar OTP Verification
* **Endpoint:** `POST /api/v1/identity/verification/aadhaar/initiate`
* **Authentication:** Required (Vendor or Creator)
* **Content-Type:** `application/json`
* **Description:** Sends UIDAI OTP to user's registered phone.

**Sample Request Body:**
```json
{
  "aadhaar_number": "987654321098"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `aadhaar_number` | `String` | **Required** | `None` | 12-digit numeric string | Indian Aadhaar ID. |

---

### Submit Aadhaar OTP for Instant KYC
* **Endpoint:** `POST /api/v1/identity/verification/aadhaar/verify-otp`
* **Authentication:** Required (Vendor or Creator)
* **Content-Type:** `application/json`
* **Description:** Validates UIDAI OTP and verifies identity.

**Sample Request Body:**
```json
{
  "ref_id": "SANDBOX_REF_8829104",
  "otp": "492104"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `ref_id` | `String` | **Required** | `None` | String | Reference ID from initiate endpoint. |
| `otp` | `String` | **Required** | `None` | 6-digit numeric string | UIDAI OTP code. |

---

### Verify Indian GSTIN
* **Endpoint:** `POST /api/v1/identity/verification/gstin`
* **Authentication:** Required (Vendor)
* **Content-Type:** `application/json`
* **Description:** Validates GSTIN registration and fetches trade name.

**Sample Request Body:**
```json
{
  "gstin": "29AAAAA0000A1Z5"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `gstin` | `String` | **Required** | `None` | 15-character alphanumeric | Goods and Services Tax Identification Number. |

---

### Verify Bank Account via Penny-Drop
* **Endpoint:** `POST /api/v1/identity/verification/bank`
* **Authentication:** Required (Vendor or Creator)
* **Content-Type:** `application/json`
* **Description:** Performs instant penny-drop deposit to verify beneficiary bank account.

**Sample Request Body:**
```json
{
  "account_number": "123456789012",
  "ifsc": "HDFC0001234"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `account_number` | `String` | **Required** | `None` | 9-18 digit numeric string | Bank account number. |
| `ifsc` | `String` | **Required** | `None` | 11-character uppercase alphanumeric | Indian Financial System Code (IFSC). |

---

## 6. Customer Inquiries, Requirements & RFQ Payloads

### Post Project Requirement / RFQ
* **Endpoint:** `POST /api/v1/requirements`
* **Authentication:** Required (Customer)
* **Content-Type:** `application/json`
* **Description:** Submits a project brief that nearby vendors can bid on.

**Sample Request Body:**
```json
{
  "title": "Custom solid oak dining table (6-seater)",
  "category": "65e9c0f2d84712001a1c94d0",
  "description": "Need a modern Scandinavian-style oak dining table with matte finish.",
  "budget": 25000,
  "timeline": "3 weeks",
  "location": {
    "city": "Bengaluru",
    "pincode": "560038"
  }
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `title` | `String` | **Required** | `None` | 5-100 chars | Requirement title. |
| `category` | `String (ObjectId)` | **Required** | `None` | ObjectId | Target category. |
| `description` | `String` | **Required** | `None` | 10-2000 chars | Brief details. |
| `budget` | `Number` | **Optional** | `0` | Number >= 0 | Approximate customer budget (INR). |
| `timeline` | `String` | **Optional** | `"flexible"` | String | Target completion window. |
| `location` | `Object` | **Optional** | `null` | Object | Project location details. |

---

### Vendor Submit Quote Proposal
* **Endpoint:** `POST /api/v1/requirements/quotes`
* **Authentication:** Required (Vendor)
* **Content-Type:** `application/json`
* **Description:** Vendor bids a price and proposal on an open requirement.

**Sample Request Body:**
```json
{
  "requirementId": "65e9c0f2d84712001a1c94e8",
  "quotePrice": 22000,
  "proposalNote": "We can craft this with seasoned oak in 18 days.",
  "deliveryDays": 18
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `requirementId` | `String (ObjectId)` | **Required** | `None` | ObjectId | Target Requirement ID. |
| `quotePrice` | `Number` | **Required** | `None` | Number > 0 | Proposed bid price (INR). |
| `proposalNote` | `String` | **Required** | `None` | 10-1000 chars | Proposal pitch. |
| `deliveryDays` | `Number` | **Optional** | `7` | Integer >= 1 | Estimated delivery days. |

---

## 7. AI Services (Gemini 1.5 Flash)

### Generate AI Product Description
* **Endpoint:** `POST /api/v1/ai/generate-description`
* **Authentication:** Required (Vendor or Creator)
* **Content-Type:** `application/json`
* **Description:** Uses Google Gemini 1.5 Flash to synthesize SEO-optimized descriptions.

**Sample Request Body:**
```json
{
  "title": "Terracotta Plant Pot",
  "keywords": [
    "handcrafted",
    "drainage hole",
    "indoor outdoor",
    "natural clay"
  ],
  "tone": "creative"
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `title` | `String` | **Required** | `None` | String | Product name. |
| `keywords` | `Array[String]` | **Optional** | `[]` | List of strings | Key product attributes. |
| `tone` | `String` | **Optional** | `"professional"` | "professional", "creative", "casual" | Copywriting style. |

---

## 8. Reviews, Ratings & Customer Feedback

### Post Product / Vendor Review
* **Endpoint:** `POST /api/v1/reviews`
* **Authentication:** Required
* **Content-Type:** `application/json`
* **Description:** Submits a verified customer rating and written feedback.

**Sample Request Body:**
```json
{
  "listing_id": "65e9b8f2d84712001a1c94b2",
  "vendor_id": "65e9b8f2d84712001a1c9400",
  "rating": 5,
  "comment": "Exceptional build quality! Shipped securely within 3 days.",
  "images": [
    "https://res.cloudinary.com/.../review_photo.jpg"
  ]
}
```

**Field Contract Table:**

| Field Name | Type | Status | Default | Allowed Values / Constraint | Description |
|---|---|---|---|---|---|
| `listing_id` | `String (ObjectId)` | **Optional** | `null` | ObjectId | Target Listing ID (if reviewing product). |
| `vendor_id` | `String (ObjectId)` | **Required** | `None` | ObjectId | Target Vendor ID. |
| `rating` | `Number (Integer)` | **Required** | `None` | 1, 2, 3, 4, 5 | Star score. |
| `comment` | `String` | **Optional** | `""` | Max 1000 chars | Review description. |
| `images` | `Array[String]` | **Optional** | `[]` | Max 5 image URLs | Photos attached to review. |

---

