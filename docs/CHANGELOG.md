# Changelog

All notable changes to the BizReels local social commerce platform will be documented in this file.

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
