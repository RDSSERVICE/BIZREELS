const UserSubscription = require('../models/UserSubscription.model');
const { SubscriptionPlan } = require('../models/Admin');
const ApiError = require('../utils/ApiError');
const Listing = require('../models/Listing');
const Reel = require('../models/Reel');

const FREE_LIMITS = {
  listings: 5,
  reels: 5,
  leads: 5
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

      // 1. Get active user subscription
      const activeSub = await UserSubscription.findOne({
        user_id: userId.toString(),
        status: 'active',
        is_deleted: { $ne: true }
      });

      if (!activeSub) {
        return next(ApiError.forbidden(`The feature "${featureKey}" requires a premium subscription plan.`));
      }

      // 2. Fetch the plan details
      const plan = await SubscriptionPlan.findById(activeSub.plan_id).lean();
      if (!plan) {
        return next(ApiError.forbidden(`Your active subscription plan was not found.`));
      }

      // 3. Verify feature dynamically
      // Check as boolean field, in comma-separated string, or in array
      const isFeatureEnabled =
        plan[featureKey] === true ||
        (plan.features && typeof plan.features === 'string' && plan.features.split(',').map(f => f.trim().toLowerCase()).includes(featureKey.toLowerCase())) ||
        (plan.features_list && Array.isArray(plan.features_list) && plan.features_list.map(f => f.toLowerCase()).includes(featureKey.toLowerCase()));

      if (!isFeatureEnabled) {
        return next(ApiError.forbidden(`Your active plan "${plan.title}" does not support the "${featureKey}" feature. Please upgrade your subscription.`));
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

      // 1. Fetch active subscription
      const activeSub = await UserSubscription.findOne({
        user_id: userId.toString(),
        status: 'active',
        is_deleted: { $ne: true }
      });

      let limit = FREE_LIMITS[limitType] || 0;
      let planName = 'Free Member';

      if (activeSub) {
        const plan = await SubscriptionPlan.findById(activeSub.plan_id).lean();
        if (plan) {
          planName = plan.title;
          if (limitType === 'listings') {
            limit = plan.product_limit !== undefined ? plan.product_limit : plan.max_listings;
          } else if (limitType === 'reels') {
            limit = plan.reels_limit;
          } else if (limitType === 'leads') {
            limit = plan.leads_limit;
          }
        }
      }

      // If limit is null or undefined (for premium plans), it means unlimited access
      if (activeSub && (limit === null || limit === undefined)) {
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

      // Determine role context from URL path
      const fullPath = (req.baseUrl || '') + (req.path || '');
      const role = fullPath.includes('vendor') ? 'vendor' : 'creator';

      // Find the active subscription for this specific role
      const activeSub = await UserSubscription.findOne({
        user_id: userId.toString(),
        user_role: role,
        status: 'active',
        is_deleted: { $ne: true },
      });

      if (!activeSub) {
        return next(ApiError.forbidden(
          `Access denied. Feature "${featureKey}" requires an active ${role} subscription.`
        ));
      }

      // Fetch the plan and verify the feature
      const plan = await SubscriptionPlan.findById(activeSub.plan_id).lean();
      if (!plan) {
        return next(ApiError.forbidden('Your active subscription plan was not found.'));
      }

      const isEnabled =
        plan[featureKey] === true ||
        (Array.isArray(plan.features_list) && plan.features_list.map(f => f.toLowerCase()).includes(featureKey.toLowerCase())) ||
        (typeof plan.features === 'string' && plan.features.split(',').map(f => f.trim().toLowerCase()).includes(featureKey.toLowerCase()));

      if (!isEnabled) {
        return next(ApiError.forbidden(
          `Feature "${featureKey}" is not enabled on your ${plan.title} plan. Please upgrade.`
        ));
      }

      // Attach subscription context for downstream use
      req.activeSubscription = activeSub;
      req.activeRole = role;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  requireSubscriptionFeature,
  checkSubscriptionLimit,
  checkFeature,
};
