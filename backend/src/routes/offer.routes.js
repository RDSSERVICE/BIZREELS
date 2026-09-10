const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const { adminOfferService, clientOfferService } = require('../services/offer');

const router = express.Router();

// Auto-invalidate active offers cache on admin mutations
router.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.path.includes('/admin')) {
    try {
      const cache = require('../utils/cache');
      await cache.incrCache('offers:version');
    } catch (err) {}
  }
  next();
});

// Middleware to verify Admin role
const requireAdmin = (req, res, next) => {
  const roles = req.user?.roles || [];
  if (!roles.includes('admin')) {
    return next(ApiError.forbidden('Admin authorization required.'));
  }
  next();
};

// ============================================================ CLIENT PORTAL ENDPOINTS

/**
 * GET /offers/active
 * Returns active offers applicable to logged-in user's roles.
 */
router.get(
  '/active',
  requireAuth,
  catchAsync(async (req, res) => {
    const userRoles = req.user.roles || [req.user.activeRole || 'customer'];
    const items = await clientOfferService.getActiveOffers(userRoles);
    res.json({ success: true, items });
  })
);

/**
 * POST /offers/:id/click
 * Registers a click on an offer card.
 */
router.post(
  '/:id/click',
  requireAuth,
  catchAsync(async (req, res) => {
    const result = await clientOfferService.recordClick(req.params.id);
    res.json(result);
  })
);

/**
 * POST /offers/validate-coupon
 * Validates a coupon code against active platform and vendor offers.
 */
router.post(
  '/validate-coupon',
  requireAuth,
  catchAsync(async (req, res) => {
    const { couponCode, orderAmount, vendorId, listingId } = req.body;
    const result = await clientOfferService.validateCoupon({
      couponCode,
      orderAmount,
      vendorId,
      listingId,
      user: req.user
    });
    res.json(result);
  })
);

/**
 * GET /offers/applicable
 * Retrieves list of available and active coupons for user selection.
 */
router.get(
  '/applicable',
  requireAuth,
  catchAsync(async (req, res) => {
    const { vendorId, orderAmount } = req.query;
    const data = await clientOfferService.getApplicableCoupons({ vendorId, orderAmount });
    res.json({ success: true, data });
  })
);

/**
 * POST /offers/calculate-shipping
 * Shipping rate calculation via Shiprocket.
 */
router.post(
  '/calculate-shipping',
  requireAuth,
  catchAsync(async (req, res) => {
    const data = await clientOfferService.calculateShipping(req.body);
    res.json({ success: true, data });
  })
);

// ============================================================ ADMIN OPERATION ENDPOINTS

/**
 * GET /offers/admin/stats
 * Aggregated KPI metrics for executive overview.
 */
router.get(
  '/admin/stats',
  requireAuth,
  requireAdmin,
  catchAsync(async (req, res) => {
    const stats = await adminOfferService.getAdminOfferStats();
    res.json({ success: true, stats });
  })
);

/**
 * GET /offers/admin
 * Paginated, filterable offer lists for admin view.
 */
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  catchAsync(async (req, res) => {
    const result = await adminOfferService.listAdminOffers(req.query);
    res.json({ success: true, ...result });
  })
);

/**
 * POST /offers/admin
 * Creates a new offer campaign.
 */
router.post(
  '/admin',
  requireAuth,
  requireAdmin,
  catchAsync(async (req, res) => {
    const offer = await adminOfferService.createOffer(req.body, req.user);
    res.status(201).json({ success: true, offer });
  })
);

/**
 * POST /offers/admin/bulk-status
 * Bulk status update (Active or Disabled).
 */
router.post(
  '/admin/bulk-status',
  requireAuth,
  requireAdmin,
  catchAsync(async (req, res) => {
    const { offerIds, status } = req.body;
    const result = await adminOfferService.bulkStatusOffers(offerIds, status, req.user);
    res.json(result);
  })
);

/**
 * POST /offers/admin/bulk-delete
 * Bulk soft delete offers.
 */
router.post(
  '/admin/bulk-delete',
  requireAuth,
  requireAdmin,
  catchAsync(async (req, res) => {
    const { offerIds } = req.body;
    const result = await adminOfferService.bulkDeleteOffers(offerIds, req.user);
    res.json(result);
  })
);

/**
 * PUT /offers/admin/:id
 * Updates an offer campaign.
 */
router.put(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  catchAsync(async (req, res) => {
    const offer = await adminOfferService.updateOffer(req.params.id, req.body, req.user);
    res.json({ success: true, offer });
  })
);

/**
 * DELETE /offers/admin/:id
 * Soft deletes an offer campaign.
 */
router.delete(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  catchAsync(async (req, res) => {
    const result = await adminOfferService.deleteOffer(req.params.id, req.user);
    res.json(result);
  })
);

/**
 * POST /offers/admin/:id/activate
 * Manually activates an offer.
 */
router.post(
  '/admin/:id/activate',
  requireAuth,
  requireAdmin,
  catchAsync(async (req, res) => {
    const offer = await adminOfferService.activateOffer(req.params.id);
    res.json({ success: true, offer });
  })
);

/**
 * POST /offers/admin/:id/deactivate
 * Manually deactivates an offer.
 */
router.post(
  '/admin/:id/deactivate',
  requireAuth,
  requireAdmin,
  catchAsync(async (req, res) => {
    const offer = await adminOfferService.deactivateOffer(req.params.id);
    res.json({ success: true, offer });
  })
);

/**
 * POST /offers/admin/:id/duplicate
 * Duplicates an offer campaign with fresh times.
 */
router.post(
  '/admin/:id/duplicate',
  requireAuth,
  requireAdmin,
  catchAsync(async (req, res) => {
    const offer = await adminOfferService.duplicateOffer(req.params.id, req.user);
    res.json({ success: true, offer });
  })
);

/**
 * GET /offers/admin/:id/analytics
 * Retrieves details on clicks, views, and redemption records.
 */
router.get(
  '/admin/:id/analytics',
  requireAuth,
  requireAdmin,
  catchAsync(async (req, res) => {
    const result = await adminOfferService.getOfferAnalytics(req.params.id);
    res.json(result);
  })
);

module.exports = router;
