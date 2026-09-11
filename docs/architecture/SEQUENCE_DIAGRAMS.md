# Architecture Sequence Diagrams Spec
## BizReels Marketplace Platform

---

## 1. Google OAuth & Sign-in Lifecycle

This sequence details the user login lifecycle using Google OAuth and JWT access/refresh token exchanges.

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as React Client
  participant API as Express API
  participant Google as Google Auth Servers
  participant DB as MongoDB Atlas

  User->>UI: Clicks "Login with Google"
  UI->>API: GET /api/v1/auth/google
  API->>Google: Redirect to Google consent screen
  Google-->>User: Present consent screen
  User->>Google: Authenticates & grants scopes
  Google->>API: GET /api/v1/auth/google/callback (Auth Code)
  API->>Google: Exchange Auth Code for Profile Tokens
  Google-->>API: Profile details (email, googleId, name)
  API->>DB: Check if Google User exists
  alt User exists
    DB-->>API: Return User record
  else User is new
    API->>DB: Save new User (role: 'customer', walletBalance: 0)
    DB-->>API: Return new User record
  end
  API->>API: Generate Access Token (JWT - payload: id, roles)
  API->>API: Generate Refresh Token (JWT, saves in db/session)
  API->>UI: Set HttpOnly Refresh Cookie & Redirect with Access Token in URI
  UI->>UI: Save Access Token in Redux memory state
  UI->>API: Fetch current user profiles
  API-->>UI: Loaded profile configurations
```

---

## 2. Double-Entry Escrow & Payout Sequence

This sequence details the database session transaction wrapping wallet allocations upon quote acceptance.

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant UI as React Client
  participant API as Express API
  participant DB as MongoDB Atlas
  actor Vendor

  Customer->>UI: Clicks "Accept Quote Bid"
  UI->>API: PATCH /api/v1/requirements/quotes/:quoteId (Accept)
  API->>DB: startSession() & startTransaction()
  API->>DB: Read Customer Wallet Balance
  DB-->>API: Customer Balance (₹5000)
  API->>API: Check Balance >= Quote Cost (₹3500)
  alt Balance Insufficient
    API->>DB: abortTransaction()
    API-->>UI: Return "Insufficient Wallet Balance" status (400)
  else Balance Sufficient
    API->>DB: Update Customer Wallet: Deduct ₹3500
    API->>DB: Write WalletTransaction (debit, category: 'escrow_hold')
    API->>DB: Update Quote (status: 'accepted', paymentStatus: 'paid')
    API->>DB: Update Requirement (status: 'closed')
    API->>DB: commitTransaction() & endSession()
    DB-->>API: Commit successful
    API->>Vendor: Emit Socket 'quote_accepted' notification
    API-->>UI: Success confirmation. Bidding locked.
  end

  Note over Vendor: Vendor completes project deliverables
  Vendor->>UI: Request milestone payout approval
  UI->>API: POST /api/v1/hires/:id/complete (Complete)
  API->>DB: startSession() & startTransaction()
  API->>DB: Write WalletTransaction (credit to Vendor wallet)
  API->>DB: Update Vendor Wallet: Add ₹3500
  API->>DB: Update Quote (status: 'completed')
  API->>DB: commitTransaction() & endSession()
  DB-->>API: Payout complete. Session closed.
```

---

## 3. Role-Switching Dashboard Lifecycle

This sequence details how a user switches their active UI workspace role and triggers dashboard reload configurations.

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as React Client
  participant API as Express API
  participant Store as Redux State

  User->>UI: Selects "Switch to Vendor Workspace"
  UI->>API: PATCH /api/v1/auth/switch-role (role: 'vendor')
  API->>API: Validate user has role 'vendor' in roles array
  API->>API: Update activeRole field to 'vendor' on User document
  API-->>UI: Success payload (updated User JSON with activeRole: 'vendor')
  UI->>Store: Dispatch setUser(updatedUser)
  Store-->>UI: Update Redux selection state
  UI->>UI: React Router redirects to '/vendor/dashboard'
  UI->>API: Fetch vendor catalogs & nearby category leads
  API-->>UI: Return vendor listings and proximity requirements
  UI-->>User: Renders glassmorphic Vendor Dashboard
```
