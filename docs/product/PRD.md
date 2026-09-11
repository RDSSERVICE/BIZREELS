# Product Requirement Document (PRD)
## BizReels Marketplace Platform

---

## 1. Document Control & Status

| Title | Product Requirement Document (PRD) |
|---|---|
| Product Version | MVP 1.0 |
| Date | July 17, 2026 |
| Status | Planning Draft |

---

## 2. Product Vision & Value Proposition

BizReels is designed to help local businesses and content creators thrive by combining **interactive visual feeds** (TikTok/Instagram style reels) with **hyperlocal search and transaction tools**. 

Unlike conventional e-commerce platforms, BizReels allows:
1. Customers to watch local creators/vendors demonstrate products in short, geolocated reels.
2. Customers to post a request for a custom job/service and receive direct quotes from nearby vendors.
3. Vendors to collaborate with creators directly by hiring them through the platform to make reels.
4. Safe transactions backed by an in-platform escrow wallet.

---

## 3. Actor Personas & Roles Mapping

| Actor | Persona Description | Core Platform Value | Primary Feature Usage |
|---|---|---|---|
| **Customer** | Local buyer looking for custom services or nearby products (e.g. customized cakes, local photography). | Visual validation of vendor quality via reels, painless proximity bidding. | Search, Requirements Post, Quote Reviews, Wallet Payments, Direct Chat. |
| **Vendor** | Local business owner seeking to reach nearby customers without massive advertising budgets. | Direct access to local custom requests, AI copywriting help, creator-driven marketing. | Listings catalog, Requirements Bidding, Hire Creator, Upload Reels, Start Live. |
| **Creator** | Creative videographer, photographer, or influencer who shoots product reviews and guides. | Standardized portfolio packages, secure contracts with escrow locks, monetization. | Package pricing setup, portfolio reels upload, HireRequest accept/deliver, Live Stream. |
| **Admin** | Operations moderator checking document validity and platform safety. | Clean moderation dashboard, system audits, user compliance. | User document approval, audit log audits, content soft-deletes. |

---

## 4. Key Epics & Features Breakdown

### Epic 1: Registration, Profiles, & Multi-Role Switching
- **PRD-1.1**: Email & Google OAuth signup. Role onboarding inputs.
- **PRD-1.2**: Swapping active roles (Customer, Vendor, Creator) inside a single profile session, toggling layout dashboards without logging out.
- **PRD-1.3**: Creator portfolio configurations (Pricing Packages, Skills list, Bio) and Vendor storefront coordinates.

### Epic 2: Hyperlocal Catalog Search
- **PRD-2.1**: Browse catalog listings filtered by geolocation coordinates (radius distance using `$geoNear`), category, price, and item condition.
- **PRD-2.2**: Catalog items creation (Products and Services) with pricing, images, and geolocation points.
- **PRD-2.3**: AI text copywriting assistance to write descriptions based on title and category.

### Epic 3: Proximity Bidding & Escrow Settlement
- **PRD-3.1**: Customer posts custom Requirement briefs (title, details, budget, deadline, coordinates).
- **PRD-3.2**: Category-matching vendors receive notifications of local leads and submit single quote bids.
- **PRD-3.3**: Customer accepts proposal; funds equivalent to the quote price are debited from Customer wallet and locked in Escrow.
- **PRD-3.4**: Ledger records double-entry accounts mapping to prevent balance leakage.

### Epic 4: Social Reels & Engagement
- **PRD-4.1**: Upload short videos (Reels) with caption and hashtag indexation.
- **PRD-4.2**: Video feed UI with vertical scrolling, likes count updates, and comments drawer layout.
- **PRD-4.3**: Boost system allowing vendors/creators to spend subscription credits to prioritize listing/reel delivery.

### Epic 5: Vendor-Creator Collaboration (Hiring)
- **PRD-5.1**: Vendor views Creator portfolios and initiates a contract request (`HireRequest`) with specific budget and duration.
- **PRD-5.2**: Creator accepts request, debiting and holding vendor's budget in escrow.
- **PRD-5.3**: Work deliverables uploaded and marked completed, triggering escrow release to Creator wallet.

### Epic 6: Real-Time Sockets Inbox
- **PRD-6.1**: Thread-based chats linking buyers, vendors, and creators.
- **PRD-6.2**: Real-time typing indicators, read receipts, and message delivery.
- **PRD-6.3**: Live stream text scroll tickers and real-time like interactions.

---

## 5. UI/UX Visual Guidelines & Design Tokens

> [!NOTE]
> The UI must follow a premium glassmorphic style with Framer Motion animations. No raw Tailwind utility files should override central design components.

### 5.1 Color Palette
- **Brand Navy (Dark)**: `#0D1B2A` (Background foundations, typography headers)
- **Brand Purple**: `#6A0DAD` (Primary buttons, active indicators, call-to-actions)
- **Brand Pink**: `#E0115F` (Social likes, secondary branding, reels icons)
- **Success Mint**: `#2EC4B6` (Wallet recharges, accepted bids, active budgets)
- **Alert Orange**: `#FF9F1C` (Requirement budgets, pending leads alerts)

### 5.2 Responsive Layout
- **Mobile Viewports**: Bottom navigation panel (Feed, Search, Upload, Inbox, Profile).
- **Desktop/Tablet**: Left-side vertical sidebar with clean dashboards.

---

## 6. Key Performance Indicators (KPIs) & Analytics

1. **Local Lead Match Rate**: % of customer requirements that receive at least 1 vendor quote within 12 hours.
2. **Escrow Completion Ratio**: % of accepted bids/hire requests that reach completed state rather than being disputed.
3. **Boost Conversion**: Increase in viewer engagement (views, clicks) on boosted reels/listings vs. standard items.
4. **Active Role Switch Frequency**: Frequency of users toggling between Customer and Vendor/Creator dashboards to measure multi-role engagement.

---

## 7. Risks & Mitigation Plan

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Escrow Cash Leakage** | Critical | Utilize Mongoose transactional sessions (`session.withTransaction`) to guarantee database state changes succeed or rollback atomically. |
| **Fake Vendor Storefronts** | High | Require document uploads (`vendorProfile.documents`) and admin approval before a vendor can access nearby leads or post listings. |
| **High Video Loading Latency** | Medium | Deliver videos through Cloudinary CDN. Generate thumbnails and use low resolution bitrates for preview feeds. |
