const UserSubscription = require('../models/UserSubscription.model');
const { SubscriptionPlan } = require('../models/Admin');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const cache = require('../utils/cache');

/**
 * SubscriptionController — Production-Grade
 * Handles subscription viewing, purchasing, upgrading, cancelling with real-time updates.
 */
class SubscriptionController {

  // ── Get My Active Subscription ──────────────────────────
  getMySubscription = asyncHandler(async (req, res) => {
    const uid = req.user._id.toString();
    const activeSub = await UserSubscription.findOne({
      user_id: uid,
      status: 'active',
      is_deleted: { $ne: true },
    }).lean();

    if (!activeSub) {
      return ApiResponse.ok(res, 'No active subscription.', {
        subscription: null,
        plan: 'Free Member',
        is_active: false,
      });
    }

    // Check if expired
    if (new Date(activeSub.expiry_date) < new Date()) {
      await UserSubscription.updateOne({ _id: activeSub._id }, { $set: { status: 'expired' } });
      await User.updateOne({ _id: uid }, { $set: { is_subscribed_verified: false } });

      // Emit expiry event
      try {
        const { emitToUser } = require('../sockets');
        emitToUser(uid, 'subscription:expired', { plan: activeSub.plan_name });
      } catch (err) {}

      return ApiResponse.ok(res, 'Subscription has expired.', {
        subscription: { ...activeSub, status: 'expired' },
        plan: activeSub.plan_name,
        is_active: false,
      });
    }

    return ApiResponse.ok(res, 'Active subscription loaded.', {
      subscription: activeSub,
      plan: activeSub.plan_name,
      is_active: true,
      days_remaining: Math.max(0, Math.ceil((new Date(activeSub.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))),
    });
  });

  // ── Get Available Plans ─────────────────────────────────
  getPlans = asyncHandler(async (req, res) => {
    const cacheKey = 'subscription:plans';
    const cached = await cache.getCache(cacheKey);
    if (cached) {
      return ApiResponse.ok(res, 'Plans loaded.', { items: cached });
    }

    const plans = await SubscriptionPlan.find({ is_active: true, is_deleted: { $ne: true } }).sort({ price_inr: 1 }).lean();
    const mapped = plans.map(obj => {
      const role = obj.user_type || obj.target_role || 'vendor';
      return {
        id: (obj._id || obj.id).toString(),
        title: obj.title,
        description: obj.description,
        plan_type: obj.plan_type || 'basic',
        user_type: role,
        billing_cycle: obj.billing_cycle,
        price_inr: obj.price_inr,
        duration_days: obj.duration_days || 30,
        features_list: obj.features_list || [],
        product_limit: obj.product_limit,
        service_limit: obj.service_limit,
        reels_limit: obj.reels_limit,
        leads_limit: obj.leads_limit,
        ai_credits: obj.ai_credits || 0,
        is_active: obj.is_active !== false,
      };
    });

    await cache.setCache(cacheKey, mapped, 86400);
    return ApiResponse.ok(res, 'Plans loaded.', { items: mapped });
  });

  // ── Purchase Subscription ───────────────────────────────
  purchaseSubscription = asyncHandler(async (req, res) => {
    const plan = req.body.plan || req.body.planId;
    if (!plan) {
      throw require('../utils/ApiError').badRequest('Plan is required.');
    }

    const walletService = require('../services/wallet.service');
    const result = await walletService.purchasePlan({ userId: req.user._id, plan });

    return ApiResponse.ok(res, 'Subscription purchased successfully.', {
      subscription: result.user.subscription,
      walletBalance: result.user.walletBalance,
      transaction: result.transaction,
    });
  });

  // ── Cancel My Subscription ──────────────────────────────
  cancelSubscription = asyncHandler(async (req, res) => {
    const uid = req.user._id.toString();
    const { reason } = req.body;

    const activeSub = await UserSubscription.findOne({
      user_id: uid,
      status: 'active',
      is_deleted: { $ne: true },
    });

    if (!activeSub) {
      throw require('../utils/ApiError').notFound('No active subscription to cancel.');
    }

    await UserSubscription.updateOne(
      { _id: activeSub._id },
      {
        $set: {
          status: 'cancelled',
          cancelled_at: new Date(),
          cancelled_reason: reason || 'Cancelled by user',
          auto_renewal: false,
        },
      }
    );

    await User.updateOne({ _id: uid }, { $set: { is_subscribed_verified: false } });

    // Emit real-time events
    try {
      const { emitToUser, emitToAdmin } = require('../sockets');
      emitToUser(uid, 'subscription:cancelled', { plan: activeSub.plan_name });
      emitToAdmin('admin:update', { tags: ['UserSubscriptions', 'AdminOverview'] });
    } catch (err) {}

    return ApiResponse.ok(res, 'Subscription cancelled.', { ok: true });
  });

  // ── Subscription History ────────────────────────────────
  getHistory = asyncHandler(async (req, res) => {
    const uid = req.user._id.toString();
    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || 20, 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      UserSubscription.find({ user_id: uid, is_deleted: { $ne: true } })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserSubscription.countDocuments({ user_id: uid, is_deleted: { $ne: true } }),
    ]);

    return ApiResponse.paginated(res, 'Subscription history loaded.', items, { page, limit, total });
  });

  // ── Upgrade Subscription ────────────────────────────────
  upgradeSubscription = asyncHandler(async (req, res) => {
    const uid = req.user._id.toString();
    const newPlanId = req.body.plan || req.body.planId;
    if (!newPlanId) {
      throw require('../utils/ApiError').badRequest('New plan is required.');
    }

    // Check current active sub
    const currentSub = await UserSubscription.findOne({
      user_id: uid,
      status: 'active',
      is_deleted: { $ne: true },
    }).lean();

    if (currentSub) {
      const newPlan = await SubscriptionPlan.findById(newPlanId).lean();
      if (newPlan && newPlan.price_inr <= (currentSub.paid_amount || 0)) {
        throw require('../utils/ApiError').badRequest('Cannot upgrade to a plan with lower or equal price. Use downgrade instead.');
      }
    }

    // Purchase the new plan (wallet service handles old plan cancellation)
    const walletService = require('../services/wallet.service');
    const result = await walletService.purchasePlan({ userId: req.user._id, plan: newPlanId });

    return ApiResponse.ok(res, 'Subscription upgraded successfully.', {
      subscription: result.user.subscription,
      walletBalance: result.user.walletBalance,
      transaction: result.transaction,
    });
  });

  // ── Downgrade Subscription ──────────────────────────────
  downgradeSubscription = asyncHandler(async (req, res) => {
    const uid = req.user._id.toString();
    const newPlanId = req.body.plan || req.body.planId;
    if (!newPlanId) {
      throw require('../utils/ApiError').badRequest('New plan is required.');
    }

    // Purchase the new plan (wallet service handles old plan cancellation)
    const walletService = require('../services/wallet.service');
    const result = await walletService.purchasePlan({ userId: req.user._id, plan: newPlanId });

    return ApiResponse.ok(res, 'Subscription downgraded successfully.', {
      subscription: result.user.subscription,
      walletBalance: result.user.walletBalance,
      transaction: result.transaction,
    });
  });
}

module.exports = new SubscriptionController();
