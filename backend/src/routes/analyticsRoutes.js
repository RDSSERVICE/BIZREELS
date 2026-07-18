const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const analyticsValidation = require('../validations/analyticsValidation');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * Analytics Routes — /api/v1/analytics
 */

// ── Log client event (Optional Auth check) ────────────────
router.post(
  '/',
  (req, res, next) => {
    // If request has authorization header, authenticate first, otherwise pass through
    if (req.headers.authorization) {
      return authenticate(req, res, next);
    }
    next();
  },
  analyticsValidation.track,
  validate,
  analyticsController.track
);

// ── Retrieve aggregated summaries (Admin restricted) ──────
router.get(
  '/summary',
  authenticate,
  authorize('admin'),
  analyticsValidation.querySummary,
  validate,
  analyticsController.getSummary
);

module.exports = router;
