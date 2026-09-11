# API Documentation Audit & Inventory

> **Audit Date:** September 2026  
> **Audited Environment:** BizReels Full-Stack System (v1.4.0)  
> **Backend Source of Truth:** `backend/src/` (Node.js/Express, Mongoose, MongoDB)  
> **Total Existing Documentation Files in `docs/`:** 40  
> **Total Codebase API Endpoints Discovered:** 517 route declarations (504 distinct method + path combinations) across 38 route files + `index.js`  

---

## 1. Executive Summary

A comprehensive, line-by-line audit of all 40 existing markdown documentation files located in `docs/` was performed and cross-referenced against the backend source code (`backend/src/`). The codebase was treated as the immutable source of truth.

### Key Audit Findings:
1. **Severe Documentation Coverage Gap:** While the codebase implements **517 API routes** across 38 route files, existing documentation files (`API_ENDPOINT_LIST.md`, `API_DOCUMENTATION_COMPLETE.md`, `API_REFERENCE.md`, `api.md`) collectively document fewer than **95 unique endpoints** (~18% coverage). More than **420 active backend endpoints** have never been documented.
2. **Phantom Endpoints in Docs:** Documentation and Swagger configs reference endpoints that **do not exist in the backend routes**. Most critically, `docs/AUTHENTICATION.md`, `docs/API_REFERENCE.md`, `frontend/src/lib/api.js`, and `backend/src/config/swagger.config.js` all document and attempt to call:
   - `POST /api/v1/auth/google/session-exchange` — **Does not exist in `authRoutes.js`**. The backend actually provides `POST /api/v1/auth/google/token`, `POST /api/v1/auth/google/mobile`, and `POST /api/v1/auth/app/google`.
3. **Endpoint Path Inconsistencies:** 
   - Multiple documents claim OTP generation is accessed via `POST /auth/otp/request`. In code, `POST /auth/otp/send` is the primary validated controller, while `/auth/otp/request` is merely an unvalidated/loosely validated legacy alias.
   - Dual route mounting: `backend/src/routes/index.js` mounts `orderRoutes.js` under both `/orders` and `/vendor-orders`. Existing docs exclusively refer to `/orders` or `/cart/checkout`.
   - Dual inquiry mounting: `inquiryRoutes.js` is mounted at both `/leads` and `/inquiries`.
4. **Authentication System Duplication:** Two parallel authentication middleware files exist in the codebase:
   - `backend/src/middleware/auth.js` (`authenticate`, `authorize`)
   - `backend/src/middleware/auth.middleware.js` (`requireAuth`, `optionalAuth`)
   Different routes use different middleware imports, creating subtle differences in token extraction error messages, though both accept `Authorization: Bearer <token>` and `cookie: accessToken`.
5. **Admin Route Explosion:** 127 endpoints exist in `backend/src/routes/admin.routes.js`, of which fewer than 10 are mentioned in existing docs.

---

## 2. Complete Inventory of Existing Documentation (40 Files)

