const express = require('express');
const listingController = require('../controllers/listingController');
const listingValidation = require('../validations/listingValidation');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * Listings Routes — /api/v1/listings
 */

// ── Public Search & Details ──────────────────────────────
router.get('/', listingValidation.queryListings, validate, listingController.getListings);
router.get('/:id', listingValidation.idParam, validate, listingController.getListingDetails);

// ── Protected Vendor Operations ──────────────────────────
router.post(
  '/',
  authenticate,
  authorize('vendor', 'admin'),
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

router.delete(
  '/:id',
  authenticate,
  authorize('vendor', 'admin'),
  listingValidation.idParam,
  validate,
  listingController.delete
);

// ── AI Copy Generation ────────────────────────────────────
router.post(
  '/ai-copy',
  authenticate,
  authorize('vendor', 'creator', 'admin'),
  listingController.generateAICopy
);

module.exports = router;
