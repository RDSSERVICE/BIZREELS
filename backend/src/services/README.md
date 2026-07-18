# Backend Services Layer

## Purpose
Acts as the core orchestration and business rules validation layer. Intercepts incoming inputs from controllers, performs checks, updates repositories, and triggers real-time socket updates.

## Files
- `authService.js` - Password comparisons, OTP creations, JWT generation, and token rotation.
- `reelService.js` - Cloudinary media streaming uploads and counter updates.
- `listingService.js` - Products/Services management and mock AI content generator helpers.
- `requirementService.js` - Leads logic, quotations bids, and escrow wallet settlements.
- `chatService.js` - Chat message routing and seen updates broadcasts.
- `walletService.js` - Deposits balance audits and plan subscriptions cost checks.

## Dependencies
- `cloudinary` - Reels uploads stream
- `jsonwebtoken` - Token signings

## Coding Conventions
1. Keep code highly clean and modular.
2. Throw custom `ApiError` instances for validation/security failures (handled by global error middleware).
3. Coordinate multiple repositories if a business action impacts different entities.

## How to Extend
1. Add a service function inside the matching `<Name>Service.js` class.
2. Write rules, check permissions, query repositories, and return clean result objects.
