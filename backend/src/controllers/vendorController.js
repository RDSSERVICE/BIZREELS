const Listing = require('../models/Listing');
const Reel = require('../models/Reel');
const Order = require('../models/Order');
const Inquiry = require('../models/Inquiry');
const Deal = require('../models/Deal');
const Follow = require('../models/Follow');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

let cachedCreditRates = null;
let lastRatesFetched = 0;
const RATES_CACHE_TTL_MS = 30000; // 30 seconds cache

/**
 * VendorController
 * Handles Vendor Portal dashboard, analytics, and boost queries.
 */
class VendorController {
  // ── Vendor Dashboard ─────────────────────────────────────
  getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userIdStr = userId.toString();
    const vendorMatch = { $in: [userId, userIdStr] };
    const referralService = require('../services/referral.service');
    const walletService = require('../services/wallet.service');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      productsCount,
      recentProductsCount,
      prevProductsCount,
      servicesCount,
      recentServicesCount,
      prevServicesCount,
      reels,
      ordersCount,
      recentOrdersCount,
      prevOrdersCount,
      leadsCount,
      recentLeadsCount,
      prevLeadsCount,
      wallet,
      referralInfo,
      orderSalesAgg,
      currentOrderSalesAgg,
      previousOrderSalesAgg,
      dealSalesAgg,
      currentDealSalesAgg,
      previousDealSalesAgg,
      recentFollowersCount,
      prevFollowersCount
    ] = await Promise.all([
      Listing.countDocuments({ vendor: vendorMatch, type: 'product', isDeleted: { $ne: true } }),
      Listing.countDocuments({ vendor: vendorMatch, type: 'product', isDeleted: { $ne: true }, createdAt: { $gte: thirtyDaysAgo } }),
      Listing.countDocuments({ vendor: vendorMatch, type: 'product', isDeleted: { $ne: true }, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      
      Listing.countDocuments({ vendor: vendorMatch, type: 'service', isDeleted: { $ne: true } }),
      Listing.countDocuments({ vendor: vendorMatch, type: 'service', isDeleted: { $ne: true }, createdAt: { $gte: thirtyDaysAgo } }),
      Listing.countDocuments({ vendor: vendorMatch, type: 'service', isDeleted: { $ne: true }, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      
      Reel.find({ creator: vendorMatch, isDeleted: { $ne: true } }).select('views status createdAt').lean(),
      
      Order.countDocuments({ vendor: vendorMatch }),
      Order.countDocuments({ vendor: vendorMatch, createdAt: { $gte: thirtyDaysAgo } }),
      Order.countDocuments({ vendor: vendorMatch, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      
      Inquiry.countDocuments({ vendor: vendorMatch }),
      Inquiry.countDocuments({ vendor: vendorMatch, createdAt: { $gte: thirtyDaysAgo } }),
      Inquiry.countDocuments({ vendor: vendorMatch, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      
      walletService.getOrCreateWallet(userId),
      referralService.getVendorDashboard(userId).catch(() => null),
      
      Order.aggregate([
        { $match: { vendor: vendorMatch, $or: [{ paymentStatus: 'paid' }, { status: { $in: ['accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered'] } }] } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$itemTotal', { $multiply: ['$price', '$quantity'] }] } } } }
      ]).catch(() => []),
      Order.aggregate([
        { $match: { vendor: vendorMatch, $or: [{ paymentStatus: 'paid' }, { status: { $in: ['accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered'] } }], createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$itemTotal', { $multiply: ['$price', '$quantity'] }] } } } }
      ]).catch(() => []),
      Order.aggregate([
        { $match: { vendor: vendorMatch, $or: [{ paymentStatus: 'paid' }, { status: { $in: ['accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered'] } }], createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$itemTotal', { $multiply: ['$price', '$quantity'] }] } } } }
      ]).catch(() => []),
      
      Deal.aggregate([
        { $match: { seller_id: { $in: [userIdStr, userId] }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$final_amount', '$current_offer', '$amount_paise'] } } } }
      ]).catch(() => []),
      Deal.aggregate([
        { $match: { seller_id: { $in: [userIdStr, userId] }, status: 'completed', created_at: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$final_amount', '$current_offer', '$amount_paise'] } } } }
      ]).catch(() => []),
      Deal.aggregate([
        { $match: { seller_id: { $in: [userIdStr, userId] }, status: 'completed', created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$final_amount', '$current_offer', '$amount_paise'] } } } }
      ]).catch(() => []),
      
      Follow.countDocuments({ following_id: { $in: [userIdStr, userId] }, created_at: { $gte: thirtyDaysAgo } }),
      Follow.countDocuments({ following_id: { $in: [userIdStr, userId] }, created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
    ]);

    const totalReels = reels.length;
    const totalViews = reels.reduce((sum, r) => sum + (r.views || 0), 0);
    const followers = req.user.followersCount || (req.user.followers ? req.user.followers.length : 0);

    const availableCredits = wallet ? (wallet.credits || 0) : 0;
    const depositedCredits = wallet ? (wallet.lifetime_deposited_paise ? Math.floor(wallet.lifetime_deposited_paise / 100) : 0) : 0;
    const earnedCredits = wallet ? (wallet.lifetime_earned_credits || 0) : 0;
    const usedCreditHistory = wallet ? (wallet.lifetime_spent_credits || 0) : 0;

    // View counts from ReelView model to determine historical views trend accurately
    let recentViews = 0;
    let prevViews = 0;
    const vendorReelIds = reels.map(r => r._id);
    if (vendorReelIds.length > 0) {
      const ReelView = require('../models/ReelView');
      const [recV, preV] = await Promise.all([
        ReelView.countDocuments({ reel_id: { $in: vendorReelIds }, viewed_at: { $gte: thirtyDaysAgo } }),
        ReelView.countDocuments({ reel_id: { $in: vendorReelIds }, viewed_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
      ]).catch(() => [0, 0]);
      recentViews = recV;
      prevViews = preV;
    }

    // Helper to calculate percentages trend safely
    const calculateTrend = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      const diff = current - previous;
      const pct = (diff / previous) * 100;
      return Math.round(pct);
    };

    const trendProducts = calculateTrend(recentProductsCount, prevProductsCount);
    const trendServices = calculateTrend(recentServicesCount, prevServicesCount);

    const recentReelsCount = reels.filter(r => new Date(r.createdAt) >= thirtyDaysAgo).length;
    const prevReelsCount = reels.filter(r => {
      const d = new Date(r.createdAt);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    }).length;
    const trendReels = calculateTrend(recentReelsCount, prevReelsCount);

    const trendViews = calculateTrend(recentViews, prevViews);
    const trendFollowers = calculateTrend(recentFollowersCount, prevFollowersCount);
    const trendEnquiries = calculateTrend(recentLeadsCount, prevLeadsCount);
    const trendOrders = calculateTrend(recentOrdersCount, prevOrdersCount);

    const totalSales = (orderSalesAgg[0]?.total || 0) + (dealSalesAgg[0]?.total || 0);
    const currentSales = (currentOrderSalesAgg[0]?.total || 0) + (currentDealSalesAgg[0]?.total || 0);
    const previousSales = (previousOrderSalesAgg[0]?.total || 0) + (previousDealSalesAgg[0]?.total || 0);
    const trendSales = calculateTrend(currentSales, previousSales);

    const { AppSettings } = require('../models/Admin');
    let creditRates = {};
    const nowMs = Date.now();
    if (cachedCreditRates && (nowMs - lastRatesFetched < RATES_CACHE_TTL_MS)) {
      creditRates = cachedCreditRates;
    } else {
      try {
        const rateSetting = await AppSettings.findOne({ key: 'credit_rates' }).lean();
        if (rateSetting && rateSetting.value) {
          creditRates = rateSetting.value;
        } else {
          creditRates = {
            productListing: 1,
            reelPost: 1,
            aiImage: 2,
            aiVideo30s: 15,
            reelBoost1Day: 10,
            validLead: 1,
          };
        }
        cachedCreditRates = creditRates;
        lastRatesFetched = nowMs;
      } catch (err) {
        logger.error('Failed to load credit rates from AppSettings:', err);
        creditRates = {
          productListing: 1,
          reelPost: 1,
          aiImage: 2,
          aiVideo30s: 15,
          reelBoost1Day: 10,
          validLead: 1,
        };
      }
    }

    return ApiResponse.ok(res, 'Vendor dashboard metrics loaded.', {
      totalSales,
      totalOrders: ordersCount,
      activeListings: productsCount,
      totalProducts: productsCount,
      totalServices: servicesCount,
      totalReels,
      totalViews,
      followers,
      leadEnquiries: leadsCount,
      walletBalance: availableCredits,
      rating: req.user.rating_avg || 5.0,
      credits: {
        available: availableCredits,
        deposited: depositedCredits,
        earned: earnedCredits,
        used: usedCreditHistory,
      },
      referral: referralInfo ? {
        code: referralInfo.referral_code,
        link: referralInfo.referral_link,
        totalReferrals: referralInfo.summary.total,
        successfulReferrals: referralInfo.summary.successful,
        creditsEarned: referralInfo.summary.credits_earned
      } : null,
      creditRates,
      trends: {
        totalProducts: trendProducts,
        totalServices: trendServices,
        totalReels: trendReels,
        totalViews: trendViews,
        followers: trendFollowers,
        leadEnquiries: trendEnquiries,
        totalOrders: trendOrders,
        totalSales: trendSales
      }
    });
  });

  // ── Vendor Analytics ─────────────────────────────────────
  getAnalyticsOverview = asyncHandler(async (req, res) => {
    const analyticsService = require('../services/analytics.service');
    const range = req.query.range || '30d';
    const data = await analyticsService.overview(req.user._id, range);
    return ApiResponse.ok(res, 'Vendor analytics overview loaded.', data);
  });

  getAnalyticsListings = asyncHandler(async (req, res) => {
    const analyticsService = require('../services/analytics.service');
    const range = req.query.range || '30d';
    const sort = req.query.sort || 'views';
    const limit = parseInt(req.query.limit, 10) || 10;
    const data = await analyticsService.perListing(req.user._id, range, sort, limit);
    return ApiResponse.ok(res, 'Vendor analytics listings loaded.', data);
  });

  getAnalyticsTimeseries = asyncHandler(async (req, res) => {
    const analyticsService = require('../services/analytics.service');
    const range = req.query.range || '30d';
    const metric = req.query.metric || 'views';
    const data = await analyticsService.timeseries(req.user._id, range, metric);
    return ApiResponse.ok(res, 'Vendor analytics timeseries loaded.', data);
  });

  getAnalyticsBoostRoi = asyncHandler(async (req, res) => {
    const analyticsService = require('../services/analytics.service');
    const { listing_id } = req.query;
    if (!listing_id) {
      return ApiResponse.badRequest(res, 'Listing ID is required.');
    }
    const data = await analyticsService.boostRoi(req.user._id, listing_id);
    return ApiResponse.ok(res, 'Vendor analytics boost ROI loaded.', data);
  });

  simulateAnalyticsData = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const userId = req.user._id;

    // Check if the vendor has any listings
    let listings = await Listing.find({ vendor: userId, isDeleted: { $ne: true } });
    if (listings.length === 0) {
      const sampleListings = [
        {
          vendor: userId,
          type: 'product',
          title: 'Premium Wireless Noise-Canceling Headphones',
          category: 'Electronics',
          price: 9999,
          status: 'published',
          isDeleted: false,
          watchers: [],
          views: 120,
          likes: 24,
          saves_count: 18,
          shares: 12,
          orders_count: 5,
          revenue: 49995,
          rating: 4.8,
          totalReviews: 3,
        },
        {
          vendor: userId,
          type: 'product',
          title: 'Classic Full-Grain Leather Wallet',
          category: 'Accessories',
          price: 1499,
          status: 'published',
          isDeleted: false,
          watchers: [],
          views: 85,
          likes: 12,
          saves_count: 9,
          shares: 4,
          orders_count: 2,
          revenue: 2998,
          rating: 4.5,
          totalReviews: 2,
        },
        {
          vendor: userId,
          type: 'service',
          title: 'Professional SEO Optimization & Content Strategy',
          category: 'Marketing',
          price: 5000,
          status: 'published',
          isDeleted: false,
          watchers: [],
          views: 64,
          likes: 8,
          saves_count: 5,
          shares: 6,
          orders_count: 1,
          revenue: 5000,
          rating: 5.0,
          totalReviews: 1,
        }
      ];
      listings = await Listing.create(sampleListings);
    }

    // Check if the vendor has any reels
    let reels = await Reel.find({ creator: userId, isDeleted: { $ne: true } });
    if (reels.length === 0) {
      const sampleReels = [
        {
          creator: userId,
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-headphones-on-a-table-32943-large.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
          caption: 'Elevate your sound. Premium Headphones unboxing! 🎧 #audio #lifestyle',
          postType: 'product',
          category: 'Electronics',
          isDeleted: false,
          views: 0,
          likes: 0,
        },
        {
          creator: userId,
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-mens-wallet-and-watch-on-table-32947-large.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1627124118303-19dec36d069f',
          caption: 'Handcrafted leather perfection. 💼 #leathergoods #fashion',
          postType: 'product',
          category: 'Accessories',
          isDeleted: false,
          views: 0,
          likes: 0,
        }
      ];
      reels = await Reel.create(sampleReels);
    }

    // Set one listing as boosted for Boost ROI demonstration
    const boostedListing = listings[0];
    if (boostedListing && !boostedListing.boost_activated_at) {
      const now = new Date();
      const activatedAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await Listing.updateOne(
        { _id: boostedListing._id },
        {
          $set: {
            isBoosted: true,
            boost_activated_at: activatedAt,
            boost_expires_at: expiresAt,
            boost_duration_days: 14,
          }
        }
      );
    }

    // Generate listing events
    const eventTypes = [
      { type: 'view', min: 30, max: 70 },
      { type: 'wa_click', min: 8, max: 18 },
      { type: 'chat_start', min: 4, max: 10 },
      { type: 'save', min: 10, max: 25 },
      { type: 'share', min: 3, max: 8 },
      { type: 'deal_start', min: 2, max: 5 },
      { type: 'deal_complete', min: 1, max: 3 }
    ];

    const bulkEvents = [];
    const mockUserIds = Array.from({ length: 15 }).map(() => new mongoose.Types.ObjectId().toString());

    for (const listing of listings) {
      for (const et of eventTypes) {
        const count = Math.floor(Math.random() * (et.max - et.min + 1)) + et.min;
        for (let i = 0; i < count; i++) {
          const randDaysAgo = Math.floor(Math.random() * 30);
          const eventTime = new Date(Date.now() - randDaysAgo * 24 * 60 * 60 * 1000);
          const randomUser = mockUserIds[Math.floor(Math.random() * mockUserIds.length)];

          bulkEvents.push({
            listing_id: listing._id.toString(),
            vendor_id: userId.toString(),
            event_type: et.type,
            user_id: randomUser,
            meta: {
              ipAddress: '127.0.0.1',
              device: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
            created_at: eventTime.toISOString()
          });
        }
      }
    }

    if (bulkEvents.length > 0) {
      const { ListingEvent } = require('../models/Misc');
      await ListingEvent.insertMany(bulkEvents);
    }

    return ApiResponse.created(res, 'Simulated traffic and listings generated successfully.', {
      listingsCreated: listings.length,
      reelsCreated: reels.length,
      eventsGenerated: bulkEvents.length
    });
  });

  getAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [reels, productListings, serviceListings, leadsCount] = await Promise.all([
      Reel.find({ creator: userId }).select('views').lean(),
      Listing.countDocuments({ vendor: userId, type: 'product' }),
      Listing.countDocuments({ vendor: userId, type: 'service' }),
      Inquiry.countDocuments({ vendor: userId })
    ]);

    const totalReelViews = reels.reduce((acc, r) => acc + (r.views || 0), 0);

    return ApiResponse.ok(res, 'Vendor analytics metrics loaded.', {
      reelViews: totalReelViews,
      productViews: productListings * 10,
      serviceViews: serviceListings * 10,
      offerClicks: leadsCount * 2,
      phoneCalls: leadsCount,
      whatsappClicks: leadsCount,
      profileVisits: (productListings + serviceListings) * 15,
      followers: req.user.followers_count || 0
    });
  });

  // ── Vendor Boosts ────────────────────────────────────────
  getBoosts = asyncHandler(async (req, res) => {
    const boostedReels = await Reel.find({ creator: req.user._id, isBoosted: true }).lean();

    return ApiResponse.ok(res, 'Active reel boosts loaded.', {
      active: boostedReels.map((r) => {
        let remainingDays = 7;
        if (r.boostExpiresAt) {
          const diff = new Date(r.boostExpiresAt).getTime() - Date.now();
          remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        } else if (r.boostDurationDays) {
          remainingDays = r.boostDurationDays;
        }

        return {
          id: r._id.toString(),
          reelTitle: r.caption || 'Boosted Reel Promo',
          plan: r.boostPlan || 'Gold Boost (7 Days)',
          remainingDays,
          status: remainingDays > 0 ? 'Active' : 'Expired',
          cost: r.boostCost || 1499
        };
      })
    });
  });

  purchaseBoost = asyncHandler(async (req, res) => {
    const { reelId, plan, cost, days } = req.body;
    const walletService = require('../services/wallet.service');
    const ApiError = require('../utils/ApiError');

    if (!reelId || !plan || !cost) {
      throw ApiError.badRequest('reelId, plan, and cost are required');
    }

    const reel = await Reel.findOne({ _id: reelId, creator: req.user._id });
    if (!reel) {
      throw ApiError.notFound('Reel not found or not owned by you');
    }

    const durationDays = parseInt(days || (plan.toLowerCase().includes('3 day') ? 3 : plan.toLowerCase().includes('30 day') ? 30 : 7), 10);

    await walletService.debit({
      userId: req.user._id,
      amount: Math.round(cost),
      transactionType: 'manual_debit',
      reason: `Purchased Reel Boost: ${plan} for reel "${reel.caption || 'Promo'}"`,
      source: 'boost_reel'
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await Reel.updateOne(
      { _id: reelId },
      {
        $set: {
          isBoosted: true,
          boostPlan: plan,
          boostCost: cost,
          boostDurationDays: durationDays,
          boostActivatedAt: now.toISOString(),
          boostExpiresAt: expiresAt.toISOString(),
        }
      }
    );

    return ApiResponse.created(res, 'Reel boost purchased successfully', {
      id: reelId,
      plan,
      cost,
      remainingDays: durationDays,
      status: 'Active'
    });
  });

  renewBoost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const walletService = require('../services/wallet.service');
    const ApiError = require('../utils/ApiError');

    const reel = await Reel.findOne({ _id: id, creator: req.user._id });
    if (!reel) {
      throw ApiError.notFound('Boosted reel not found');
    }

    const cost = reel.boostCost || 1499;
    const planName = reel.boostPlan || 'Gold Boost (7 Days)';
    const days = reel.boostDurationDays || 7;

    await walletService.debit({
      userId: req.user._id,
      amount: Math.round(cost),
      transactionType: 'manual_debit',
      reason: `Renewed Reel Boost: ${planName} for reel "${reel.caption || 'Promo'}"`,
      source: 'boost_reel'
    });

    const now = new Date();
    let baseFrom = now;
    if (reel.boostExpiresAt) {
      const currentExpiry = new Date(reel.boostExpiresAt);
      if (currentExpiry > now) {
        baseFrom = currentExpiry;
      }
    }

    const newExpiry = new Date(baseFrom.getTime() + days * 24 * 60 * 60 * 1000);
    const remainingDays = Math.max(0, Math.ceil((newExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    await Reel.updateOne(
      { _id: id },
      {
        $set: {
          isBoosted: true,
          boostActivatedAt: now.toISOString(),
          boostExpiresAt: newExpiry.toISOString(),
        }
      }
    );

    return ApiResponse.ok(res, 'Reel boost renewed successfully', {
      id,
      plan: planName,
      cost,
      remainingDays,
      status: 'Active'
    });
  });
}

module.exports = new VendorController();