| # | File Name | Size (Bytes / Lines) | Primary Domain | Code Accuracy Status | Description & Audit Verdict |
|---|---|---|---|---|---|
| 1 | `AI_CONTEXT.md` | 8.7 KB / 116 L | Context Map | **Accurate** | Master memory map for AI agents. Provides architectural overview, tech stack, and module boundaries. Accurately reflects current stack. |
| 2 | `api.md` | 2.3 KB / 53 L | REST API | **Incomplete / Outdated** | Brief API overview listing only 22 endpoints. Misses ~495 endpoints. Lacks payload schemas, response structures, and error codes. |
| 3 | `API_DOCUMENTATION_COMPLETE.md` | 12.8 KB / 400 L | REST API | **Misleading / Incomplete** | Despite the name "Complete", it documents only 22 endpoints (Auth, Listings, Requirements, Wallet, Chat, Reels). Lacks all Admin, Phase 4, Onboarding, Identity, KYC, and Cart endpoints. |
| 4 | `API_ENDPOINT_LIST.md` | 6.1 KB / 140 L | Endpoint List | **Incomplete** | Quick reference table covering only 46 endpoints across 12 sections. Missing 470+ endpoints. |
| 5 | `API_REFERENCE.md` | 9.7 KB / 169 L | Endpoint Reference | **Conflicting / Incomplete** | Lists ~88 endpoints in markdown bullet points. References phantom endpoint `POST /auth/google/session-exchange`. Missing ~420 endpoints. |
| 6 | `API_SWAGGER_PLAN.md` | 3.0 KB / 108 L | OpenAPI / Swagger | **Accurate (Plan)** | Setup plan for Swagger UI / OpenAPI 3.0 at `/api-docs`. Reflects actual setup in `backend/src/config/swagger.config.js`. |
| 7 | `ARCHITECTURE.md` | 2.9 KB / 69 L | System Arch | **Accurate** | High-level system architecture overview covering client, server, database, caching, and CDN tiers. |
| 8 | `ARCHITECTURE_HIGH_LEVEL.md` | 5.0 KB / 118 L | Architecture | **Accurate** | Detailed infrastructure topology, deployment on Render/Vercel, DNS routing, and external SaaS providers. |
| 9 | `ARCHITECTURE_LOW_LEVEL.md` | 4.3 KB / 100 L | Architecture | **Accurate** | Controller-Service-Repository pattern breakdown, Mongoose plugins, and socket room structures. |
| 10 | `ARCHITECTURE_SECURITY.md` | 4.2 KB / 73 L | Security | **Accurate** | JWT rotation, helmet headers, rate limiting (authLimiter, apiLimiter), CORS policies, and Mongo sanitize middleware. |
| 11 | `ARCHITECTURE_SEQUENCE_DIAGRAMS.md` | 4.0 KB / 114 L | UML / Sequence | **Accurate** | Mermaid sequence diagrams for OTP Login, Order Escrow, and Video Reel Transcoding. Accurately mirrors backend flow. |
| 12 | `AUTHENTICATION.md` | 3.6 KB / 67 L | Auth & Security | **Conflicting / Incomplete** | Sequence diagram for OTP is accurate, but references non-existent `/auth/google/session-exchange`. Omits mobile token exchange (`/auth/google/token`), app OAuth (`/auth/app/google`), and password reset flows. |
| 13 | `BRD.md` | 6.2 KB / 110 L | Business Requirements | **Accurate** | Business requirements document defining platform goals, user personas, revenue models, and success KPIs. |
| 14 | `BUSINESS_LOGIC.md` | 6.1 KB / 116 L | Business Logic | **Accurate** | Escrow rules, commission tier schedules, cancellation windows, review eligibility, and trust score formulas. |
| 15 | `CHANGELOG.md` | 8.1 KB / 82 L | Release History | **Accurate** | Comprehensive version history through v1.4.0 (Commission Engine, Cookie Banner, Contact Flow). |
| 16 | `CREATOR_REVENUE_ESCROW_ARCHITECTURE.md` | 9.1 KB / 181 L | Ledger & Escrow | **Accurate** | Deep architectural spec on dual-entry ledger, escrow holding locks, and Razorpay payout batching. |
| 17 | `database.md` | 1.5 KB / 47 L | Database Design | **Outdated / Incomplete** | Early database summary listing only 6 collections. Superseded by `DATABASE_SCHEMA.md`. |
| 18 | `DATABASE_INDEXING_QUERIES.md` | 4.4 KB / 134 L | DB Indexes | **Accurate** | 2dsphere geo-indexes, compound text indexes, TTL indexes for OTP/sessions, and aggregation pipeline optimization. |
| 19 | `DATABASE_SCHEMA.md` | 17.6 KB / 309 L | DB Schemas | **Partially Accurate** | Broad schema breakdown for 20+ core collections. Misses newly added Phase 4 and Admin sub-schemas (50 models total exist). |
| 20 | `DATABASE_SCHEMA_DESIGN.md` | 6.5 KB / 191 L | Schema Design | **Accurate** | Relational integrity rules, reference patterns, embedding vs referencing tradeoffs in MongoDB. |
| 21 | `DEPLOYMENT.md` | 2.9 KB / 105 L | DevOps / Deploy | **Accurate** | CI/CD pipelines, environment variables, Render web service build commands, Vercel frontend deployments. |
| 22 | `DESIGN_SYSTEM_GUIDELINES.md` | 5.6 KB / 148 L | Frontend Design | **Accurate** | Bento-Brutalism design system, color palette, typography tokens, Tailwind/Vanilla CSS rules. |
| 23 | `DEVELOPMENT_GUIDE.md` | 3.0 KB / 46 L | Developer Guide | **Accurate** | Local setup instructions (`npm run dev`), git branch conventions, commit message formatting. |
| 24 | `ENVIRONMENT_VARIABLES.md` | 3.9 KB / 50 L | Configuration | **Accurate** | Complete table of all backend and frontend environment variables with descriptions and defaults. |
| 25 | `FEATURES.md` | 7.6 KB / 83 L | Feature Catalog | **Accurate** | Catalog of all 12 platform feature pillars, updated with Recent Commission Engine additions. |
| 26 | `FOLDER_STRUCTURE.md` | 5.5 KB / 73 L | Project Structure | **Needs Minor Update** | Directory tree breakdown. Needs addition of newer subdirectories: `backend/src/services/admin/` and `backend/src/services/reel/`. |
| 27 | `ORDER_FLOW_ANDROID_DEVELOPER_GUIDE.md` | 31.0 KB / 776 L | Android Integration | **Highly Accurate** | Comprehensive 776-line specification of order creation, tracking, Shiprocket integration, and status webhooks. Exemplary model for other domain guides. |
| 28 | `PRD.md` | 6.4 KB / 108 L | Product Requirements | **Accurate** | Product requirements document outlining core customer, vendor, creator, and admin experiences. |
| 29 | `PROJECT_OVERVIEW.md` | 3.1 KB / 31 L | Project Summary | **Accurate** | High-level summary of BizReels platform vision, marketplace mechanics, and technology stack. |
| 30 | `REFER_AND_EARN_FLOW_REPORT.md` | 14.4 KB / 265 L | Referral System | **Accurate** | Complete analysis of the multi-tier referral system, wallet credits, fraud detection, and endpoints. |
| 31 | `REQUIREMENT_TRACEABILITY_MATRIX.md` | 3.9 KB / 30 L | RTM | **Accurate** | Traceability mapping business requirements to technical components and test cases. |
| 32 | `SEO_PERFORMANCE_OPTIMIZATION.md` | 6.3 KB / 99 L | SEO / CWV | **Accurate** | Dynamic OpenGraph metadata, XML sitemap generation, lazy loading, and Core Web Vitals targets. |
| 33 | `SRS.md` | 6.0 KB / 113 L | System Requirements | **Accurate** | Software Requirements Specification detailing functional and non-functional system constraints. |
| 34 | `STATE_MANAGEMENT.md` | 3.4 KB / 55 L | Frontend State | **Accurate** | Zustand stores and React Context breakdown (auth, cart, notification, theme stores). |
| 35 | `SWAGGER_DOCUMENTATION.md` | 8.8 KB / 189 L | OpenAPI Specs | **Partially Accurate** | Architecture breakdown of Swagger setup; documents the ~30 endpoints defined in `swagger.config.js`. |
| 36 | `THIRD_PARTY_SERVICES.md` | 4.0 KB / 74 L | Integrations | **Accurate** | MSG91 (SMS/OTP), Cloudinary (Video/Images), Razorpay (Payments/Payouts), Shiprocket (Logistics), Google Maps. |
| 37 | `UI_COMPONENTS.md` | 3.1 KB / 47 L | Frontend UI | **Accurate** | Component library inventory covering modals, forms, navigation bars, buttons, and toasts. |
| 38 | `USER_FLOW_JOURNEY.md` | 3.9 KB / 103 L | UX Journeys | **Accurate** | Step-by-step user journey maps for Customers, Vendors, and Content Creators. |
| 39 | `USER_STORIES.md` | 6.9 KB / 100 L | Agile Stories | **Accurate** | Agile user stories formatted as "As a [role], I want to [action] so that [benefit]". |
| 40 | `VENDOR_OFFERS_FLOW_REPORT.md` | 10.1 KB / 195 L | Vendor Offers | **Accurate** | Deep dive into vendor discount creation, validation, claim limits, and storefront display mechanics. |

