const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Lazy loading wrapper middleware.
 * Requires the target router module dynamically on the first request.
 */
const lazyLoad = (modulePath) => {
  let routerModule;
  return (req, res, next) => {
    if (!routerModule) {
      routerModule = require(modulePath);
    }
    routerModule(req, res, next);
  };
};

/**
 * API v1 Route Index
 * Central registration point for all v1 routes (lazy loaded for fast server startup).
 */

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BizReels API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Core Module routes (lazy loaded)
router.use('/upload', lazyLoad('./upload.routes'));
router.use('/media', lazyLoad('./media.routes'));
router.use('/cart', lazyLoad('./cart.routes'));
router.use('/ai', lazyLoad('./ai.routes'));
router.use('/auth', lazyLoad('./authRoutes'));
router.use('/reels', lazyLoad('./reelRoutes'));
router.use('/listings', lazyLoad('./listingRoutes'));
router.use('/requirements', lazyLoad('./requirementRoutes'));
router.use('/chat', lazyLoad('./chatRoutes'));
router.use('/wallet', lazyLoad('./walletRoutes'));
router.use('/hires', lazyLoad('./hireRoutes'));
router.use('/live', lazyLoad('./liveRoutes'));
router.use('/notifications', lazyLoad('./notificationRoutes'));
router.use('/offers', lazyLoad('./offer.routes'));
router.use('/reviews', lazyLoad('./reviewRoutes'));
router.use('/analytics', lazyLoad('./analyticsRoutes'));
router.use('/orders', lazyLoad('./orderRoutes'));
router.use('/inquiries', lazyLoad('./inquiryRoutes'));
router.use('/leads', lazyLoad('./inquiryRoutes')); // Alias for leads/enquiries
router.use('/users', lazyLoad('./user.routes'));
router.use('/categories', lazyLoad('./category.routes'));
router.use('/creator-marketplace', lazyLoad('./creatorMarketplaceRoutes'));

// Referrals endpoint alias for backward compatibility (lazy loaded controller)
router.get(['/users/me/referrals', '/users/me/referrals/'], authenticate, (req, res, next) => {
  require('../controllers/referral.controller').getDashboard(req, res, next);
});

// Subscription endpoint alias (lazy loaded controller)
router.get('/subscription', authenticate, (req, res, next) => {
  require('../controllers/walletController').getSubscription(req, res, next);
});
router.get('/subscription/plans', authenticate, (req, res, next) => {
  require('../controllers/walletController').getPlans(req, res, next);
});
router.post('/subscription/change', authenticate, (req, res, next) => {
  require('../controllers/walletController').purchaseSubscription(req, res, next);
});

// Direct Razorpay subscription purchase (creates Razorpay order)
router.post('/subscription/purchase-razorpay', authenticate, async (req, res, next) => {
  try {
    const { plan_id } = req.body;
    if (!plan_id) {
      return res.status(400).json({ success: false, message: 'plan_id is required' });
    }

    const { SubscriptionPlan } = require('../models/Admin');
    const mongoose = require('mongoose');
    let planDoc = null;
    if (mongoose.Types.ObjectId.isValid(plan_id)) {
      planDoc = await SubscriptionPlan.findById(plan_id).lean();
    }
    if (!planDoc) {
      planDoc = await SubscriptionPlan.findOne({
        title: { $regex: new RegExp(`^${plan_id}$`, 'i') },
        is_deleted: { $ne: true },
        is_active: true,
      }).lean();
    }
    if (!planDoc) {
      return res.status(400).json({ success: false, message: `Plan not found: "${plan_id}"` });
    }

    const amountPaise = Math.round(planDoc.price_inr * 100);
    const paymentService = require('../services/payment.service');
    const result = await paymentService.createPaymentOrder(
      req.user._id.toString(),
      'subscription_plan',
      amountPaise,
      planDoc._id.toString()
    );

    return res.json({
      success: true,
      data: {
        ...result,
        plan_id: planDoc._id.toString(),
        plan_title: planDoc.title,
        amount_inr: planDoc.price_inr,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Boosts endpoint (lazy loaded controller)
router.get('/boosts', authenticate, (req, res, next) => {
  require('../controllers/vendorController').getBoosts(req, res, next);
});

// Vendor Portal endpoints (lazy loaded controller)
router.get('/vendor/dashboard', authenticate, (req, res, next) => {
  require('../controllers/vendorController').getDashboard(req, res, next);
});
router.get('/vendor/analytics', authenticate, (req, res, next) => {
  require('../controllers/vendorController').getAnalytics(req, res, next);
});

router.use('/vendors', lazyLoad('./vendor.routes'));

// Creator Studio endpoints
router.use('/creator', lazyLoad('./creator.routes'));

// Phase 4 routes (Payments, Subscriptions, KYC, Reviews, Trust Score)
router.use('/', lazyLoad('./phase4.routes'));
router.use('/', lazyLoad('./interaction.routes'));
router.use('/follow', lazyLoad('./follow.routes'));
router.use('/follows', lazyLoad('./follow.routes'));
router.use('/subscriptions', lazyLoad('./subscription.routes'));
router.use('/referrals', lazyLoad('./referral.routes'));

// Admin module routes
router.use('/admin', lazyLoad('./admin.routes'));
router.use('/', lazyLoad('./report.routes'));
router.use('/', lazyLoad('./kyc.routes'));

module.exports = router;
