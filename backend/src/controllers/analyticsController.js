const analyticsService = require('../services/analyticsService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * AnalyticsController
 * Serves routes for metrics collection.
 */
class AnalyticsController {
  // ── Track Event ─────────────────────────────────────────
  track = asyncHandler(async (req, res) => {
    const { type, targetId, queryText, metadata } = req.body;
    const userId = req.user ? req.user._id : undefined;

    const event = await analyticsService.trackEvent({
      type,
      userId,
      targetId,
      queryText,
      metadata: {
        ...metadata,
        ipAddress: req.ip,
        device: req.headers['user-agent'],
      },
    });

    return ApiResponse.created(res, 'Event logged.', { event });
  });

  // ── Get Summary (Admin or Owner restricted) ──────────────
  getSummary = asyncHandler(async (req, res) => {
    const { type, targetId, startDate, endDate } = req.query;
    
    const summary = await analyticsService.getMetricsSummary({
      type,
      targetId,
      startDate,
      endDate,
    });

    return ApiResponse.ok(res, 'Analytics metrics loaded.', { summary });
  });
}

module.exports = new AnalyticsController();
