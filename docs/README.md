# BizReels Platform Documentation Portal

Welcome to the official engineering and product documentation hub for the **BizReels Platform** (v1.4.0).  
This directory is structured into **10 modular domains** designed for software engineers, mobile developers, product managers, and infrastructure architects.

---

## Quick Navigation Directory

| Module | Scope / Description | Direct Links |
|---|---|---|
| 🌐 [**API Documentation**](./api/) | Complete REST & WebSocket API specification covering all 517 endpoints. | [Overview](./api/OVERVIEW.md) • [Endpoints](./api/ENDPOINTS.md) • [Auth](./api/AUTHENTICATION.md) • [Payloads](./api/PAYLOAD_CONTRACTS.md) • [Responses](./api/RESPONSE_CONTRACTS.md) • [Errors](./api/ERROR_HANDLING.md) • [Summary Table](./api/CONTRACT_SUMMARY.md) • [Testing](./api/TESTING.md) |
| 📱 [**Mobile Integration**](./mobile/) | Native Android (Kotlin) development guide, Retrofit models, token interceptors, and order flow. | [Android Guide](./mobile/ANDROID_GUIDE.md) • [Order Flow Guide](./mobile/ORDER_FLOW_GUIDE.md) |
| 🏗️ [**Architecture**](./architecture/) | System topology, low-level service design, security controls, sequence diagrams, and state management. | [System Arch](./architecture/SYSTEM_ARCHITECTURE.md) • [High-Level](./architecture/HIGH_LEVEL_SPEC.md) • [Low-Level](./architecture/LOW_LEVEL_SPEC.md) • [Security](./architecture/SECURITY_ARCHITECTURE.md) • [Sequence Diagrams](./architecture/SEQUENCE_DIAGRAMS.md) |
| 🗄️ [**Database & Schemas**](./database/) | MongoDB 50-model schema breakdown, relational design, 2dsphere geo-indexes, and search pipelines. | [Schema](./database/SCHEMA.md) • [Schema Design](./database/SCHEMA_DESIGN.md) • [Indexing & Queries](./database/INDEXING_QUERIES.md) |
| 📋 [**Product & Business**](./product/) | Product specifications, user stories, journey maps, feature catalogs, and financial business rules. | [PRD](./product/PRD.md) • [BRD](./product/BRD.md) • [SRS](./product/SRS.md) • [Features](./product/FEATURES.md) • [Business Logic](./product/BUSINESS_LOGIC.md) • [User Stories](./product/USER_STORIES.md) • [User Journey](./product/USER_FLOW_JOURNEY.md) • [RTM](./product/RTM.md) |
| 🎨 [**Frontend & UI/UX**](./frontend/) | Bento-Brutalism design system, component catalog, SEO metadata, and Core Web Vitals targets. | [Design System](./frontend/DESIGN_SYSTEM.md) • [UI Components](./frontend/UI_COMPONENTS.md) • [SEO & Performance](./frontend/SEO_PERFORMANCE.md) |
| 📊 [**Domain Flow Reports**](./domain-reports/) | Deep architectural reports on multi-tier systems: Creator Escrow, Refer & Earn, and Vendor Offers. | [Creator Escrow](./domain-reports/CREATOR_REVENUE_ESCROW.md) • [Refer & Earn](./domain-reports/REFER_AND_EARN.md) • [Vendor Offers](./domain-reports/VENDOR_OFFERS.md) |
| ⚙️ [**DevOps & Operations**](./devops/) | Local setup guide, deployment instructions, environment variables, changelog, and project overview. | [Dev Guide](./devops/DEVELOPMENT_GUIDE.md) • [Deployment](./devops/DEPLOYMENT.md) • [Env Vars](./devops/ENVIRONMENT_VARIABLES.md) • [Folder Structure](./devops/FOLDER_STRUCTURE.md) • [Changelog](./devops/CHANGELOG.md) • [Overview](./devops/PROJECT_OVERVIEW.md) • [AI Context](./devops/AI_CONTEXT.md) |
| 🔍 [**Audit & Recommendations**](./audit/) | Complete 517-endpoint audit scorecard, discrepancy catalog, and cross-platform mobile recommendations. | [Audit Summary](./audit/AUDIT_SUMMARY.md) • [Inventory](./audit/AUDIT_INVENTORY.md) • [Inconsistencies](./audit/INCONSISTENCIES.md) • [Cross-Platform](./audit/CROSS_PLATFORM_RECOMMENDATIONS.md) • [Recommended Changes](./audit/RECOMMENDED_CHANGES.md) |
| 📦 [**Legacy Archive**](./legacy/) | Safely archived superseded and early-stage documentation (preserved for historical reference). | [Legacy Index](./legacy/README.md) • [Old API](./legacy/api.md) • [Old DB](./legacy/database.md) |

---

## Role-Based Guide: Where Do I Start?

### 🤖 If You Are an Android / Mobile Developer:
1. Start with the [**Android Developer Guide**](./mobile/ANDROID_GUIDE.md) for Retrofit interfaces, token lifecycle, and Razorpay checkout.
2. Read [**Payload Contracts**](./api/PAYLOAD_CONTRACTS.md) and [**Response Contracts**](./api/RESPONSE_CONTRACTS.md) for exact JSON field types.
3. Review [**Error Handling**](./api/ERROR_HANDLING.md) for error envelopes and status codes.

### 💻 If You Are a Frontend (React) Developer:
1. Check [**Design System Guidelines**](./frontend/DESIGN_SYSTEM.md) for UI tokens and Bento-Brutalism themes.
2. Review [**Authentication & Session Management**](./api/AUTHENTICATION.md) for OTP and Google login.
3. Reference [**API Contract Summary**](./api/CONTRACT_SUMMARY.md) for endpoint paths and methods.

### 🛠️ If You Are a Backend Engineer / DevOps:
1. Review [**System Architecture**](./architecture/SYSTEM_ARCHITECTURE.md) and [**Database Schema**](./database/SCHEMA.md).
2. Configure your environment using [**Environment Variables**](./devops/ENVIRONMENT_VARIABLES.md) and [**Development Guide**](./devops/DEVELOPMENT_GUIDE.md).
3. Check [**Recommended Code Changes**](./audit/RECOMMENDED_CHANGES.md) before writing new endpoints.

### 👔 If You Are a Product Manager / QA Engineer:
1. Review [**Product Requirement Document (PRD)**](./product/PRD.md) and [**Business Logic & Rules**](./product/BUSINESS_LOGIC.md).
2. Test endpoints using the [**API Testing & cURL Guide**](./api/TESTING.md).
3. Verify feature coverage with the [**Requirement Traceability Matrix**](./product/RTM.md).
