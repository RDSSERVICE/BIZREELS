# System Architecture & Infrastructure Specification

This module documents the architectural design, component topology, security layers, and data flows of the BizReels platform.

---

## Documents Index

| Document | Scope |
|---|---|
| [**SYSTEM_ARCHITECTURE.md**](./SYSTEM_ARCHITECTURE.md) | System overview: client tier, Express API gateway, Mongoose persistence, Cloudinary CDN, and external services. |
| [**HIGH_LEVEL_SPEC.md**](./HIGH_LEVEL_SPEC.md) | Infrastructure deployment on Render and Vercel, DNS configuration, and SaaS boundaries. |
| [**LOW_LEVEL_SPEC.md**](./LOW_LEVEL_SPEC.md) | Code organization: Controller-Service-Repository pattern, Mongoose plugins, and Socket.IO rooms. |
| [**SECURITY_ARCHITECTURE.md**](./SECURITY_ARCHITECTURE.md) | JWT token rotation, Helmet HTTP headers, rate limiters (`authLimiter`, `apiLimiter`), and Mongo sanitize. |
| [**SEQUENCE_DIAGRAMS.md**](./SEQUENCE_DIAGRAMS.md) | Mermaid sequence diagrams for OTP Login, Order Escrow Holding, and Video Reel Transcoding. |
| [**STATE_MANAGEMENT.md**](./STATE_MANAGEMENT.md) | React frontend state: Zustand stores (auth, cart, notifications, theme) and Context providers. |
| [**THIRD_PARTY_SERVICES.md**](./THIRD_PARTY_SERVICES.md) | External integrations: MSG91 (SMS/OTP), Cloudinary (Video/Images), Razorpay (Payments/Payouts), Sandbox (KYC), Shiprocket. |
