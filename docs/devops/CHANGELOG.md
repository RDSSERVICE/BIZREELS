# Changelog

All notable changes to the BizReels local social commerce platform will be documented in this file.

---

## [1.4.0] - 2026-09-11

### Added
* **Production-Grade Admin Reels Governance & Modular Architecture**:
  * **Modular Reel Subservice Layer (`backend/src/services/reel/`)**:
    * Implemented `admin.reel.service.js` encapsulating live telemetric aggregations, multi-criteria server-side query filters, soft takedowns, restores, boost management, and atomic bulk operations.
    * Added clean facade pattern (`backend/src/services/reel/index.js`) and refactored `admin.routes.js` to eliminate inline queries and delegate cleanly to the service layer.
    * Integrated formal `AuditLog` persistence and real-time WebSocket event broadcasts (`reel:takedown`, `reel:restored`, `reel:boosted`, `admin:update`).
  * **New Administrative Reels API Endpoints**:
    * `GET /admin/reels/stats`: Live platform aggregation returning total catalog count, trending count, views, likes, comments, boosted reels, and review queue depth.
    * `GET /admin/reels`: Multi-criteria catalog query supporting server-side regex search, postType filters, and creator/listing population.
    * `POST /admin/reels/:id/takedown` & `POST /admin/reels/:id/restore`: Soft deletion and instant restoration with audit logging.
    * `POST /admin/reels/:id/moderate`: Policy moderation review recording formal approval/rejection with preset violation categories.
    * `POST /admin/reels/:id/boost`: Discovery boost toggle with 7-day expiration handling.
    * `POST /admin/reels/bulk-action`: Atomic batch execution for bulk takedown, bulk restore, bulk boost, and bulk approve.
  * **Modular Frontend Component Hierarchy (`frontend/src/pages/admin/reels/components/`)**:
    * Refactored monolithic page into focused subcomponents: `ReelKpiBanner`, `ReelFilterBar`, `ReelBatchActionBar`, `ReelTable`, `ReelPreviewModal`, `ReelModerateModal`, and `reelUtils.js`.
    * Main `AdminReelsPage.jsx` maintained as a clean, declarative orchestrator under 200 lines.
    * Integrated real-time count badges into `AdminTabBar` reflecting live database stats without polling.
  * **Strict Warm Bento-Brutalism Theme Alignment**:
    * Completely eradicated legacy cool purple, blue, and pink styling in favor of the website design tokens (`#fbf9f4`, `#f8f4ec`, `#e3dccb`, `#1a1a1a`, `#d99a3d`, `Archivo Black` / `Outfit` typography).

---

## [1.3.0] - 2026-09-07

### Added
* **Production-Grade Creator Revenue & Escrow Architecture**:
  * **True Escrow Holding**: Implemented immediate wallet debiting on vendor campaign proposal creation (`escrowStatus: 'held'`), eliminating default risk while creators work on deliverables.
  * **Dynamic Platform Take-Rate & Commission Ledger**: Integrated platform fee calculation (5% default via `commissionService`) with automatic split into creator net payout (`netCreatorAmount`) and platform commission ledger (`Commission`).
  * **Automated Escrow Lifecycle**: Built automatic escrow refunds on proposal cancellation or creator rejection (`escrowStatus: 'refunded'`), budget adjustments on proposal edit, and automated net release upon campaign completion or 100% milestone approval (`escrowStatus: 'released'`).
  * **Role-Targeted Wallet Routing**: Enhanced `walletRepository.updateWalletBalance` to accept explicit `options.targetRole` (`'creator'`, `'vendor'`, `'customer'`), replacing fragile substring heuristics and synchronizing legacy `User.walletBalance` with `IsolatedWallet`.
  * **Creator Dashboard Metrics & Escrow Tracking**: Added `escrowInReview` (funds secured in progress), `grossEarnings`, and isolated net earnings to `creatorController.js` and `analyticsController.js`.
  * **Transparent Creator Dashboard UI**: Added "Escrow in Progress" stat card and per-campaign gross budget, platform fee deduction, and net take-home breakdown with `Escrow Secured` status pills.

---

## [1.2.0] - 2026-08-26

