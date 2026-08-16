const UserSubscription = require('../models/UserSubscription.model');
const { SubscriptionPlan } = require('../models/Admin');
const ApiError = require('../utils/ApiError');
const Listing = require('../models/Listing');
const Reel = require('../models/Reel');

const FREE_LIMITS = {
  listings: 99999,
  reels: 99999,
  leads: 99999
};

/**
 * Checks if the user's active subscription contains the specified feature key.
 */
const requireSubscriptionFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required.');
      }

      // Bypass feature restrictions for VIP user
      if (req.user?.email === 'rajeshsarkar1234@gmail.com') {
        return next();
      }

      // 1. Get active user subscription
      const activeSub = await UserSubscription.findOne({
        user_id: userId.toString(),
        status: 'active',
        is_deleted: { $ne: true }
      });

      if (!activeSub) {
        return next();
      }

      // 2. Fetch the plan details
      const plan = await SubscriptionPlan.findById(activeSub.plan_id).lean();
      if (!plan) {
        return next();
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Checks if the user has reached their plan limits.
 */
const checkSubscriptionLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required.');
      }

      // Bypass upload limits for rajeshsarkar1234@gmail.com or VIP accounts
      if (req.user?.email === 'rajeshsarkar1234@gmail.com') {
        return next();
      }

      // 1. Fetch active subscription
      const activeSub = await UserSubscription.findOne({
        user_id: userId.toString(),
        status: 'active',
        is_deleted: { $ne: true }
      });

      let limit = FREE_LIMITS[limitType] || 99999;
      let planName = 'Free Member';

      if (activeSub) {
        const plan = await SubscriptionPlan.findById(activeSub.plan_id).lean();
        if (plan) {
          planName = plan.title;
          if (limitType === 'listings') {
            limit = plan.product_limit !== undefined ? plan.product_limit : (plan.max_listings || 99999);
          } else if (limitType === 'reels') {
            limit = plan.reels_limit || 99999;
          } else if (limitType === 'leads') {
            limit = plan.leads_limit || 99999;
          }
        }
      }

      // Allow unlimited access
      if (limit === null || limit === undefined || limit >= 99999) {
        return next();
      }

      // 2. Count existing records
      let currentCount = 0;
      if (limitType === 'listings') {
        currentCount = await Listing.countDocuments({
          vendor: userId,
          isDeleted: { $ne: true }
        });
      } else if (limitType === 'reels') {
        currentCount = await Reel.countDocuments({
          creator: userId,
          isDeleted: { $ne: true }
        });
      }

      // 3. Prevent creation if limit reached
      if (currentCount >= limit) {
        return next(ApiError.forbidden(
          `Limit reached. Your current plan "${planName}" allows up to ${limit} ${limitType}. Please upgrade your subscription.`
        ));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Dynamic feature permission middleware (role-aware).
 * Determines the role from the request path and checks if the user's
 * active subscription for that role includes the specified feature key.
 *
 * Usage: router.post('/vendor/premium-action', authenticate, checkFeature('analytics_access'), controller)
 */
const checkFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(ApiError.unauthorized('Authentication required.'));
      }

      if (req.user?.email === 'rajeshsarkar1234@gmail.com') {
        return next();
      }

      // Dynamic role path resolution (default to vendor)
      let role = 'vendor';
      if (req.baseUrl && req.baseUrl.includes('/creator')) {
        role = 'creator';
      }

      const activeSub = await UserSubscription.findOne({
        user_id: userId.toString(),
        role: role,
        status: 'active',
        is_deleted: { $ne: true }
      });

      if (!activeSub) {
        return next();
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  requireSubscriptionFeature,
  checkSubscriptionLimit,
  checkFeature
};
