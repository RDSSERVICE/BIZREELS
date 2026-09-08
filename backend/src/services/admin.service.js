/**
 * Admin Service Facade
 * 
 * Modularized subservices reside in ./admin/:
 * - admin.user.service.js (Core user actions, roles, auth, wallet freeze/unfreeze)
 * - admin.customer.service.js (Customer query, dossiers, telemetry, stats)
 * - admin.vendor.service.js (Vendor query, store dossiers, compliance, stats)
 * - admin.creator.service.js (Creator query, media portfolio dossiers, stats)
 * - admin.listing.service.js (Listing moderation, test data purge)
 * - admin.analytics.service.js (Platform overview, caching, real-time counters)
 * - admin.common.js (Shared transaction, rating recalculation, cleanup helpers)
 */

module.exports = require('./admin');
