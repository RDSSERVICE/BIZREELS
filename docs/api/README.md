# BizReels API Documentation Module

This module contains the definitive, production-verified API specification for the BizReels platform (v1.4.0), covering all **517 endpoints** across 24 functional domains.

---

## Documents Index

| Document | Purpose |
|---|---|
| [**OVERVIEW.md**](./OVERVIEW.md) | High-level API architecture, canonical base URLs (`https://bizreels.in/api/v1`), common headers, response format, and role model. |
| [**ENDPOINTS.md**](./ENDPOINTS.md) | **13,760-line master endpoint reference** covering every single endpoint with source code links, headers, bodies, responses, and notes. |
| [**AUTHENTICATION.md**](./AUTHENTICATION.md) | Dual-channel OTP (SMS + WhatsApp), Google native mobile token exchange, JWT lifecycle, role switching, and dev bypass logins. |
| [**PAYLOAD_CONTRACTS.md**](./PAYLOAD_CONTRACTS.md) | Exact request payload schemas, field types, required/optional status, constraints, and sample JSON. |
| [**RESPONSE_CONTRACTS.md**](./RESPONSE_CONTRACTS.md) | Standard JSON response schemas for success envelopes, pagination, user models, reels, cart, and orders. |
| [**ERROR_HANDLING.md**](./ERROR_HANDLING.md) | Standard error JSON schema, HTTP status code taxonomy, and Kotlin/Axios client parsers. |
| [**CONTRACT_SUMMARY.md**](./CONTRACT_SUMMARY.md) | Master quick-lookup table: `Method | Endpoint | Auth | Role | Request Body | Response | Status`. |
| [**TESTING.md**](./TESTING.md) | Ready-to-use cURL commands and Postman integration guide for all core user journeys. |
| [**SWAGGER_DOCUMENTATION.md**](./SWAGGER_DOCUMENTATION.md) | Interactive Swagger UI (`/api-docs`) and OpenAPI 3.0 specification integration guide. |

---

## Core Invariants for API Consumers
1. **Canonical Base URL:** `https://bizreels.in/api/v1`
2. **Standard Auth Header:** `Authorization: Bearer <access_token>`
3. **Response Envelopes:** All responses return `"success": true` or `"success": false`.
