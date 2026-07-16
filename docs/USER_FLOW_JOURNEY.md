# User Flow & Journeys Document
## BizReels Marketplace Platform

---

## 1. User Journeys

### 1.1 Customer Journey: Local Custom Request Fulfillment

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant UI as React App Viewport
  participant API as Express API
  participant DB as MongoDB Atlas
  participant Vendor

  Customer->>UI: Navigates to requirements/new
  Customer->>UI: Fills brief details, coordinates & budget (₹2000)
  UI->>API: POST /requirements (authenticated)
  API->>DB: Save Requirement (status: 'open', location: GeoJSON)
  API-->>UI: Confirm posted requirement
  Note over API, DB: Geospatial query indexes matching local vendors
  API->>Vendor: Push Alert: New matching proximity lead
  Vendor->>UI: Reviews leads & inputs Quote bid (₹1800, 3 days)
  UI->>API: POST /requirements/quotes
  API->>DB: Save Quote (status: 'pending')
  API->>Customer: Alert: New quote proposal received
  Customer->>UI: Accepts Quote
  UI->>API: PATCH /requirements/quotes/:id
  Note over API: Session Transaction: Debit wallet, lock escrow
  API->>DB: Update Quote (status: 'accepted', paymentStatus: 'paid')
  API->>DB: Update Requirement (status: 'closed')
  API-->>UI: Transaction complete
  API->>Vendor: Alert: Proposal accepted. Start job.
```

### 1.2 Vendor Journey: Creator Collaboration Campaign

```mermaid
sequenceDiagram
  autonumber
  actor Vendor
  participant UI as React App Viewport
  participant API as Express API
  participant DB as MongoDB Atlas
  actor Creator

  Vendor->>UI: Navigates to Creator Marketplace
  Vendor->>UI: Filters by skills, pricing, and ratings
  Vendor->>UI: Clicks "Hire Creator" & inputs campaign details
  UI->>API: POST /hires
  API->>DB: Save HireRequest (status: 'pending')
  API->>Creator: Push Notification: Hire Offer Received
  Creator->>UI: Reviews Campaign and clicks "Accept"
  UI->>API: PATCH /hires/:id (Accept)
  Note over API: Session Transaction: Debit Vendor, Lock Budget Escrow
  API->>DB: Update HireRequest (status: 'accepted')
  API-->>UI: Wallet funds locked. Campaign active.
  Creator->>UI: Complete work, uploads delivery Reels link
  UI->>API: PATCH /hires/:id (Complete)
  Note over API: Release escrow funds to Creator wallet balance
  API->>DB: Update HireRequest (status: 'completed', paymentStatus: 'paid')
  API-->>UI: Campaign completed. Funds released.
```

---

## 2. Core User Flows

### 2.1 Lead Matching & Quoting Flowchart

```mermaid
graph TD
  Start([Customer posts Requirement Brief]) --> Geocoding[Geospatial point indexed 2dsphere]
  Geocoding --> Matching[Filter Vendors within Max Distance & Category]
  Matching --> Notification[Distribute lead alert to local Vendor dashboard]
  Notification --> VendorDecision{Vendor bids?}
  VendorDecision -- No --> Terminate([Lead remains open until deadline])
  VendorDecision -- Yes --> SubmitQuote[Submit Quote with Price & Days]
  SubmitQuote --> UniqueCheck{Already quoted?}
  UniqueCheck -- Yes --> Error[Reject: Duplicate Quote validation error]
  UniqueCheck -- No --> QuoteSaved[Save Quote as pending & increment quotesCount]
```

### 2.2 Wallet Escrow Session Transaction Flowchart

```mermaid
graph TD
  Start([Customer accepts Quote / Creator accepts Hire]) --> WalletCheck{Wallet Balance >= Cost?}
  WalletCheck -- No --> RechargePrompt[Alert: Insufficient balance. Prompt recharge]
  WalletCheck -- Yes --> TransactionStart[Start Mongoose Session Transaction]
  TransactionStart --> Debit[Debit Cost from Sender walletBalance]
  Debit --> EscrowLock[Credit matching Escrow holding logs ledger]
  EscrowLock --> UpdateStatus[Set proposal status: accepted, payment: paid]
  UpdateStatus --> Success{All updates succeed?}
  Success -- Yes --> Commit[Commit Transaction Session]
  Success -- No --> Rollback[Abort Transaction & Rollback changes]
  Commit --> Done([Order status updated & notification sent])
  Rollback --> ErrorPage([Alert: Escrow setup failed])
```
