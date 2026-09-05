const Listing = require('../models/Listing');
const Reel = require('../models/Reel');
const Order = require('../models/Order');
const Inquiry = require('../models/Inquiry');
const Deal = require('../models/Deal');
const User = require('../models/User');
const Interaction = require('../models/Interaction');
const Follow = require('../models/Follow');
const Quote = require('../models/Quote');
const { Review } = require('../models/Phase4');
const { ListingEvent } = require('../models/Misc');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, all: null };

const getRangeCutoffDate = (rangeKey) => {
  const days = RANGE_DAYS[rangeKey];
  if (!days) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

/**
 * Overview Analytics strictly scoped to the requesting Vendor.
 */
const overview = async (vendorId, rangeKey = '30d') => {
  const cutoffDate = getRangeCutoffDate(rangeKey);
  const vendorIdStr = vendorId.toString();
  const vendorObjId = new mongoose.Types.ObjectId(vendorId);

  // Strictly target only this vendor
  const vendorMatch = { $in: [vendorObjId, vendorIdStr] };

  const evQ = { vendor_id: { $in: [vendorIdStr, vendorObjId] } };
  const interactionQ = { target_user_id: { $in: [vendorIdStr, vendorObjId] } };
  const dateFilter = {};

  if (cutoffDate) {
    evQ.created_at = { $gte: cutoffDate };
    interactionQ.created_at = { $gte: cutoffDate };
    dateFilter.createdAt = { $gte: cutoffDate };
  }

  const [
    eventAgg,
    uniqueChatters,
    interactionsAgg,
    watchersAgg,
    dealsAgg,
    revAgg,
    userDoc,
    totalListings,
    activeListings,
    productsCount,
    servicesCount,
    reelsCount,
    inquiriesCount,
    ordersCount,
    completedOrdersCount,
    orderRevenueAgg,
    dealRevenueAgg,
    orderCustomers,
    inquiryCustomers,
    dealCustomers,
    quotesCount,
    followersCount,
    listingStatsAgg,
    reelsStatsAgg
  ] = await Promise.all([
    // 1. Listing Events strictly for this vendor
    ListingEvent.aggregate([
      { $match: evQ },
      { $group: { _id: '$event_type', n: { $sum: 1 } } },
    ]).catch(() => []),

    // 2. Unique users who initiated chat with this vendor
    ListingEvent.distinct('user_id', { ...evQ, event_type: 'chat_start', user_id: { $ne: null } }).catch(() => []),

    // 3. User interactions (WhatsApp clicks, phone calls) strictly for this vendor
    Interaction.aggregate([
      { $match: interactionQ },
      { $group: { _id: '$type', n: { $sum: 1 } } },
    ]).catch(() => []),

    // 4. Watchers count on this vendor's listings only
    Listing.aggregate([
      { $match: { vendor: vendorMatch, isDeleted: { $ne: true } } },
      { $project: { watchers_count: { $size: { $ifNull: ['$watchers', []] } } } },
      { $group: { _id: null, total: { $sum: '$watchers_count' } } },
    ]).catch(() => []),

    // 5. Deals strictly for this vendor
    Deal.aggregate([
      { $match: { seller_id: { $in: [vendorIdStr, vendorObjId] }, ...(cutoffDate ? { created_at: { $gte: cutoffDate } } : {}) } },
      { $group: { _id: '$status', n: { $sum: 1 } } },
    ]).catch(() => []),

    // 6. Reviews strictly for this vendor
    Review.aggregate([
      { $match: { target_type: 'vendor', target_id: { $in: [vendorIdStr, vendorObjId] }, is_deleted: { $ne: true } } },
      { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
    ]).catch(() => []),

    // 7. Vendor User rating profile
    User.findById(vendorObjId).select('rating_avg rating_count followersCount followers vendorProfile').lean().catch(() => null),

    // 8. Total listings by this vendor
    Listing.countDocuments({
      vendor: vendorMatch,
      isDeleted: { $ne: true },
    }).catch(() => 0),

    // 9. Active listings by this vendor
    Listing.countDocuments({
      vendor: vendorMatch,
      isDeleted: { $ne: true },
      status: { $in: ['active', 'published'] },
    }).catch(() => 0),

    // 10. Products count
    Listing.countDocuments({
      vendor: vendorMatch,
      type: 'product',
      isDeleted: { $ne: true },
    }).catch(() => 0),

    // 11. Services count
    Listing.countDocuments({
      vendor: vendorMatch,
      type: 'service',
      isDeleted: { $ne: true },
    }).catch(() => 0),

    // 12. Reels count
    Reel.countDocuments({
      creator: vendorMatch,
      isDeleted: { $ne: true },
    }).catch(() => 0),

    // 13. Direct customer inquiries to this vendor
    Inquiry.countDocuments({
      vendor: vendorMatch,
      isDeleted: { $ne: true },
      ...dateFilter,
    }).catch(() => 0),

    // 14. Orders placed with this vendor
    Order.countDocuments({
      vendor: vendorMatch,
      ...dateFilter,
    }).catch(() => 0),

    // 15. Completed orders for this vendor
    Order.countDocuments({
      vendor: vendorMatch,
      status: { $in: ['delivered', 'completed', 'paid', 'accepted', 'processing', 'shipped', 'out_for_delivery'] },
      ...dateFilter,
    }).catch(() => 0),

    // 16. Revenue from Orders
    Order.aggregate([
      {
        $match: {
          vendor: vendorMatch,
          $or: [
            { paymentStatus: 'paid' },
            { status: { $in: ['accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'completed'] } }
          ],
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$itemTotal', { $multiply: ['$price', '$quantity'] }] } }
        }
      }
    ]).catch(() => []),

    // 17. Revenue from Deals
    Deal.aggregate([
      {
        $match: {
          seller_id: { $in: [vendorIdStr, vendorObjId] },
          status: 'completed',
          ...(cutoffDate ? { created_at: { $gte: cutoffDate } } : {})
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$final_amount', '$current_offer', '$amount_paise'] } }
        }
      }
    ]).catch(() => []),

    // 18. Distinct customers from Orders
    Order.distinct('customer', { vendor: vendorMatch }).catch(() => []),

    // 19. Distinct customers from Inquiries
    Inquiry.distinct('customer', { vendor: vendorMatch }).catch(() => []),

    // 20. Distinct customers from Deals
    Deal.distinct('buyer_id', { seller_id: { $in: [vendorIdStr, vendorObjId] } }).catch(() => []),

    // 21. Quotes count
    Quote.countDocuments({ vendor: vendorMatch }).catch(() => 0),

    // 22. Followers count
    Follow.countDocuments({ following_id: { $in: [vendorIdStr, vendorObjId] } }).catch(() => 0),

    // 23. Baseline cumulative stats on this vendor's listings
    Listing.aggregate([
      { $match: { vendor: vendorMatch, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          views: { $sum: '$views' },
          likes: { $sum: '$likes' },
          saves: { $sum: '$saves_count' },
          shares: { $sum: '$shares' },
          orders: { $sum: '$orders_count' },
        }
      }
    ]).catch(() => []),

    // 24. Baseline cumulative stats on this vendor's reels
    Reel.aggregate([
      { $match: { creator: vendorMatch, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          views: { $sum: '$views' },
          likes: { $sum: '$likesCount' },
        }
      }
    ]).catch(() => [])
  ]);

  // Aggregate event counts
  const eventCounts = {};
  for (const row of eventAgg) {
    eventCounts[row._id] = row.n;
  }

  // Aggregate interaction counts
  const interactionCounts = {};
  for (const row of interactionsAgg) {
    interactionCounts[row._id] = row.n;
  }

  const baseListingStats = listingStatsAgg[0] || {};
  const baseReelsStats = reelsStatsAgg[0] || {};

  // Compute vendor-specific totals
  const totalViews = Math.max(
    eventCounts.view || 0,
    (baseListingStats.views || 0) + (baseReelsStats.views || 0)
  );

  const chatsStarted = Math.max(
    eventCounts.chat_start || 0,
    interactionCounts.chat_inquiry || 0,
    inquiriesCount || 0
  );

  const waClicks = (eventCounts.wa_click || 0) + (interactionCounts.whatsapp_contact || 0) + (interactionCounts.click_to_call || 0);

  const dealsStarted = Math.max(
    eventCounts.deal_start || 0,
    ordersCount || 0
  );

  const dealsCompleted = Math.max(
    eventCounts.deal_complete || 0,
    completedOrdersCount || 0
  );

  const saves = Math.max(
    eventCounts.save || 0,
    baseListingStats.saves || 0,
    interactionCounts.save || 0,
    interactionCounts.save_image || 0,
    interactionCounts.save_reel || 0
  );

  const shares = Math.max(
    eventCounts.share || 0,
    baseListingStats.shares || 0
  );

  const uniqueChattersCount = Math.max(uniqueChatters.length, inquiriesCount);
  const totalWatchers = watchersAgg.length > 0 ? watchersAgg[0].total : 0;
  const totalLeads = uniqueChattersCount + totalWatchers;

  const dealsByStatus = {};
  let totalDeals = 0;
  for (const row of dealsAgg) {
    dealsByStatus[row._id] = row.n;
    totalDeals += row.n;
  }

  // Calculate unique customer count
  const allCustomerIds = new Set([
    ...orderCustomers.map(c => c?.toString()),
    ...inquiryCustomers.map(c => c?.toString()),
    ...dealCustomers.map(c => c?.toString())
  ].filter(Boolean));
  const uniqueCustomersCount = Math.max(allCustomerIds.size, uniqueChattersCount);

  // Calculate revenue
  const orderRevenue = orderRevenueAgg[0]?.total || 0;
  const dealRevenue = dealRevenueAgg[0]?.total || 0;
  const totalRevenue = Math.round(orderRevenue + dealRevenue);

  const totalOffersCount = totalDeals + (quotesCount || 0);
  const totalOrdersCount = Math.max(ordersCount, completedOrdersCount, baseListingStats.orders || 0);
  const effectiveFollowers = Math.max(followersCount || 0, userDoc?.followersCount || (userDoc?.followers?.length || 0));

  // Conversion rates strictly for this vendor's funnel
  const viewToChat = totalViews ? Math.round(((chatsStarted + waClicks) / totalViews) * 100 * 10) / 10 : 0.0;
  const chatToDeal = (chatsStarted + waClicks) ? Math.round((dealsStarted / (chatsStarted + waClicks)) * 100 * 10) / 10 : 0.0;
  const dealToComplete = dealsStarted ? Math.round((dealsCompleted / dealsStarted) * 100 * 10) / 10 : 0.0;

  const avgRating = revAgg.length > 0
    ? Math.round(revAgg[0].avg * 10) / 10
    : (userDoc?.rating_avg ? Math.round(userDoc.rating_avg * 10) / 10 : 5.0);

  const reviewsCount = revAgg.length > 0 ? revAgg[0].n : (userDoc?.rating_count || 0);

  return {
    range: rangeKey,
    kpis: {
      views: totalViews,
      chats_started: chatsStarted,
      unique_chatters: uniqueChattersCount,
      watchers: totalWatchers,
      leads: totalLeads,
      deals_started: dealsStarted,
      deals_completed: dealsCompleted,
      saves,
      shares,
      wa_clicks: waClicks,
      listings_total: totalListings,
      listings_active: activeListings,
      products_total: productsCount,
      services_total: servicesCount,
      reels_total: reelsCount,
      total_orders: totalOrdersCount,
      total_customers: uniqueCustomersCount,
      total_offers: totalOffersCount,
      total_revenue: totalRevenue,
      revenue: totalRevenue,
      followers: effectiveFollowers,
    },
    deals_by_status: dealsByStatus,
    deals_total: totalDeals,
    conversion: {
      view_to_chat_pct: Math.min(viewToChat, 100),
      chat_to_deal_pct: Math.min(chatToDeal, 100),
      deal_to_complete_pct: Math.min(dealToComplete, 100),
    },
    reviews: {
      avg_rating: avgRating,
      count: reviewsCount,
    },
  };
};

/**
 * Breakdown strictly for ALL listings owned by this Vendor.
 */
const perListing = async (vendorId, rangeKey = '30d', sort = 'views', limit = 50) => {
  const cutoffDate = getRangeCutoffDate(rangeKey);
  const vendorIdStr = vendorId.toString();
  const vendorObjId = new mongoose.Types.ObjectId(vendorId);

  const vendorMatch = { $in: [vendorObjId, vendorIdStr] };

  const evQ = { vendor_id: { $in: [vendorIdStr, vendorObjId] } };
  if (cutoffDate) {
    evQ.created_at = { $gte: cutoffDate };
  }

  // 1. Fetch ONLY listings belonging to THIS vendor
  const vendorListings = await Listing.find({
    vendor: vendorMatch,
    isDeleted: { $ne: true }
  }).lean();

  // 2. Aggregate events per listing_id strictly for this vendor
  const agg = await ListingEvent.aggregate([
    { $match: evQ },
    {
      $group: {
        _id: { listing_id: '$listing_id', type: '$event_type' },
        n: { $sum: 1 },
      },
    },
  ]);

  const countsByListing = {};
  for (const row of agg) {
    const lid = row._id.listing_id?.toString();
    const type = row._id.type;
    if (lid) {
      if (!countsByListing[lid]) countsByListing[lid] = {};
      countsByListing[lid][type] = row.n;
    }
  }

  // 3. Build unified items list for this vendor's catalog only
  const items = vendorListings.map(li => {
    const lid = li._id.toString();
    const ec = countsByListing[lid] || {};

    const views = Math.max(ec.view || 0, li.views || 0);
    const chats = Math.max(ec.chat_start || 0, ec.chat || 0);
    const deals = Math.max(ec.deal_start || 0, li.orders_count || 0);
    const dealsCompleted = Math.max(ec.deal_complete || 0, 0);
    const saves = Math.max(ec.save || 0, li.saves_count || 0);
    const shares = Math.max(ec.share || 0, li.shares || 0);
    const waClicks = ec.wa_click || 0;

    return {
      listing_id: lid,
      title: li.title || 'Untitled Listing',
      slug: li.slug || null,
      price: li.sellingPrice || li.price || 0,
      type: li.type || 'product',
      status: li.status || 'published',
      boost_expires_at: li.boost_expires_at || null,
      views,
      chats,
      deals,
      deals_completed: dealsCompleted,
      saves,
      shares,
      wa_clicks: waClicks,
    };
  });

  const sortKeys = { views: 'views', chats: 'chats', deals: 'deals', shares: 'shares', saves: 'saves' };
  const key = sortKeys[sort] || 'views';

  items.sort((a, b) => (b[key] || 0) - (a[key] || 0));
  return { range: rangeKey, items: items.slice(0, limit) };
};

/**
 * Timeseries trend strictly for this Vendor's activity over time.
 */
const timeseries = async (vendorId, rangeKey = '30d', metric = 'views') => {
  const metricMap = {
    views: 'view',
    chats: 'chat_start',
    deals: 'deal_start',
    deals_completed: 'deal_complete',
    wa_clicks: 'wa_click',
    saves: 'save',
    shares: 'share',
  };
  const evType = metricMap[metric] || 'view';
  const days = RANGE_DAYS[rangeKey] || 30;
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const vendorIdStr = vendorId.toString();
  const vendorObjId = new mongoose.Types.ObjectId(vendorId);

  // STRICTLY match ONLY this vendor's events
  const evQ = {
    vendor_id: { $in: [vendorIdStr, vendorObjId] },
    event_type: evType,
    created_at: { $gte: cutoffDate },
  };

  const agg = await ListingEvent.aggregate([
    { $match: evQ },
    {
      $project: {
        day: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
      },
    },
    { $group: { _id: '$day', n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const buckets = {};
  for (const row of agg) {
    buckets[row._id] = row.n;
  }

  const out = [];
  const startDay = new Date(cutoffDate);
  const endDay = new Date();
  const current = new Date(startDay);

  while (current <= endDay) {
    const key = current.toISOString().slice(0, 10);
    out.push({ date: key, value: buckets[key] || 0 });
    current.setDate(current.getDate() + 1);
  }

  return { metric, range: rangeKey, items: out };
};

/**
 * Boost ROI analysis strictly for the specific vendor's listing.
 */
const boostRoi = async (vendorId, listingId) => {
  const vendorIdStr = vendorId.toString();
  const li = await Listing.findById(listingId);

  if (!li || (li.vendor && li.vendor.toString() !== vendorIdStr)) {
    throw ApiError.notFound('Listing not found or unauthorized');
  }

  const activated = li.boost_activated_at;
  const expires = li.boost_expires_at;
  if (!activated || !expires) {
    throw ApiError.badRequest('This listing has no boost history');
  }
  const dur = li.boost_duration_days || 7;

  const boostStart = new Date(activated);
  let boostEnd = new Date(expires);
  const now = new Date();
  if (boostEnd > now) {
    boostEnd = now;
  }
  const baselineEnd = boostStart;
  const baselineStart = new Date(boostStart.getTime() - dur * 24 * 60 * 60 * 1000);

  const getCounts = async (cstart, cend) => {
    const agg = await ListingEvent.aggregate([
      {
        $match: {
          listing_id: listingId.toString(),
          vendor_id: vendorIdStr,
          created_at: { $gte: cstart, $lt: cend },
        },
      },
      { $group: { _id: '$event_type', n: { $sum: 1 } } },
    ]);
    const res = {};
    for (const row of agg) {
      res[row._id] = row.n;
    }
    return res;
  };

  const during = await getCounts(boostStart, boostEnd);
  const baseline = await getCounts(baselineStart, baselineEnd);

  const calculateLift = (name) => {
    const b = baseline[name] || 0;
    const d = during[name] || 0;
    if (!b) {
      return d ? Infinity : 0.0;
    }
    return Math.round(((d - b) / b) * 100 * 10) / 10;
  };

  return {
    listing_id: listingId,
    boost_start: boostStart.toISOString(),
    boost_end: boostEnd.toISOString(),
    duration_days: dur,
    during: {
      views: during.view || 0,
      chats: during.chat_start || 0,
      deals: during.deal_start || 0,
    },
    baseline: {
      views: baseline.view || 0,
      chats: baseline.chat_start || 0,
      deals: baseline.deal_start || 0,
    },
    lift_pct: {
      views: calculateLift('view'),
      chats: calculateLift('chat_start'),
      deals: calculateLift('deal_start'),
    },
  };
};

const analyticsRepository = require('../repositories/analyticsRepository');
const logger = require('../utils/logger');

const trackEvent = async ({ type, userId, targetId, queryText, metadata }) => {
  try {
    const event = await analyticsRepository.logEvent({
      type,
      userId,
      targetId,
      queryText,
      metadata,
    });
    return event;
  } catch (err) {
    logger.error('Failed to log analytics metric:', err);
    return null;
  }
};

const getMetricsSummary = async ({ type, targetId, startDate, endDate }) => {
  return analyticsRepository.fetchEventSummary({ type, targetId, startDate, endDate });
};

module.exports = {
  overview,
  perListing,
  timeseries,
  boostRoi,
  trackEvent,
  getMetricsSummary,
};
