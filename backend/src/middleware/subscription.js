const UserSubscription = require('../models/UserSubscription.model');
const { SubscriptionPlan } = require('../models/Admin');
const ApiError = require('../utils/ApiError');
const Listing = require('../models/Listing');
const Reel = require('../models/Reel');

/**
 * Standard Free Tier Limits for users without an active paid subscription
 */
const FREE_LIMITS = {
  listings: 5,
  products: 5,
  services: 3,
  reels: 5,
  leads: 3,
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
        is_deleted: { $ne: true },
      });

      if (!activeSub) {
        return next(
          ApiError.forbidden(
            `Feature "${featureKey}" requires an active premium subscription. Please upgrade your plan.`
          )
        );
      }

      // 2. Fetch the plan details
      const plan = await SubscriptionPlan.findById(activeSub.plan_id).lean();
      if (!plan) {
        return next(
          ApiError.forbidden('Subscription plan not found or inactive. Please upgrade.')
        );
      }

      // Check if feature flag or add-on enables this feature
      const hasFeature =
        Boolean(plan[featureKey]) ||
        Boolean(plan.features_list?.includes(featureKey)) ||
        Boolean(activeSub.selected_addons?.some((a) => a.quota_type === featureKey));

      if (!hasFeature) {
        return next(
          ApiError.forbidden(
            `Your current plan "${plan.title}" does not include "${featureKey}". Please upgrade your subscription.`
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Checks if the user has reached their plan capacity limits (incorporating Base Plan + Selected Add-Ons).
 */
const checkSubscriptionLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required.');
      }

      // 1. Fetch active subscription for user
      const activeSub = await UserSubscription.findOne({
        user_id: userId.toString(),
        status: 'active',
        is_deleted: { $ne: true },
      });

      let limit = FREE_LIMITS[limitType] ?? 5;
      let planName = 'Free Member';

      if (activeSub) {
        const plan = await SubscriptionPlan.findById(activeSub.plan_id).lean();
        if (plan) {
          planName = plan.title;
          if (limitType === 'listings' || limitType === 'products') {
            limit = plan.product_limit !== undefined && plan.product_limit !== null
              ? plan.product_limit
              : (plan.max_listings ?? FREE_LIMITS.listings);
          } else if (limitType === 'reels') {
            limit = plan.reels_limit !== undefined && plan.reels_limit !== null
              ? plan.reels_limit
              : FREE_LIMITS.reels;
          } else if (limitType === 'leads') {
            limit = plan.leads_limit !== undefined && plan.leads_limit !== null
              ? plan.leads_limit
              : FREE_LIMITS.leads;
          } else if (limitType === 'services') {
            limit = plan.service_limit !== undefined && plan.service_limit !== null
              ? plan.service_limit
              : FREE_LIMITS.services;
          }
        }

        // Add bonus capacity from purchased add-ons
        if (Array.isArray(activeSub.selected_addons)) {
          const quotaKey = limitType === 'listings' ? 'product_limit' : `${limitType}_limit`;
          const addonBonus = activeSub.selected_addons
            .filter((a) => a.quota_type === quotaKey || a.quota_type === limitType)
            .reduce((sum, a) => sum + (Number(a.quota_value) || 0), 0);
          if (addonBonus > 0 && limit !== null) {
            limit += addonBonus;
          }
        }
      }

      // Null or negative indicates unlimited
      if (limit === null || limit === undefined || limit < 0) {
        return next();
      }

      // 2. Count existing active records
      let currentCount = 0;
      if (limitType === 'listings' || limitType === 'products') {
        currentCount = await Listing.countDocuments({
          vendor: userId,
          isDeleted: { $ne: true },
        });
      } else if (limitType === 'reels') {
        currentCount = await Reel.countDocuments({
          creator: userId,
          isDeleted: { $ne: true },
        });
      }

      // 3. Prevent creation if limit reached
      if (currentCount >= limit) {
        return next(
          ApiError.forbidden(
            `Upload limit reached. Your current plan "${planName}" allows up to ${limit} ${limitType} (Current: ${currentCount}). Please upgrade your subscription or purchase an add-on.`
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Dynamic feature permission middleware (role-aware).
 */
const checkFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(ApiError.unauthorized('Authentication required.'));
      }

      // Dynamic role resolution
      let role = 'vendor';
      if (req.baseUrl && req.baseUrl.includes('/creator')) {
        role = 'creator';
      }

      const activeSub = await UserSubscription.findOne({
        user_id: userId.toString(),
        $or: [{ user_role: role }, { role: role }],
        status: 'active',
        is_deleted: { $ne: true },
      });

      if (!activeSub) {
        return next(
          ApiError.forbidden(
            `Access to "${featureKey}" requires an active ${role} subscription plan.`
          )
        );
      }

      const plan = await SubscriptionPlan.findById(activeSub.plan_id).lean();
      if (!plan || !plan[featureKey]) {
        const hasAddon = activeSub.selected_addons?.some((a) => a.quota_type === featureKey);
        if (!hasAddon) {
          return next(
            ApiError.forbidden(
              `Feature "${featureKey}" is not enabled in your current plan "${plan?.title || 'Current'}".`
            )
          );
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  FREE_LIMITS,
  requireSubscriptionFeature,
  checkSubscriptionLimit,
  checkFeature,
};
