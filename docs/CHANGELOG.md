# Changelog

All notable changes to the BizReels local social commerce platform will be documented in this file.

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
