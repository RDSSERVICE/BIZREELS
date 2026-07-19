const express = require('express');
const requirementController = require('../controllers/requirementController');
const requirementValidation = require('../validations/requirementValidation');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * Requirements & Bidding Routes — /api/v1/requirements
 */

// ── Lead Query & Details ──────────────────────────────────
router.get(
  '/',
  authenticate,
  requirementValidation.queryRequirements,
  validate,
  requirementController.getRequirements
);

router.get(
  '/:id',
  authenticate,
  requirementValidation.idParam,
  validate,
  requirementController.getRequirementDetails
);

// ── Buyer Custom Posts ────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('customer', 'admin'),
  requirementValidation.create,
  validate,
  requirementController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('customer', 'admin'),
  requirementValidation.update,
  validate,
  requirementController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('customer', 'admin'),
  requirementValidation.idParam,
  validate,
  requirementController.delete
);

// ── Bids / Quotations ─────────────────────────────────────
router.post(
  '/quotes',
  authenticate,
  authorize('vendor', 'admin'),
  requirementValidation.createQuote,
  validate,
  requirementController.createQuote
);

router.get(
  '/quotes',
  authenticate,
  asyncHandler(async (req, res) => {
    const Quote = require('../models/Quote');
    const quotes = await Quote.find({ vendor: req.user._id }).sort({ createdAt: -1 }).lean();
    return ApiResponse.ok(res, 'Quotations retrieved successfully.', { quotes: quotes.map(q => ({ id: q._id.toString(), requirement_id: q.requirement, price: q.price, status: q.status, notes: q.notes, created_at: q.createdAt })) });
  })
);

router.get(
  '/:id/quotes',
  authenticate,
  requirementValidation.idParam,
  validate,
  requirementController.getQuotes
);

router.patch(
  '/quotes/:quoteId',
  authenticate,
  authorize('customer', 'admin'),
  requirementValidation.quoteStatus,
  validate,
  requirementController.updateQuoteStatus
);

module.exports = router;
