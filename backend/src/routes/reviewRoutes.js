const express = require('express');
const reviewController = require('../controllers/reviewController');
const reviewValidation = require('../validations/reviewValidation');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Review Routes — /api/v1/reviews
 */

// ── Public review inquiries ──────────────────────────────
router.get('/user/:userId', reviewValidation.queryReviews, validate, reviewController.getReviewsForUser);
router.get('/listing/:listingId', reviewValidation.queryReviews, validate, reviewController.getReviewsForListing);

// ── Protected review creation & deletion ────────────────
router.post('/', authenticate, reviewValidation.create, validate, reviewController.create);
router.delete('/:id', authenticate, reviewValidation.idParam, validate, reviewController.delete);

module.exports = router;
