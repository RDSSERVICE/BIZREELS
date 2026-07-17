# Backend Routes Layer

## Purpose
Exposes and mounts the REST API endpoints hierarchy (`/api/v1/...`). Integrates authorization check middleware guards, parameter body validations, and file upload parameters.

## Files
- `index.js` - Registry containing versioning prefix and health endpoints.
- `authRoutes.js` - Sign-up, login, password resets, and session refreshes.
- `reelRoutes.js` - Reels upload multipart routes and comments list queries.
- `listingRoutes.js` - Discover catalog queries, vendor updates, and AI copy hooks.
- `requirementRoutes.js` - Buyer custom posts, bids quotes submissions, and bid acceptance.
- `chatRoutes.js` - Conversations inbox lists and messages history queries.
- `walletRoutes.js` - Balance recharges, plans subscriptions, and audits.

## Dependencies
- `express.Router` - REST router
- `authenticate` & `authorize` - Auth guards
- `validate` - Input validator helper

## Coding Conventions
1. Keep path definitions clean. Always mount validations array before controller call.
2. Guard writing operations (POST, PUT, DELETE) using `authenticate` and `authorize(<roles>)`.

## How to Extend
1. Create a `<name>Routes.js` file mapping router methods.
2. Bind validation arrays, middleware guards, and controllers actions.
3. Import and mount the router within `index.js`.
