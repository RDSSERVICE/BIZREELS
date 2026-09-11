# BizReels API Testing Guide & cURL / Postman Cookbook

> **Platform Version:** 1.4.0  
> **Target Environment:** Local Development (\`http://localhost:5000/api/v1\`) & Production (\`https://bizreels.in/api/v1\`)  
> **Source of Truth:** Verified Backend Endpoints (\`backend/src/routes/\`)  

---

## 1. Environment Configuration

### Postman / Environment Variables
Define the following environment variables in Postman, Bruno, or your terminal environment:

```bash
BASE_URL=https://bizreels.in/api/v1
# For local development:
# BASE_URL=http://localhost:5000/api/v1

ACCESS_TOKEN=""
REFRESH_TOKEN=""
USER_ID=""
LISTING_ID=""
REEL_ID=""
ORDER_ID=""
```

---

## 2. Authentication & Identity Flow

### 2.1 Send Mobile OTP (Dual-Channel SMS/WhatsApp)
```bash
curl -X POST "$BASE_URL/auth/otp/send" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "channel": "sms"
  }'
```

### 2.2 Verify Mobile OTP & Receive JWT Tokens
```bash
curl -X POST "$BASE_URL/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "otp": "123456",
    "name": "Arjun Verma",
    "roles": ["customer", "vendor"],
    "referral_code": "BIZWIN99"
  }'
```
*Tip: Copy the returned `accessToken` into your environment variables.*

### 2.3 Direct Google Mobile ID Token Exchange
```bash
curl -X POST "$BASE_URL/auth/google/token" \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
    "role": "customer"
  }'
```

### 2.4 Rotate Expired Access Token
```bash
curl -X POST "$BASE_URL/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'"$REFRESH_TOKEN"'"
  }'
```

### 2.5 Switch Active Workspace Role
```bash
curl -X PATCH "$BASE_URL/auth/switch-role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "role": "vendor"
  }'
```

### 2.6 Get Current Logged-In User Profile
```bash
curl -X GET "$BASE_URL/auth/me" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 3. Catalog Listings & Inventory

### 3.1 Fetch Paginated Listings Feed (with Geo-Proximity)
```bash
curl -X GET "$BASE_URL/listings?page=1&limit=20&lat=12.9784&lng=77.6408&radius=15" \
  -H "Accept: application/json"
```

### 3.2 Create New Product Listing (Vendor Role)
```bash
curl -X POST "$BASE_URL/listings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Handcrafted Terracotta Water Jug",
    "description": "Natural clay cooling jug with brass tap.",
    "price": 850,
    "category": "Home & Kitchen",
    "type": "product",
    "stock": 30,
    "images": [
      "https://res.cloudinary.com/bizreels/image/upload/v1/jug_front.jpg"
    ]
  }'
```

### 3.3 Get Listing Details by ID
```bash
curl -X GET "$BASE_URL/listings/$LISTING_ID" \
  -H "Accept: application/json"
```

---

## 4. Video Reels & Social Interactions

### 4.1 Fetch Video Reels Recommendation Feed
```bash
curl -X GET "$BASE_URL/feed/reels?page=1&limit=10" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 4.2 Upload & Publish Short-Form Reel
```bash
curl -X POST "$BASE_URL/reels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "videoUrl": "https://res.cloudinary.com/bizreels/video/upload/v1/demo.mp4",
    "caption": "Hand-carving pure teak wood! #woodworking #artisan",
    "taggedListings": ["'"$LISTING_ID"'"],
    "category": "Artisan Crafts"
  }'
```

### 4.3 Idempotently Toggle Like on a Reel
```bash
curl -X POST "$BASE_URL/reels/$REEL_ID/like" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 4.4 Post Comment on Reel
```bash
curl -X POST "$BASE_URL/reels/$REEL_ID/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "text": "Stunning craftsmanship! Do you take custom dimensions?"
  }'
```

---

## 5. Shopping Cart & Direct Checkout

### 5.1 Add Item to Cart
```bash
curl -X POST "$BASE_URL/cart/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "listing_id": "'"$LISTING_ID"'",
    "quantity": 2,
    "customization_notes": "Handle with care, gift wrap please"
  }'
```

### 5.2 Retrieve Current User Cart
```bash
curl -X GET "$BASE_URL/cart" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 5.3 Checkout Cart & Generate Razorpay Payment Order
```bash
curl -X POST "$BASE_URL/cart/checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "delivery_address": {
      "street": "123 Indiranagar 100ft Road",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560038",
      "phone": "9876543210"
    },
    "payment_method": "razorpay",
    "notes": "Leave package at reception"
  }'
```

---

## 6. Orders, Logistics & Tracking

### 6.1 Get Customer Order History
```bash
curl -X GET "$BASE_URL/orders?page=1&limit=20" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 6.2 Get Single Order Details & Shipping Status
```bash
curl -X GET "$BASE_URL/orders/$ORDER_ID" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 7. Wallet & Balance

### 7.1 Check Wallet Balances (Available vs Escrow Locked)
```bash
curl -X GET "$BASE_URL/wallet/balance" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 7.2 Create Wallet Recharge Order (Razorpay)
```bash
curl -X POST "$BASE_URL/wallet/recharge" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "amount": 1000
  }'
```

---

## 8. Government KYC & Sandbox Verification

### 8.1 Verify PAN Card
```bash
curl -X POST "$BASE_URL/identity/verification/pan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "pan_number": "ABCDE1234F",
    "name": "Arjun Verma"
  }'
```

### 8.2 Initiate Aadhaar OTP Verification
```bash
curl -X POST "$BASE_URL/identity/verification/aadhaar/initiate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "aadhaar_number": "987654321098"
  }'
```

---

## 9. AI Services (Gemini 1.5 Flash)

### 9.1 Generate AI Product Copy
```bash
curl -X POST "$BASE_URL/ai/generate-description" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Ceramic Tea Cups Set of 4",
    "keywords": ["matte black", "microwave safe", "handmade", "minimalist"],
    "tone": "creative"
  }'
```

---

## 10. Public & Utility Endpoints

### 10.1 Health Check
```bash
curl -X GET "$BASE_URL/health"
```

### 10.2 Public Contact Submission
```bash
curl -X POST "$BASE_URL/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rohan Patel",
    "email": "rohan@example.com",
    "phone": "9876500000",
    "subject": "Vendor Partnerships",
    "message": "We would like to onboard our 50 artisan handicraft stores onto BizReels."
  }'
```

### 10.3 Newsletter Subscription
```bash
curl -X POST "$BASE_URL/newsletter/subscribe" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rohan@example.com",
    "source": "footer"
  }'
```
