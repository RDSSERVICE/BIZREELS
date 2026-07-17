# Backend Controllers Layer

## Purpose
Parses HTTP request bodies, route parameters, and query parameters. Validates client requests, passes payload parameters to services, and returns wrapped API responses.

## Files
- `authController.js` - JWT login endpoints, OTP verifications, and role switching requests.
- `reelController.js` - Reels feed, views count, comment/like toggles.
- `listingController.js` - Discover, details, catalog, and AI generation hooks.
- `requirementController.js` - Posted briefs, bids quotes, and quote status settlements.
- `chatController.js` - Conversational channels and messages retrieval endpoints.
- `walletController.js` - Deposits balance recharges, transaction logs, and subscriptions.

## Dependencies
- `asyncHandler` - Express wrapper to capture unhandled promise rejections
- `ApiResponse` & `ApiError` - Centralized JSON response wrapping structures

## Coding Conventions
1. Always wrap controller functions inside the `asyncHandler` decorator.
2. Return unified responses via `ApiResponse.ok`, `ApiResponse.created`, or `ApiResponse.paginated`.
3. Do not place core validation, database commands, or socket triggers directly in controllers (delegate to services).

## How to Extend
1. Add an action function to the `<Name>Controller.js` class.
2. Extract required variables from `req.body`, `req.params`, `req.query`, or `req.user`.
3. Call the matching service function and wrap the output in `ApiResponse`.
