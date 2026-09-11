# BizReels Response Contracts & JSON Schemas

> **Platform Version:** 1.4.0  
> **Audience:** Android (Kotlin) Developers, Frontend (React) Developers, API Consumers  
> **Source of Truth:** Controller Return Envelopes (\`ApiResponse.js\`, \`errorHandler.js\`, Mongoose Query Returns)  

---

## 1. Global Response Architecture

Every HTTP response returned by the BizReels API adheres to standard envelope conventions. Client applications can reliably inspect top-level fields before drilling into domain-specific payloads.

### 1.1 Universal Success Envelope
HTTP Status: `200 OK` or `201 Created`
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

### 1.2 Universal Paginated List Envelope
HTTP Status: `200 OK`
```json
{
  "success": true,
  "data": [
    { ... }
  ],
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "pages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 1.3 Universal Error Envelope
HTTP Status: `4xx` or `5xx`
```json
{
  "success": false,
  "message": "Clear explanation of the error",
  "errors": [
    {
      "field": "phone",
      "message": "Phone number is invalid"
    }
  ],
  "code": "ERROR_CODE_STRING"
}
```

---

## 2. Authentication & Identity Response Contracts

### 2.1 Standard User Profile Object (`UserSchema`)
This object is returned upon login, registration, token refresh, and `/api/v1/auth/me`:
```json
{
  "_id": "65e9b8f2d84712001a1c94b2",
  "name": "Arjun Verma",
  "email": "arjun.verma@example.com",
  "phone": "+919876543210",
  "avatar": "https://res.cloudinary.com/bizreels/image/upload/v1/avatars/user1.jpg",
  "roles": ["customer", "vendor"],
  "activeRole": "vendor",
  "isPhoneVerified": true,
  "isEmailVerified": true,
  "is_verified": true,
  "wallet_balance": 1450.00,
  "referral_code": "BIZARJ88",
  "vendorProfile": {
    "businessName": "Verma Handloom Crafts",
    "categories": ["Handicrafts", "Home Decor"],
    "isGstVerified": true,
    "isPanVerified": true,
    "storeRating": 4.85,
    "totalSales": 120
  },
  "creatorProfile": {
    "bio": "Craft lover & short film maker",
    "category": "Lifestyle",
    "followersCount": 4200,
    "collaborationsCount": 18
  },
  "created_at": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-09-11T14:20:00.000Z"
}
```

### 2.2 Login & Token Refresh Response (`POST /auth/login`, `POST /auth/otp/verify`)
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "d8f3a9e10c7b44589...",
    "user": {
      "_id": "65e9b8f2d84712001a1c94b2",
      "name": "Arjun Verma",
      "phone": "+919876543210",
      "roles": ["customer", "vendor"],
      "activeRole": "customer"
    }
  }
}
```

---

## 3. Catalog & Listing Response Contracts

### 3.1 Product Listing Details (`GET /listings/:id`)
```json
{
  "success": true,
  "data": {
    "_id": "65e9c0f2d84712001a1c94e8",
    "title": "Handmade Terracotta Planter",
    "description": "Eco-friendly natural clay planter with bottom drainage.",
    "price": 650,
    "category": {
      "_id": "65e9a0f2d84712001a1c9401",
      "name": "Home & Garden",
      "slug": "home-and-garden"
    },
    "type": "product",
    "stock": 40,
    "images": [
      "https://res.cloudinary.com/bizreels/image/upload/v1/planter_1.jpg",
      "https://res.cloudinary.com/bizreels/image/upload/v1/planter_2.jpg"
    ],
    "vendor": {
      "_id": "65e9b8f2d84712001a1c94b2",
      "name": "Verma Handloom Crafts",
      "phone": "+919876543210",
      "is_verified": true,
      "rating": 4.8
    },
    "location": {
      "type": "Point",
      "coordinates": [77.6408, 12.9784],
      "address": "Indiranagar, Bengaluru"
    },
    "view_count": 840,
    "likes_count": 92,
    "is_active": true,
    "is_deleted": false,
    "created_at": "2026-08-01T12:00:00.000Z"
  }
}
```

---

## 4. Video Reels Response Contracts

### 4.1 Single Video Reel Details (`GET /reels/:id`)
```json
{
  "success": true,
  "data": {
    "_id": "66a8b7c0d1e2f3a4b5c6d7e8",
    "videoUrl": "https://res.cloudinary.com/bizreels/video/upload/v172607/planter_reel.mp4",
    "thumbnailUrl": "https://res.cloudinary.com/bizreels/video/upload/so_0.5,w_1080,h_1920,c_fill,q_auto,f_jpg/planter_reel.jpg",
    "caption": "Hand-molding raw terracotta clay! Watch the full process. #pottery #craft",
    "creator": {
      "_id": "65e9b8f2d84712001a1c94b2",
      "name": "Arjun Crafts",
      "avatar": "https://res.cloudinary.com/bizreels/image/upload/v1/avatar.jpg"
    },
    "taggedListings": [
      {
        "_id": "65e9c0f2d84712001a1c94e8",
        "title": "Handmade Terracotta Planter",
        "price": 650,
        "images": ["https://res.cloudinary.com/bizreels/image/upload/v1/planter_1.jpg"]
      }
    ],
    "views": 15200,
    "likes": 1420,
    "comments": 89,
    "shares": 312,
    "isLiked": true,
    "created_at": "2026-09-02T14:10:00.000Z"
  }
}
```

---

## 5. Shopping Cart & Multi-Vendor Checkout Response Contracts

### 5.1 Current User Cart Details (`GET /cart`)
```json
{
  "success": true,
  "data": {
    "_id": "66b1c2d3e4f5a6b7c8d9e0f1",
    "user": "65e9b8f2d84712001a1c94b2",
    "vendor_groups": [
      {
        "vendor": {
          "_id": "65e9b8f2d84712001a1c94b2",
          "name": "Verma Handloom Crafts",
          "city": "Bengaluru"
        },
        "items": [
          {
            "listing": {
              "_id": "65e9c0f2d84712001a1c94e8",
              "title": "Handmade Terracotta Planter",
              "price": 650,
              "image": "https://res.cloudinary.com/bizreels/image/upload/v1/planter_1.jpg"
            },
            "quantity": 2,
            "unit_price": 650,
            "total_price": 1300,
            "customization_notes": "Gift packaging"
          }
        ],
        "subtotal": 1300,
        "shipping_fee": 50,
        "vendor_total": 1350
      }
    ],
    "items_count": 2,
    "grand_total": 1350
  }
}
```

### 5.2 Direct Cart Checkout Response (`POST /cart/checkout`)
```json
{
  "success": true,
  "message": "Checkout initiated successfully.",
  "data": {
    "order_ids": [
      "66c2d3e4f5a6b7c8d9e0f1a2"
    ],
    "razorpay_order": {
      "id": "order_NXz89Abc12345",
      "entity": "order",
      "amount": 135000,
      "amount_paid": 0,
      "amount_due": 135000,
      "currency": "INR",
      "receipt": "rcpt_66c2d3e4",
      "status": "created"
    },
    "grand_total_inr": 1350,
    "payment_method": "razorpay"
  }
}
```

---

## 6. Orders, Fulfillment & Escrow Response Contracts

### 6.1 Customer Order Details (`GET /orders/:id`)
```json
{
  "success": true,
  "data": {
    "_id": "66c2d3e4f5a6b7c8d9e0f1a2",
    "order_number": "ORD-2026-99120",
    "customer": {
      "_id": "65e9b8f2d84712001a1c94b2",
      "name": "Arjun Verma",
      "phone": "+919876543210"
    },
    "vendor": {
      "_id": "65e9b8f2d84712001a1c9400",
      "name": "Verma Handloom Crafts",
      "phone": "+919876500000"
    },
    "items": [
      {
        "listing_id": "65e9c0f2d84712001a1c94e8",
        "title": "Handmade Terracotta Planter",
        "price": 650,
        "quantity": 2
      }
    ],
    "total_amount": 1350,
    "payment_status": "paid",
    "escrow_status": "held",
    "fulfillment_status": "shipped",
    "shipping": {
      "courier": "Delhivery",
      "tracking_number": "DEL123456789IN",
      "tracking_url": "https://delhivery.com/track/DEL123456789IN",
      "shipped_at": "2026-09-04T10:00:00.000Z"
    },
    "delivery_address": {
      "street": "Flat 402, Lotus Residency",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560038"
    },
    "created_at": "2026-09-03T16:20:00.000Z"
  }
}
```

---

## 7. Wallet & Ledger Response Contracts

### 7.1 Wallet Balance & Summary (`GET /wallet/balance`)
```json
{
  "success": true,
  "data": {
    "wallet_balance": 2450.00,
    "currency": "INR",
    "escrow_locked_balance": 1200.00,
    "available_balance": 1250.00,
    "total_cashback_earned": 350.00,
    "total_spent": 14200.00
  }
}
```

### 7.2 Wallet Transaction History (`GET /wallet/transactions`)
```json
{
  "success": true,
  "data": [
    {
      "_id": "66d3e4f5a6b7c8d9e0f1a2b3",
      "type": "credit",
      "category": "cashback",
      "amount": 100,
      "balance_after": 2450.00,
      "reference_type": "referral",
      "description": "Referral bonus for inviting Pooja Verma",
      "created_at": "2026-09-10T11:15:00.000Z"
    },
    {
      "_id": "66d3e4f5a6b7c8d9e0f1a2b2",
      "type": "debit",
      "category": "purchase",
      "amount": 650,
      "balance_after": 2350.00,
      "reference_type": "order",
      "reference_id": "66c2d3e4f5a6b7c8d9e0f1a2",
      "description": "Payment for Order #ORD-2026-99120",
      "created_at": "2026-09-03T16:20:00.000Z"
    }
  ],
  "pagination": {
    "total": 24,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

---

## 8. Government KYC & Sandbox Verification Response Contracts

### 8.1 PAN Verification Response (`POST /identity/verification/pan`)
```json
{
  "success": true,
  "message": "PAN verified successfully.",
  "data": {
    "pan_number": "ABCDE1234F",
    "registered_name": "ARJUN VERMA",
    "name_match_score": 100,
    "status": "verified",
    "verification_timestamp": "2026-09-11T12:00:00.000Z"
  }
}
```

### 8.2 Aadhaar OTP Verification Response (`POST /identity/verification/aadhaar/verify-otp`)
```json
{
  "success": true,
  "message": "Aadhaar verified successfully.",
  "data": {
    "aadhaar_last_four": "1098",
    "name": "Arjun Verma",
    "gender": "M",
    "year_of_birth": "1994",
    "state": "Karnataka",
    "status": "verified"
  }
}
```
