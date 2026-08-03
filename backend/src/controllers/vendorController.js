const Listing = require('../models/Listing');
const Reel = require('../models/Reel');
const Order = require('../models/Order');
const Inquiry = require('../models/Inquiry');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

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
    const referralService = require('../services/referral.service');
    const walletService = require('../services/wallet.service');

    const [
      productsCount,
      servicesCount,
      reels,
      ordersCount,
      leadsCount,
      wallet,
      referralInfo
    ] = await Promise.all([
      Listing.countDocuments({ vendor: userId, type: 'product', isDeleted: { $ne: true } }),
      Listing.countDocuments({ vendor: userId, type: 'service', isDeleted: { $ne: true } }),
      Reel.find({ creator: userId, isDeleted: { $ne: true } }).select('views status').lean(),
      Order.countDocuments({ vendor: userId }),
      Inquiry.countDocuments({ vendor: userId }),
      walletService.getOrCreateWallet(userId),
      referralService.getVendorDashboard(userId).catch(() => null)
    ]);

    const totalReels = reels.length;
    const totalViews = reels.reduce((sum, r) => sum + (r.views || 0), 0);
    const followers = req.user.followersCount || (req.user.followers ? req.user.followers.length : 0);

    const availableCredits = wallet ? (wallet.credits || 0) : 0;
    const depositedCredits = wallet ? (wallet.lifetime_deposited_paise ? Math.floor(wallet.lifetime_deposited_paise / 100) : 0) : 0;
    const earnedCredits = wallet ? (wallet.lifetime_earned_credits || 0) : 0;
    const usedCreditHistory = wallet ? (wallet.lifetime_spent_credits || 0) : 0;

    const { AppSettings } = require('../models/Admin');
    let creditRates = {
      productListing: 1,
      reelPost: 1,
      aiImage: 2,
      aiVideo30s: 15,
      reelBoost1Day: 10,
      validLead: 1,
    };
    const now = Date.now();
    if (cachedCreditRates && (now - lastRatesFetched < RATES_CACHE_TTL_MS)) {
      creditRates = cachedCreditRates;
    } else {
      try {
        const rateSetting = await AppSettings.findOne({ key: 'credit_rates' }).lean();
        if (rateSetting && rateSetting.value) {
          creditRates = { ...creditRates, ...rateSetting.value };
        }
        cachedCreditRates = creditRates;
        lastRatesFetched = now;
      } catch (err) {}
    }

    return ApiResponse.ok(res, 'Vendor dashboard metrics loaded.', {
      totalSales: req.user.walletBalance ? req.user.walletBalance * 2 : 0,
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
      creditRates
    });
  });

  // ── Vendor Analytics ─────────────────────────────────────
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
