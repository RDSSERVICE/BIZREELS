# Backend Database Models Layer

## Purpose
This folder encapsulates the data storage definitions, constraints, schemas, indexes, and instance hooks using Mongoose ODM.

## Files
- `User.js` - Stores identity profiles (customer, vendor, creator details), followers/following social counts, active role state, and wallet balance ledger.
- `OTP.js` - Manages transient authentication verification codes.
- `RefreshToken.js` - Supports secure session rotation.
- `Reel.js` - Stores video references, caption tags, counter tallies, and geo-indexes.
- `Comment.js` & `ReelLike.js` - Social interaction lists for Reels.
- `Listing.js` - Unified schema representing products and services with custom variants, slot availability configurations, and a 2dsphere location index.
- `Requirement.js` & `Quote.js` - Custom client requirement briefs and vendor bids with composite uniqueness index overlays.
- `Conversation.js` & `Message.js` - Direct messages mapping.
- `WalletTransaction.js` & `Notification.js` - Double-entry financial audit logs and push alerts.
- `AuditLog.js` - General audit log.

## Dependencies
- `mongoose` - Schema definitions and geo-queries
- `bcryptjs` - Password hashing instance hooks

## Coding Conventions
1. Always implement **Soft Delete** logic via an `isDeleted` flag and pre-find mongoose middleware to filter active states by default.
2. Use **Sub-schemas** (e.g. `customerProfileSchema`, `vendorProfileSchema`) inside user documents to prevent collections duplication.
3. Apply compound indexes for complex lookup sorting.

## How to Extend
To define a new database model:
1. Create a `<ModelName>.js` file defining the schema object.
2. Define soft delete filter hooks.
3. Export using `mongoose.model('<ModelName>', schema)`.