---

## 3. Discrepancy Breakdown by Category

### 3.1 Documented Endpoints That Do NOT Exist in Backend Code

| Documented Endpoint | Document Found In | Actual Backend Status | Impact |
|---|---|---|---|
| `POST /api/v1/auth/google/session-exchange` | `docs/AUTHENTICATION.md`, `docs/API_REFERENCE.md`, `frontend/src/lib/api.js`, `swagger.config.js` | **MISSING from `authRoutes.js`**. Backend provides `POST /auth/google/token` and `POST /auth/google/mobile` instead. | **CRITICAL BUG RISK**: If frontend attempts to call `/auth/google/session-exchange`, it will receive `404 Not Found`. Android developers would fail integration immediately. |
| `POST /api/v1/listings/ai-copy` | `docs/API_ENDPOINT_LIST.md` | **Not in `listingRoutes.js`**. The AI copy generation route is implemented at `POST /api/v1/ai/generate-description` or `POST /api/v1/ai/listing-description`. | Medium. Developers looking under `/listings` will fail to find AI endpoints. |
| `POST /api/v1/wallet/subscribe` | `docs/API_ENDPOINT_LIST.md` | In code, subscription purchasing is at `POST /api/v1/subscription/change` or `POST /api/v1/subscription/purchase-razorpay` (mounted on root index router) and `POST /api/v1/subscriptions/purchase`. | Medium. Wallet subscription endpoint naming is fragmented. |

