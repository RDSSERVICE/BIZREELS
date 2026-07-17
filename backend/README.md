# BizReels Backend Service

## Purpose
This module handles all Core REST API requests, Socket.io connections, BullMQ background job processes, and Database pipelines for the BizReels marketplace.

## Structure & Main Files
*   `src/server.js` - Server bootstrap, database setup, and process error safety nets.
*   `src/app.js` - Express configuration with full security stacks (Helmet, CORS, Rate Limiters).
*   `src/config/index.js` - Structured environment configurations and variables validation checks.
*   `src/database/connection.js` - Mongoose connection pool adapters and event hooks.
*   `src/models/` - Schemas defining documents mapping rules (User, OTP, RefreshToken, AuditLog).
*   `src/repositories/` - Data access layer decoupling direct DB methods from business routes.
*   `src/services/` - Business logic computations and execution rules (OAuth, Token Rotation, OTP triggers).
*   `src/controllers/` - HTTP request parameters parsing layer and response triggers.
*   `src/routes/` - Express routing nodes and endpoints mapping.
*   `src/middleware/` - Authorization guards, validation checks, and centralized global error handler.

## Dependencies
*   `express` - REST Framework
*   `mongoose` - MongoDB Object Data Modeling
*   `passport` - Google OAuth authentication strategy
*   `jsonwebtoken` - JWT access session validation
*   `winston` - Production-grade logger system
*   `express-rate-limit` - Basic DDoS/Brute safety limiter
*   `helmet` & `cors` - Standard security headers

## Coding Conventions
1.  **Repository Pattern**: Do not call model methods directly from controllers or services. Always use repositories (`authRepository.js`) to decouple queries.
2.  **Async Wrapper**: Always wrap routing controllers inside `asyncHandler` to avoid manual try/catch blocks.
3.  **Winston Logs**: Log critical failures using `logger.error` and security logs using `logger.warn`.
4.  **Strict Validation**: Validate body fields using express-validator arrays before routes execution.

## How to Extend
To add a new module (e.g. Products catalog):
1.  Create `Product.js` inside `src/models/`.
2.  Create `productRepository.js` in `src/repositories/` containing database filters.
3.  Create `productService.js` in `src/services/` for logic computing.
4.  Create `productController.js` and `productRoutes.js` inside controllers/routes.
5.  Link new route namespace inside `src/routes/index.js`.