### Added
* **Flipkart-Style Multi-Step Instant Checkout**: Redesigned Direct Buy checkout flow into a 4-step accordion experience: Delivery Address (with live GPS detection), Order Summary (Quantity +/- and booking slots), Coupons & Bank Offers, and Payment Options (Vendor UPI/QR, COD, Bank Transfer).
* **Coupons & Promo Codes System**: Added real-time coupon code validation (`POST /v1/offers/validate-coupon`), 1-click applicable coupons drawer (`GET /v1/offers/applicable`), and savings preview banners.
* **Shiprocket Logistics & Shipping Engine**: Added `shiprocket.service.js` with live courier rate estimation (`POST /v1/offers/calculate-shipping`) and Free Delivery above ₹499 rule.
* **Subscription Add-Ons System**:
  * Added dynamic Add-ons manager for Admins (`PlanAddonEditor.jsx`) to attach optional capacity add-ons (reels limit, AI credits, leads quota, verified badges) to subscription plans.
  * Added interactive Add-ons selector (`AddonsSelector.jsx`) and SaaS checkout modal (`SubscriptionCheckoutModal.jsx`) for Vendors and Creators with real-time price tallying (`Base Plan + Addons Total`).
  * Updated Razorpay and Wallet checkout services to process and record selected add-ons.
* **Modular React Subcomponents Architecture**: Refactored `DirectBuyModal.jsx` and `SubscriptionTab.jsx` into focused, reusable subcomponents.

---

## [1.1.0] - 2026-08-24

### Added
* **Dynamic SEO & Structured Data Engine**: Implemented full Schema.org JSON-LD structured data (`WebSite`, `Organization`, `Product`, `Service`, `LocalBusiness`, `BreadcrumbList`, `CollectionPage`, `VideoObject`) across all public pages.
* **Dynamic XML Sitemap & Index**: Added dynamic backend sitemap generation (`/sitemap.xml`, `/sitemap-index.xml`) indexing published listings, active categories, and verified vendors with automated ISO `lastmod` dates and `Cache-Control` headers.
* **Production Crawl Directives**: Added `robots.txt` protecting administrative, authenticated, and private customer dashboards while exposing public discovery routes to search engines.
* **Responsive Image System (`LazyImage.jsx`)**: Integrated Cloudinary AVIF/WebP auto-formatting with responsive multi-resolution `srcset` (`400w`, `800w`, `1200w`), LCP priority mode (`fetchpriority="high"`), skeleton placeholders, and CLS layout reservation.
* **Granular Rollup Code Splitting**: Restructured Vite manual chunking to split monolithic 1,047 kB bundle into modular packages (`vendor-react`, `vendor-core`, `vendor-charts`, `vendor-icons`, `vendor-ui`, `vendor-motion`).
* **Backend Query & Caching Optimizations**: Parallelized database queries with `Promise.all`, added 30–60s multi-tier TTL caching on trending and recommended feeds, and implemented media URI defensive sanitizers.

---

## [1.0.0] - 2026-07-15

### Added
* **Project Knowledge Base**: Created 16 comprehensive markdown documentation files inside `/docs` to make the codebase self-documenting for developers and AI agents.
* **Master AI Context**: Added `docs/AI_CONTEXT.md` as a high-density, centralized context map.
* **MERN Stack Architecture**: Refactored the core application backend from FastAPI (Python) to Node.js, Express, and Mongoose/MongoDB.
* **Vite Compilation Engine**: Migrated the frontend bundler from Craco/CRA (Webpack) to Vite, configuring JSX support inside `.js` files.
* **Real-time Event Integration**: Added Socket.IO integration to synchronize messages, negotiation offers, notification chips, and wallet totals instantly.
* **Scraper-Resistant Contact Reveals**: Masked phone numbers, rate-limiting reveals to 5 per day, with exemptions for chat relationships, Pro users, or spending credits.
* **Atomic KYC Payouts**: Added conditional database updates to reward profile completion bonuses atomically, preventing concurrency race conditions.
* **Google Gemini AI Helpers**: Implemented listing content generation, description rewriters, requirement parsing, and pricing estimators using the Gemini API.
* **Razorpay Payment Integration**: Integrated payments webhook raw body verification and top-up ledger actions.
