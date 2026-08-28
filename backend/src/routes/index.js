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

const keepAliveService = require('../services/keepalive.service');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BizReels API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Render Keep-Alive status & auto-wake status route
router.get(['/keep-alive', '/keepalive'], (req, res) => {
  const status = keepAliveService.getKeepAliveStatus();
  res.status(200).json({
    success: true,
    message: 'Render 24/7 keep-alive active (auto self-pinging every 30s)',
    data: status,
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
router.use('/feed', lazyLoad('./feed.routes'));
router.use('/requirements', lazyLoad('./requirementRoutes'));
router.use('/chat', lazyLoad('./chatRoutes'));
router.use('/wallet', lazyLoad('./walletRoutes'));
router.use('/transactions', lazyLoad('./transaction.routes'));
router.use('/hires', lazyLoad('./hireRoutes'));
router.use('/live', lazyLoad('./liveRoutes'));
router.use('/notifications', lazyLoad('./notificationRoutes'));
router.use('/offers', lazyLoad('./offer.routes'));
router.use('/reviews', lazyLoad('./reviewRoutes'));
router.use('/analytics', lazyLoad('./analyticsRoutes'));
router.use('/orders', lazyLoad('./orderRoutes'));
router.use('/vendor-orders', lazyLoad('./orderRoutes'));
router.use('/inquiries', lazyLoad('./inquiryRoutes'));
router.use('/leads', lazyLoad('./inquiryRoutes')); // Alias for leads/enquiries
router.use('/users', lazyLoad('./user.routes'));
router.use('/categories', lazyLoad('./category.routes'));
router.use('/creator-marketplace', lazyLoad('./creatorMarketplaceRoutes'));
router.use('/location', lazyLoad('./location.routes'));
router.use('/search', lazyLoad('./search.routes'));
router.use('/seo', lazyLoad('./seo.routes'));
router.use('/', lazyLoad('./seo.routes'));
router.use('/identity', lazyLoad('./identity.routes'));
router.use('/onboarding', lazyLoad('./onboarding.routes'));

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
    const { plan_id, selected_addons = [] } = req.body;
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

    // Prevent duplicate subscription purchase if no add-ons and already on same plan
    const UserSubscription = require('../models/UserSubscription.model');
    const activeSub = await UserSubscription.findOne({
      user_id: req.user._id.toString(),
      status: 'active',
      is_deleted: { $ne: true }
    });

    if (activeSub && activeSub.plan_id === planDoc._id.toString() && (!selected_addons || selected_addons.length === 0)) {
      return res.status(400).json({
        success: false,
        message: `You already have an active subscription for the "${planDoc.title}" plan.`
      });
    }

    // Validate and calculate add-ons total
    let validatedAddons = [];
    let addonsTotal = 0;
    if (Array.isArray(selected_addons) && selected_addons.length > 0) {
      const planAddons = planDoc.add_ons || [];
      for (const reqAddon of selected_addons) {
        const matched = planAddons.find(a => a.id === reqAddon.id || a.title?.toLowerCase() === reqAddon.title?.toLowerCase());
        if (matched) {
          const addonPrice = Number(matched.price_inr || 0);
          addonsTotal += addonPrice;
          validatedAddons.push({
            id: matched.id,
            title: matched.title,
            price_inr: addonPrice,
            quota_type: matched.quota_type,
            quota_value: matched.quota_value,
          });
        } else if (reqAddon.title && Number(reqAddon.price_inr) > 0) {
          const addonPrice = Number(reqAddon.price_inr);
          addonsTotal += addonPrice;
          validatedAddons.push({
            id: reqAddon.id || `addon_${Date.now()}`,
            title: reqAddon.title,
            price_inr: addonPrice,
            quota_type: reqAddon.quota_type || 'custom',
            quota_value: reqAddon.quota_value || 0,
          });
        }
      }
    }

    const totalInr = Math.max(0, planDoc.price_inr + addonsTotal);
    const amountPaise = Math.round(totalInr * 100);
    const paymentService = require('../services/payment.service');
    const result = await paymentService.createPaymentOrder(
      req.user._id.toString(),
      'subscription_plan',
      amountPaise,
      planDoc._id.toString(),
      {
        plan_id: planDoc._id.toString(),
        selected_addons: validatedAddons,
        base_price_inr: planDoc.price_inr,
        addons_total_inr: addonsTotal,
      }
    );

    return res.json({
      success: true,
      data: {
        ...result,
        plan_id: planDoc._id.toString(),
        plan_title: planDoc.title,
        base_price_inr: planDoc.price_inr,
        addons_total_inr: addonsTotal,
        amount_inr: totalInr,
        selected_addons: validatedAddons,
      },
    });
  } catch (err) {
    next(err);
  }
});

// NOTE: Boost endpoints removed — boost system deprecated in favor of subscriptions

// Vendor Portal endpoints (lazy loaded controller)
router.get('/vendor/dashboard', authenticate, (req, res, next) => {
  require('../controllers/vendorController').getDashboard(req, res, next);
});
router.get('/vendor/analytics/overview', authenticate, (req, res, next) => {
  require('../controllers/vendorController').getAnalyticsOverview(req, res, next);
});
router.get('/vendor/analytics/listings', authenticate, (req, res, next) => {
  require('../controllers/vendorController').getAnalyticsListings(req, res, next);
});
router.get('/vendor/analytics/timeseries', authenticate, (req, res, next) => {
  require('../controllers/vendorController').getAnalyticsTimeseries(req, res, next);
});
router.get('/vendor/analytics/boost-roi', authenticate, (req, res, next) => {
  require('../controllers/vendorController').getAnalyticsBoostRoi(req, res, next);
});
router.post('/vendor/analytics/simulate', authenticate, (req, res, next) => {
  require('../controllers/vendorController').simulateAnalyticsData(req, res, next);
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
// Web Landing & OpenGraph Share Preview for Shared Reels
router.get(['/reels/:id', '/reels/share/:id'], async (req, res) => {
  try {
    const reelRepo = require('../repositories/reelRepository');
    const reel = await reelRepo.findReelById(req.params.id);
    if (!reel) {
      return res.status(404).send('<h1 style="color:#fff;background:#000;padding:40px;text-align:center;">Reel Not Found</h1>');
    }

    const title = reel.caption ? `${reel.caption.slice(0, 60)} | BIZREELS` : 'Watch Reel on BIZREELS';
    const videoUrl = reel.videoUrl || '';
    let thumbnailUrl = reel.thumbnailUrl || '';
    if (!thumbnailUrl && videoUrl) {
      if (videoUrl.includes('cloudinary.com')) {
        thumbnailUrl = videoUrl
          .replace(/\/video\/upload\//, '/video/upload/so_0.5,w_1080,h_1920,c_fill,q_auto,f_jpg/')
          .replace(/\.[^/.]+$/, '.jpg');
      } else {
        thumbnailUrl = videoUrl.replace(/\.[^/.]+$/, '.jpg');
      }
    }
    const creatorName = reel.creator?.name || 'BIZREELS Creator';
    const appDeepLink = `bizreels://reels/${reel._id}`;
    const webUrl = `${req.protocol}://${req.get('host')}/reels/${reel._id}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>

  <!-- OpenGraph / WhatsApp Instagram-style Preview Meta Tags -->
  <meta property="og:site_name" content="BIZREELS">
  <meta property="og:type" content="video.other">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="Watch this reel by ${creatorName} on BIZREELS!">
  <meta property="og:image" content="${thumbnailUrl}">
  <meta property="og:image:secure_url" content="${thumbnailUrl}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1080">
  <meta property="og:image:height" content="1920">
  <meta property="og:image:alt" content="${title}">
  <meta property="og:video" content="${videoUrl}">
  <meta property="og:video:secure_url" content="${videoUrl}">
  <meta property="og:video:type" content="video/mp4">
  <meta property="og:video:width" content="1080">
  <meta property="og:video:height" content="1920">
  <meta property="og:url" content="${webUrl}">

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@BIZREELS">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="Watch this reel by ${creatorName} on BIZREELS!">
  <meta name="twitter:image" content="${thumbnailUrl}">

  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f0f12;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .card {
      max-width: 420px;
      width: 90%;
      background-color: #18181c;
      border: 1px solid #2d2d36;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    video {
      width: 100%;
      max-height: 480px;
      object-fit: cover;
      background: #000;
    }
    .info {
      padding: 16px;
    }
    .creator {
      font-weight: 800;
      color: #f59e0b;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .caption {
      font-size: 15px;
      margin: 8px 0 16px;
      line-height: 1.4;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 14px 0;
      background-color: #f59e0b;
      color: #0f0f12;
      font-weight: 900;
      text-decoration: none;
      border-radius: 8px;
      font-size: 14px;
      letter-spacing: 1px;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div class="card">
    <video src="${videoUrl}" poster="${thumbnailUrl}" controls autoplay muted playsinline></video>
    <div class="info">
      <div class="creator">BY ${creatorName.toUpperCase()}</div>
      <div class="caption">${reel.caption || 'Check out this reel on BIZREELS!'}</div>
      <a href="${appDeepLink}" class="btn">OPEN IN BIZREELS APP</a>
    </div>
  </div>
</body>
</html>`;

    res.header('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
