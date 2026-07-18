# Backend Repositories Layer

## Purpose
Decouples schema queries and database manipulations from business logic. Contains heavy MongoDB aggregation pipelines, geospatial calculations, and transaction session safety.

## Files
- `authRepository.js` - CRUD operations for users, OAuth updates, and credentials checks.
- `reelRepository.js` - Paginated feed retrieval overlaying like indicators.
- `listingRepository.js` - Location matching catalog queries.
- `requirementRepository.js` - Proximity lead discover checks and bidding quote logs.
- `chatRepository.js` - Conversation channels setup and unread message updates.
- `walletRepository.js` - Safe double-entry ledger audits and plans buyouts.

## Dependencies
- `mongoose` - Database schema aggregates

## Coding Conventions
1. Keep the controller and service layer clean of raw Mongoose operators.
2. Group related database calls into class functions (e.g. `queryListings`, `updateWalletBalance`).
3. Leverage transaction sessions (`session.withTransaction`) for multi-document operations to prevent inconsistencies.

## How to Extend
1. Define a class function in the corresponding `<Name>Repository.js` file.
2. Access model documents directly and construct pipelines/queries.
3. Export an instance of the repository class.
