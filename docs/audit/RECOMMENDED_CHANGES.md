# Recommended Backend Code Changes

> **Notice:** Per the API Audit protocol, **no production or business logic code was modified during this documentation task**.  
> The changes below represent vetted, high-value code improvements identified during the audit. They are documented here for team review and staged execution.

---

## Change Proposal 1: Add Google Session-Exchange Route Alias

* **File:** [`backend/src/routes/authRoutes.js`](file:///d:/BizReels%20Website/backend/src/routes/authRoutes.js)
* **Function:** Route registration for Google Token login
* **Current Implementation:**
  ```javascript
  // backend/src/routes/authRoutes.js:164-166
  router.post('/google/token', authLimiter, authController.googleTokenLogin);
  router.post('/google/mobile', authLimiter, authController.googleTokenLogin);
  router.post('/app/google', authLimiter, authController.googleTokenLogin);
  ```
* **Problem:** Existing frontend clients (`frontend/src/lib/api.js:161`) and legacy documentation expect `POST /api/v1/auth/google/session-exchange`. When called, the server currently returns `404 Not Found`.
* **Recommended Implementation:**
  ```javascript
  router.post(
    ['/google/token', '/google/mobile', '/app/google', '/google/session-exchange'],
    authLimiter,
    authController.googleTokenLogin
  );
  ```
* **Risk:** Extremely Low.
* **Breaking / Non-breaking:** **Non-breaking** (strictly adds a backward-compatible route alias).
* **Reason:** Eliminates 404 runtime errors for web clients and aligns backend with documentation.

---

## Change Proposal 2: Unify Authentication Middleware Modules

* **File:** [`backend/src/middleware/auth.middleware.js`](file:///d:/BizReels%20Website/backend/src/middleware/auth.middleware.js) & [`backend/src/middleware/auth.js`](file:///d:/BizReels%20Website/backend/src/middleware/auth.js)
* **Function:** JWT verification middleware
* **Current Implementation:**
  Two separate files implement near-identical logic for extracting Bearer tokens and loading `req.user`. Different routes import from different files, leading to slight discrepancies in error codes (`AUTH_REQUIRED` vs generic string).
* **Problem:** Architectural duplication and divergence hazard.
* **Recommended Implementation:**
  Re-export `authenticate` as `requireAuth` from `backend/src/middleware/auth.js`:
  ```javascript
  // In backend/src/middleware/auth.js
  module.exports = {
    authenticate,
    requireAuth: authenticate,
    authorize,
    optionalAuth
  };
  ```
  And in `backend/src/middleware/auth.middleware.js`, forward all calls to `auth.js`.
* **Risk:** Low.
* **Breaking / Non-breaking:** **Non-breaking**.
* **Reason:** Ensures uniform error response formatting across all 517 endpoints.

---

## Change Proposal 3: Explicit INR & Paise Field Clarification in Cart Checkout

* **File:** [`backend/src/routes/cart.routes.js`](file:///d:/BizReels%20Website/backend/src/routes/cart.routes.js) (or cart checkout handler)
* **Function:** `checkout` handler return payload
* **Current Implementation:**
  Returns `grand_total_inr` and `razorpay_order.amount` (in paise).
* **Problem:** Mobile developers frequently confuse the two fields and display the paise amount directly in UI.
* **Recommended Implementation:**
  Add an explicit, unambiguous object to the response:
  ```javascript
  res.json({
    success: true,
    message: 'Checkout initiated successfully.',
    data: {
      order_ids: createdOrders.map(o => o._id),
      pricing: {
        currency: 'INR',
        amount_inr: grandTotalInr,
        amount_paise: Math.round(grandTotalInr * 100)
      },
      razorpay_order: razorpayOrder,
      payment_method: paymentMethod
    }
  });
  ```
* **Risk:** Low.
* **Breaking / Non-breaking:** **Non-breaking** (preserves existing fields while adding `pricing`).
* **Reason:** Prevents critical price display bugs on Android.

---

## Change Proposal 4: Add Canonical Deprecation Warning Header to `/vendor-orders`

* **File:** [`backend/src/routes/index.js`](file:///d:/BizReels%20Website/backend/src/routes/index.js)
* **Function:** Mount registration for order routes
* **Current Implementation:**
  ```javascript
  router.use('/orders', lazyLoad('./orderRoutes'));
  router.use('/vendor-orders', lazyLoad('./orderRoutes'));
  ```
* **Problem:** Both paths work identically, creating confusion on which endpoint is canonical.
* **Recommended Implementation:**
  Add a deprecation header middleware when accessed via `/vendor-orders`:
  ```javascript
  router.use('/orders', lazyLoad('./orderRoutes'));
  router.use('/vendor-orders', (req, res, next) => {
    res.setHeader('Warning', '299 - "The /vendor-orders endpoint is deprecated. Use /orders instead."');
    next();
  }, lazyLoad('./orderRoutes'));
  ```
* **Risk:** None.
* **Breaking / Non-breaking:** **Non-breaking**.
* **Reason:** Standards-compliant API migration signaling.
