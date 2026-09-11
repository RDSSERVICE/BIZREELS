# User Stories & Use Cases Document
## BizReels Marketplace Platform

---

## 1. User Stories

### 1.1 Customer Stories
- **US-C1 (Hyperlocal Discovery)**: As a **Customer**, I want to **search for products and services near my current location** so that I can buy from local businesses and get them immediately.
- **US-C2 (Requirement Leads)**: As a **Customer**, I want to **post a custom project requirement brief** so that local vendors can submit quotes directly matching my budget and timeline.
- **US-C3 (Visual Feeds)**: As a **Customer**, I want to **scroll through short video reels of local vendors showing off their items** so that I can see the real quality before I make a purchase decision.
- **US-C4 (Real-Time Communication)**: As a **Customer**, I want to **chat directly with a vendor** so that I can ask clarifying questions and coordinate delivery details.

### 1.2 Vendor Stories
- **US-V1 (Catalog Storefront)**: As a **Vendor**, I want to **list my services and products with geo-tagged locations** so that local buyers searching within my radius can discover me.
- **US-V2 (Lead Bidding)**: As a **Vendor**, I want to **view local customer requirements matching my business category** so that I can submit proposals and bid on active buyers.
- **US-V3 (AI Content Assistance)**: As a **Vendor**, I want to **use AI to generate descriptions for my catalog items** so that I can create listings quickly without writing copy from scratch.
- **US-V4 (Creator Campaigns)**: As a **Vendor**, I want to **hire a local videographer creator to shoot reels for my products** so that I can boost my catalog engagement.

### 1.3 Creator Stories
- **US-CR1 (Monetization)**: As a **Creator**, I want to **define custom pricing packages for content delivery** so that vendors know exactly what services I offer and at what price.
- **US-CR2 (Portfolio Building)**: As a **Creator**, I want to **link sample reels directly to my portfolio profile** so that visiting vendors can evaluate my video quality and style.

### 1.4 Admin Stories
- **US-A1 (Compliance Verification)**: As an **Admin**, I want to **review vendor registration documents** so that I can verify businesses and maintain platform trust.
- **US-A2 (Auditing & Moderation)**: As an **Admin**, I want to **view user transaction history ledger and flag/remove compliance-breaking content** so that the platform stays secure and clean.

---

## 2. Core Use Cases

### 2.1 Use Case 1: Post Custom Requirement & Receive Quotes
- **Actor**: Customer (initiates), Vendor (responds).
- **Description**: A customer lists a specific need, and local category-matching vendors bid on it.
- **Pre-Conditions**:
  - Customer is logged in and has an active role set to `customer`.
  - Vendor has a verified profile matching the category.
- **Normal Flow**:
  1. Customer navigates to "Post Requirement" panel.
  2. Customer inputs title, description, category, budget, deadline date, and selects their location address.
  3. System matches coordinates and saves the requirement document with `status: "open"`.
  4. Matching local vendors see the lead on their "Leads Dashboard".
  5. Vendor enters a Quote bid containing price, estimated delivery date, and description notes.
  6. System saves the quote bid and increments the requirement's `quotesCount`.
- **Alternative/Error Flow**:
  - *No matching category*: System alerts the customer if no vendors are registered under the selected category.
  - *Duplicate Quote*: If a vendor attempts to bid again on the same requirement, the system returns a validation error (due to compound index safety constraints).

### 2.2 Use Case 2: Accept Proposal & Lock Escrow Funds
- **Actor**: Customer.
- **Description**: Customer reviews bids, accepts a proposal, and locks the payment in escrow.
- **Pre-Conditions**:
  - Customer wallet balance is greater than or equal to the selected vendor's bid price.
  - Quote status is `pending`.
- **Normal Flow**:
  1. Customer views the list of quotes submitted for their requirement.
  2. Customer clicks "Accept Quote" on a specific vendor's bid.
  3. System initiates a database session transaction.
  4. System debits the quote price from the Customer's wallet balance.
  5. System sets the quote status to `accepted` and requirement status to `closed`.
  6. System locks the funds in an escrow transaction holding, writing double-entry ledger logs.
  7. System notifications are sent to the vendor.
- **Alternative/Error Flow**:
  - *Insufficient Balance*: If customer balance is lower than bid price, transaction aborts. System prompts Customer to "Recharge Wallet".
  - *Transaction Aborted*: If any DB query fails mid-execution, Mongoose rollback occurs, ensuring no balances are updated.

### 2.3 Use Case 3: Vendor Hires Creator for Marketing Campaign
- **Actor**: Vendor (initiates), Creator (responds).
- **Description**: Vendor contracts a Creator to produce marketing reels content.
- **Pre-Conditions**:
  - Vendor wallet balance covers the campaign budget.
  - Creator's availability is set to `available`.
- **Normal Flow**:
  1. Vendor visits Creator portfolio and clicks "Hire Creator".
  2. Vendor inputs project title, campaign briefs, budget, and delivery timeframe (days).
  3. Creator receives notification and reviews the pending `HireRequest`.
  4. Creator clicks "Accept Hire".
  5. System transaction session starts: locks the budget from Vendor's wallet in escrow.
  6. Creator delivers the promotional reel content.
  7. Vendor marks the project `completed`, releasing escrowed funds to Creator's wallet.
- **Alternative/Error Flow**:
  - *Creator rejects*: Creator clicks "Reject Hire". Request status updates to `rejected`. No wallets are debited.
  - *Dispute/No Delivery*: (Edge Case) If creator does not deliver, vendor can flag the hire request. Admin reviews audit logs to resolve and perform manual refund.

### 2.4 Use Case 4: Upload & Boost Reels Content
- **Actor**: Vendor or Creator.
- **Description**: Users upload promotional short video reels and apply subscription credits to boost visibility.
- **Pre-Conditions**:
  - User has active role `vendor` or `creator`.
  - User has a premium/business subscription with active boost credits.
- **Normal Flow**:
  1. User navigates to the Reels upload interface.
  2. User selects a video file, inputs caption details, hashtags, and storefront coordinates.
  3. System uploads media files to Cloudinary and saves the reel document with `isDraft: false`.
  4. User toggles the "Boost Visibility" switch.
  5. System checks subscription state, debits 1 boost credit, and flags the reel document as `isBoosted: true`.
  6. The boosted reel gets priority positioning in user feed algorithms.
- **Alternative/Error Flow**:
  - *No Credits*: If user toggles boost but has 0 credits, system blocks action and requests subscription upgrade.