---

### 3.2 Primary vs Legacy Endpoint Discrepancies

| Functional Area | Primary Route in Backend Code | Legacy / Alias Route in Code | Mentioned in Existing Docs | Audit Recommendation |
|---|---|---|---|---|
| **OTP Request** | `POST /api/v1/auth/otp/send` (has full `authValidation.sendOtp` schema) | `POST /api/v1/auth/otp/request`<br>`POST /api/v1/auth/phone/send-otp`<br>`POST /api/v1/auth/send-otp` | Existing docs list `/auth/otp/request` or `/auth/otp/send` interchangeably without distinguishing primary vs alias. | Standardize documentation on `POST /api/v1/auth/otp/send`. Document legacy aliases in an aliases sub-table. |
| **OTP Verify** | `POST /api/v1/auth/otp/verify` (validated) | `POST /api/v1/auth/phone/verify-otp`<br>`POST /api/v1/auth/verify-otp` | Partially documented. | Standardize documentation on `POST /api/v1/auth/otp/verify`. |
| **Token Refresh** | `POST /api/v1/auth/refresh-token` | `POST /api/v1/auth/refresh` | `docs/AUTHENTICATION.md` documents `POST /auth/refresh`. Code accepts both. | Explicitly document both as valid, highlighting `/refresh-token` as canonical. |
| **Order Management** | `router.use('/orders', orderRoutes)` and `router.use('/vendor-orders', orderRoutes)` | Both routes point to the exact same controller. | `docs/API_ENDPOINT_LIST.md` lists only `/cart/checkout`. `ORDER_FLOW_ANDROID_DEVELOPER_GUIDE.md` references `/orders`. | Document both mount points clearly so mobile developers understand `/orders` and `/vendor-orders` are identical. |
| **Lead Inquiries** | `router.use('/inquiries', inquiryRoutes)` and `router.use('/leads', inquiryRoutes)` | Both routes point to the exact same controller. | Docs mention only `/leads`. | Document both mount points clearly. |

---

### 3.3 Undocumented API Domains (Massive Gap in Existing Docs)

The following entire functional domains exist in the backend codebase but have **zero documentation** in the existing API documentation files:

1. **Admin Management Suite (`backend/src/routes/admin.routes.js` — 127 endpoints):**
   - Admin user management, KYC approvals, vendor verification, reel moderation, listing approvals, commission rate management, transaction oversight, system logs, platform analytics, categories CRUD, banners CRUD, CMS page management, refund approvals, and payout batching.
