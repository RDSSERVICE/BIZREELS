const analyticsService = require('../services/analytics.service');
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

  // ── Get Vendor Dashboard Analytics ───────────────────────
  getVendorAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const Analytics = require('../models/Analytics');
    const Inquiry = require('../models/Inquiry');
    const Interaction = require('../models/Interaction');

    const [
      callsCount,
      whatsappCount,
      chatsCount,
      inquiriesCount,
      savedReelsCount,
    ] = await Promise.all([
      Analytics.countDocuments({ targetId: userId, type: 'call_vendor' }),
      Analytics.countDocuments({ targetId: userId, type: 'whatsapp_vendor' }),
      Analytics.countDocuments({ targetId: userId, type: 'chat_vendor' }),
      Inquiry.countDocuments({ vendorId: userId }),
      Interaction.countDocuments({ type: 'save_reel' }),
    ]);

    return ApiResponse.ok(res, 'Vendor analytics loaded.', {
      callsCount,
      whatsappCount,
      chatsCount,
      inquiriesCount,
      savedReelsCount,
    });
  });

  // ── Get Creator Dashboard Analytics ───────────────────────
  getCreatorAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const Analytics = require('../models/Analytics');
    const Order = require('../models/Order');

    const [
      profileViews,
      hireRequestsCount,
      completedCampaignsCount,
    ] = await Promise.all([
      Analytics.countDocuments({ targetId: userId, type: 'view_creator_profile' }).catch(() => 0),
      Order.countDocuments({ creator: userId, status: 'pending' }).catch(() => 0),
      Order.countDocuments({ creator: userId, status: 'completed' }).catch(() => 0),
    ]);

    return ApiResponse.ok(res, 'Creator analytics loaded.', {
      profileViews,
      hireRequestsCount,
      completedCampaignsCount,
      totalEarnings: req.user.walletBalance || 0,
      rating: req.user.rating_avg || 5.0,
      reviewCount: req.user.rating_count || 0,
    });
  });
}

module.exports = new AnalyticsController();
