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
    const userIdStr = userId.toString();

    const Analytics = require('../models/Analytics');
    const Inquiry = require('../models/Inquiry');
    const Interaction = require('../models/Interaction');
    let ChatThread = null;
    try {
      ChatThread = require('../models/Chat').ChatThread;
    } catch (_) {}
    let ListingEvent = null;
    try {
      ListingEvent = require('../models/Misc').ListingEvent;
    } catch (_) {}

    const targetUserMatch = { $in: [userIdStr, userId] };

    const [
      callInters,
      waInters,
      chatInters,
      inquiriesCount,
      chatThreadsCount,
      savedReelsCount,
      analyticsCalls,
      analyticsWa,
      listingEventsCall,
      listingEventsWa,
    ] = await Promise.all([
      Interaction.countDocuments({ target_user_id: targetUserMatch, type: 'click_to_call' }).catch(() => 0),
      Interaction.countDocuments({ target_user_id: targetUserMatch, type: 'whatsapp_contact' }).catch(() => 0),
      Interaction.countDocuments({ target_user_id: targetUserMatch, type: 'chat_inquiry' }).catch(() => 0),
      Inquiry.countDocuments({
        $or: [
          { vendor: userId },
          { vendor: userIdStr },
          { vendorId: userId },
          { vendor_id: userId },
          { vendorId: userIdStr },
        ],
        isDeleted: { $ne: true },
      }).catch(() => 0),
      ChatThread
        ? ChatThread.countDocuments({
            $or: [
              { participants: userIdStr },
              { participants: userId },
              { participantIds: userIdStr },
              { vendorId: userIdStr },
              { vendor: userId },
            ],
          }).catch(() => 0)
        : 0,
      Interaction.countDocuments({ target_user_id: targetUserMatch, type: 'save_reel' }).catch(() => 0),
      Analytics.countDocuments({ targetId: userId, type: { $in: ['call_vendor', 'click_to_call'] } }).catch(() => 0),
      Analytics.countDocuments({ targetId: userId, type: { $in: ['whatsapp_vendor', 'whatsapp_contact'] } }).catch(() => 0),
      ListingEvent ? ListingEvent.countDocuments({ vendor_id: targetUserMatch, event_type: { $in: ['call_click', 'contact_click'] } }).catch(() => 0) : 0,
      ListingEvent ? ListingEvent.countDocuments({ vendor_id: targetUserMatch, event_type: 'wa_click' }).catch(() => 0) : 0,
    ]);

    const callsCount = Math.max(callInters, analyticsCalls, listingEventsCall);
    const whatsappCount = Math.max(waInters, analyticsWa, listingEventsWa);
    const chatsCount = Math.max(chatThreadsCount, chatInters);
    const totalInquiries = Math.max(inquiriesCount, chatsCount);

    return ApiResponse.ok(res, 'Vendor analytics loaded.', {
      callsCount,
      whatsappCount,
      chatsCount,
      inquiriesCount: totalInquiries,
      savedReelsCount,
    });
  });

  // ── Get Vendor Lead & Contact Summary (Separate Dedicated API) ─────────────
  getVendorLeadSummary = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userIdStr = userId.toString();

    const Analytics = require('../models/Analytics');
    const Inquiry = require('../models/Inquiry');
    const Interaction = require('../models/Interaction');
    let ChatThread = null;
    try {
      ChatThread = require('../models/Chat').ChatThread;
    } catch (_) {}
    let ListingEvent = null;
    try {
      ListingEvent = require('../models/Misc').ListingEvent;
    } catch (_) {}

    const targetUserMatch = { $in: [userIdStr, userId] };

    // 1. Query Chat Threads for Vendor Inbox
    const chatThreads = ChatThread
      ? await ChatThread.find({
          $or: [
            { participants: userIdStr },
            { participants: userId },
            { participantIds: userIdStr },
            { vendorId: userIdStr },
            { vendor: userId },
          ],
        }).lean().catch(() => [])
      : [];

    let unreadChatsCount = 0;
    for (const thread of chatThreads) {
      if (thread.unread_count && typeof thread.unread_count === 'object') {
        unreadChatsCount += Number(thread.unread_count[userIdStr] || thread.unread_count[userId] || 0);
      }
    }

    // 2. Query Direct Inquiries for Vendor Inbox
    const inquiries = await Inquiry.find({
      $or: [
        { vendor: userId },
        { vendor: userIdStr },
        { vendorId: userId },
        { vendor_id: userId },
        { vendorId: userIdStr },
      ],
      isDeleted: { $ne: true },
    }).lean().catch(() => []);

    // 3. Query Interaction & Listing Event Counts
    const [callInters, waInters, chatInters, listingEventsCall, listingEventsWa, analyticsCalls, analyticsWa] = await Promise.all([
      Interaction.countDocuments({ target_user_id: targetUserMatch, type: 'click_to_call' }).catch(() => 0),
      Interaction.countDocuments({ target_user_id: targetUserMatch, type: 'whatsapp_contact' }).catch(() => 0),
      Interaction.countDocuments({ target_user_id: targetUserMatch, type: 'chat_inquiry' }).catch(() => 0),
      ListingEvent ? ListingEvent.countDocuments({ vendor_id: targetUserMatch, event_type: { $in: ['call_click', 'contact_click'] } }).catch(() => 0) : 0,
      ListingEvent ? ListingEvent.countDocuments({ vendor_id: targetUserMatch, event_type: 'wa_click' }).catch(() => 0) : 0,
      Analytics.countDocuments({ targetId: userId, type: { $in: ['call_vendor', 'click_to_call'] } }).catch(() => 0),
      Analytics.countDocuments({ targetId: userId, type: { $in: ['whatsapp_vendor', 'whatsapp_contact'] } }).catch(() => 0),
    ]);

    const callsCount = Math.max(callInters, analyticsCalls, listingEventsCall);
    const whatsappCount = Math.max(waInters, analyticsWa, listingEventsWa);
    const chatsCount = Math.max(chatThreads.length, chatInters);
    const inquiriesCount = Math.max(inquiries.length, chatsCount);

    return ApiResponse.ok(res, 'Vendor database lead & contact summary loaded.', {
      callsCount,
      whatsappCount,
      chatsCount,
      inquiriesCount,
      unreadChatsCount,
      chatThreadsCount: chatThreads.length,
      directInquiriesCount: inquiries.length,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Get Creator Dashboard Analytics ───────────────────────
  getCreatorAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const Analytics = require('../models/Analytics');
    const Order = require('../models/Order');

    const IsolatedWallet = require('../models/IsolatedWallet.model');
    const Campaign = require('../models/Campaign');
    const [
      profileViews,
      hireRequestsCount,
      completedCampaignsCount,
      creatorWallet,
      activeCampaigns,
    ] = await Promise.all([
      Analytics.countDocuments({ targetId: userId, type: 'view_creator_profile' }).catch(() => 0),
      Order.countDocuments({ creator: userId, status: 'pending' }).catch(() => 0),
      Order.countDocuments({ creator: userId, status: 'completed' }).catch(() => 0),
      IsolatedWallet.findOne({ userId: userId.toString(), role: 'creator' }).lean().catch(() => null),
      Campaign.find({ creator: userId, status: 'accepted' }).select('budget netCreatorAmount').lean().catch(() => []),
    ]);

    const totalEarnings = creatorWallet?.lifetime_earned || creatorWallet?.balance || 0;
    const escrowInReview = (activeCampaigns || []).reduce((acc, c) => acc + (c.netCreatorAmount || c.budget || 0), 0);

    return ApiResponse.ok(res, 'Creator analytics loaded.', {
      profileViews,
      hireRequestsCount,
      completedCampaignsCount,
      totalEarnings,
      escrowInReview,
      rating: req.user.rating_avg || 5.0,
      reviewCount: req.user.rating_count || 0,
    });
  });
}

module.exports = new AnalyticsController();
