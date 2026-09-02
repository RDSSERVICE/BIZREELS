const express = require('express');
const listingController = require('../controllers/listingController');
const listingValidation = require('../validations/listingValidation');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth.middleware');
const { requireSubscriptionFeature, checkSubscriptionLimit } = require('../middleware/subscription');

const router = express.Router();

/**
 * Listings Routes — /api/v1/listings
 */

// ── Public Search & Details ──────────────────────────────
router.get('/', optionalAuth, listingValidation.queryListings, validate, listingController.getListings);

// ── Dynamic Limits ────────────────────────────────────────
router.get('/limits/media', async (req, res, next) => {
  try {
    const { AppSettings } = require('../models/Admin');
    const maxImagesSetting = await AppSettings.findOne({ key: 'max_listing_images' });
    const maxVideosSetting = await AppSettings.findOne({ key: 'max_listing_videos' });
    res.json({
      success: true,
      maxImages: maxImagesSetting ? Number(maxImagesSetting.value) : 5,
      maxVideos: maxVideosSetting ? Number(maxVideosSetting.value) : 1
    });
  } catch (err) {
    next(err);
  }
});

// ── AI Copy Generation ────────────────────────────────────
router.post(
  '/ai-copy',
  authenticate,
  authorize('vendor', 'creator', 'admin'),
  requireSubscriptionFeature('ai_credits'),
  listingController.generateAICopy
);

// ── Bulk Operations (must be before /:id) ─────────────────
router.post(
  '/bulk',
  authenticate,
  authorize('vendor', 'admin'),
  listingValidation.bulkUpdate,
  validate,
  listingController.bulkUpdate
);

// ── Parameterized routes ──────────────────────────────────
router.get('/:id', listingValidation.idParam, validate, listingController.getListingDetails);
router.post('/:id/like', authenticate, listingValidation.idParam, validate, listingController.toggleLike);
router.post('/:id/save', authenticate, listingController.save);
router.post('/:id/unsave', authenticate, listingController.unsave);
router.post('/:id/save-image', authenticate, listingController.saveImage);
router.post('/:id/unsave-image', authenticate, listingController.unsaveImage);

// ── Duplicate Listing ─────────────────────────────────────
router.post(
  '/:id/duplicate',
  authenticate,
  authorize('vendor', 'admin'),
  listingValidation.idParam,
  validate,
  listingController.duplicate
);

// ── Analytics ─────────────────────────────────────────────
router.get(
  '/:id/analytics',
  authenticate,
  authorize('vendor', 'admin'),
  requireSubscriptionFeature('analytics_access'),
  listingValidation.idParam,
  validate,
  listingController.getAnalytics
);

// ── Stock Update ──────────────────────────────────────────
router.patch(
  '/:id/stock',
  authenticate,
  authorize('vendor', 'admin'),
  listingValidation.updateStock,
  validate,
  listingController.updateStock
);

// ── Protected Vendor Operations ──────────────────────────
router.post(
  '/',
  authenticate,
  authorize('vendor', 'admin'),
  checkSubscriptionLimit('listings'),
  listingValidation.create,
  validate,
  listingController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('vendor', 'admin'),
  listingValidation.update,
  validate,
  listingController.update
);

router.patch(
  '/:id',
  authenticate,
  authorize('vendor', 'admin'),
  listingValidation.update,
  validate,
  listingController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('vendor', 'admin'),
  listingValidation.idParam,
  validate,
  listingController.delete
);

module.exports = router;