2. **Phase 4 Modular Architecture (`backend/src/routes/phase4.routes.js` — 29 endpoints):**
   - Payment order creation, verification, webhook callbacks, KYC upload and status polling, reviews creation and moderation, trust score calculation, payout accounts, and withdrawal requests.
3. **Identity Verification Suite (`backend/src/routes/identity.routes.js` — 8 endpoints):**
   - Sandbox KYC integrations for PAN, Aadhaar OTP initiation, Aadhaar OTP verification, GSTIN verification, and Bank Account Penny Drop verification.
4. **AI Services Suite (`backend/src/routes/ai.routes.js` — 13 endpoints):**
   - Gemini AI integration for listing description generator, video caption synthesis, hashtag generation, moderation analysis, and translation.
5. **Creator Studio Suite (`backend/src/routes/creator.routes.js` — 21 endpoints):**
   - Creator onboarding, portfolio management, rate cards, collaboration requests, payout settings, and audience metrics.
6. **Live Streaming & WebRTC (`backend/src/routes/liveRoutes.js` — 7 endpoints):**
   - Live stream room creation, token generation, joining, ending, viewer tracking, and product pin during streams.
7. **Followers & Social Graph (`backend/src/routes/follow.routes.js` — 4 endpoints):**
   - Follow vendor/creator, unfollow, follower lists, following lists.
8. **Onboarding Wizards (`backend/src/routes/onboarding.routes.js` — 1 endpoint):**
   - Role-specific onboarding state retrieval and completion steps.
9. **Direct Contact & Newsletter (`backend/src/routes/index.js` — 3 endpoints):**
   - `POST /api/v1/contact`, `POST /api/v1/newsletter/subscribe`, `GET /api/v1/cms/:slug`.

---

## 4. Documentation Action Plan

To establish a single source of truth that allows any web, Android, or third-party developer to integrate with the backend without inspecting backend code, the following deliverables are structured:

1. **`docs/API_OVERVIEW.md`** [NEW]: Architectural foundations, base URLs, authentication headers, error envelopes, and conventions.
2. **`docs/AUTHENTICATION.md`** [UPDATE]: Full update removing phantom endpoints, detailing all mobile token exchanges, dev overrides, and role switching.
3. **`docs/ERROR_HANDLING.md`** [NEW]: Comprehensive guide to HTTP error codes, validation envelope formats, and common error messages.
4. **`docs/API_ENDPOINTS.md`** [NEW]: Comprehensive reference of all 517 endpoints categorized into logical domains with methods, auth, roles, headers, and parameters.
5. **`docs/PAYLOAD_CONTRACTS.md`** [NEW]: Exact request payloads with field types, required/optional tags, defaults, and validation rules.
6. **`docs/RESPONSE_CONTRACTS.md`** [NEW]: Complete JSON response schemas for success and failure envelopes across all major endpoints.
7. **`docs/ANDROID_API_GUIDE.md`** [NEW]: Client-focused guide for Android developers (Retrofit/Ktor models, OkHttp interceptors, Token lifecycle).
8. **`docs/API_INCONSISTENCIES.md`** [NEW]: Granular issue log detailing every code discrepancy, phantom route, and validation gap.
9. **`docs/API_CONTRACT_SUMMARY.md`** [NEW]: Compact master table mapping Method, Endpoint, Auth, Role, Request Body, Response, and Status.
10. **`docs/API_TESTING.md`** [NEW]: Practical cURL examples and Postman integration patterns for critical user journeys.
11. **`docs/CROSS_PLATFORM_API_RECOMMENDATIONS.md`** [NEW]: Prioritized recommendations (Critical, Recommended, Optional) for multi-client stability.
12. **`docs/RECOMMENDED_API_CHANGES.md`** [NEW]: Safe, isolated code improvement proposals (documented without modifying code).
13. **`docs/API_AUDIT_SUMMARY.md`** [NEW]: Final audit synthesis and platform readiness scorecard.
