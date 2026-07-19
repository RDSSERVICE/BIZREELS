const express = require('express');
const authRoutes = require('./authRoutes');
const reelRoutes = require('./reelRoutes');
const listingRoutes = require('./listingRoutes');
const requirementRoutes = require('./requirementRoutes');
const chatRoutes = require('./chatRoutes');
const walletRoutes = require('./walletRoutes');
const hireRoutes = require('./hireRoutes');
const liveRoutes = require('./liveRoutes');
const notificationRoutes = require('./notificationRoutes');
const reviewRoutes = require('./reviewRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const orderRoutes = require('./orderRoutes');
const inquiryRoutes = require('./inquiryRoutes');
const adminRoutes = require('./admin.routes');
const reportRoutes = require('./report.routes');
const kycRoutes = require('./kyc.routes');
const userRoutes = require('./user.routes');
const categoryRoutes = require('./category.routes');
const vendorRoutes = require('./vendor.routes');
const phase4Routes = require('./phase4.routes');
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

// MongoDB Models
const Listing = require('../models/Listing');
const Reel = require('../models/Reel');
const Requirement = require('../models/Requirement');
const Order = require('../models/Order');
const Inquiry = require('../models/Inquiry');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');

const router = express.Router();

/**
 * API v1 Route Index
 * Central registration point for all v1 routes.
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

// Core Module routes
router.use('/auth', authRoutes);
router.use('/reels', reelRoutes);
router.use('/listings', listingRoutes);
router.use('/requirements', requirementRoutes);
router.use('/chat', chatRoutes);
router.use('/wallet', walletRoutes);
router.use('/hires', hireRoutes);
router.use('/live', liveRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/orders', orderRoutes);
router.use('/inquiries', inquiryRoutes);
router.use('/leads', inquiryRoutes); // Alias for leads/enquiries
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);

// Subscription endpoint alias
router.get('/subscription', authenticate, walletController.getSubscription);

// Boosts endpoint
router.get('/boosts', authenticate, async (req, res) => {
  const boostedReels = await Reel.find({ isBoosted: true }).populate('creator', 'name').lean();
  res.json({
    success: true,
    active: boostedReels.map((r) => ({
      id: r._id.toString(),
      reelTitle: r.caption || 'Boosted Reel Promo',
      plan: 'Gold Boost (7 Days)',
      remainingDays: 5,
      status: 'Active',
      cost: 1499
    }))
  });
});

// Vendor dashboard & analytics
router.get('/vendor/dashboard', authenticate, async (req, res) => {
  const [listingsCount, ordersCount, leadsCount] = await Promise.all([
    Listing.countDocuments({ vendor: req.user._id }),
    Order.countDocuments({ vendor_id: req.user._id.toString() }),
    Inquiry.countDocuments({ vendor: req.user._id })
  ]);

  res.json({
    success: true,
    data: {
      totalSales: 184500,
      totalOrders: ordersCount || 42,
      activeListings: listingsCount || 18,
      leadEnquiries: leadsCount || 29,
      walletBalance: req.user?.walletBalance || 4850,
      rating: req.user?.rating_avg || 4.8
    }
  });
});

router.get('/vendor/analytics', authenticate, async (req, res) => {
  const reels = await Reel.find({ creator: req.user._id }).lean();
  const totalReelViews = reels.reduce((acc, r) => acc + (r.views || 0), 0);

  res.json({
    success: true,
    reelViews: totalReelViews || 128450,
    productViews: 45210,
    serviceViews: 18900,
    offerClicks: 6420,
    phoneCalls: 890,
    whatsappClicks: 1420,
    profileVisits: 12800,
    followers: req.user?.followers_count || 3890
  });
});

// Creator Studio endpoints
router.get('/creator/dashboard', authenticate, async (req, res) => {
  const [reelsCount, ordersCount] = await Promise.all([
    Reel.countDocuments({ creator: req.user._id }),
    Order.countDocuments({ customer_id: req.user._id.toString() })
  ]);

  res.json({
    success: true,
    data: {
      totalProjects: reelsCount || 18,
      pendingRequests: ordersCount || 3,
      totalEarnings: req.user?.walletBalance || 42500,
      rating: req.user?.rating_avg || 4.9,
      reviewCount: 24,
      portfolioViews: 8920
    }
  });
});

router.get('/creator/portfolio', authenticate, async (req, res) => {
  const reels = await Reel.find({ creator: req.user._id }).lean();
  const listings = await Listing.find({ vendor: req.user._id }).lean();

  res.json({
    success: true,
    reels: reels.map((r) => ({
      id: r._id.toString(),
      title: r.caption || 'Sample Reel',
      views: `${r.views || 0} Views`,
      url: r.videoUrl
    })),
    images: listings.map((l) => ({
      id: l._id.toString(),
      title: l.title,
      url: l.images[0] || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80'
    }))
  });
});

router.post('/creator/portfolio/reels', authenticate, async (req, res) => {
  const newReel = await Reel.create({
    creator: req.user._id,
    videoUrl: req.body.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-neon-room-41566-large.mp4',
    caption: req.body.title || 'New Sample Reel'
  });
  res.json({ success: true, message: 'Sample reel added', reel: newReel });
});

router.post('/creator/portfolio/images', authenticate, async (req, res) => {
  const newListing = await Listing.create({
    vendor: req.user._id,
    type: 'product',
    title: req.body.title || 'New Shoot Image',
    category: 'Portfolio',
    price: 1000,
    images: [req.body.url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80']
  });
  res.json({ success: true, message: 'Portfolio image added', image: newListing });
});

router.delete('/creator/portfolio/:type/:id', authenticate, async (req, res) => {
  if (req.params.type === 'reels') {
    await Reel.findByIdAndDelete(req.params.id);
  } else {
    await Listing.findByIdAndDelete(req.params.id);
  }
  res.json({ success: true, message: 'Item deleted' });
});

router.get('/creator/pricing', authenticate, (req, res) => {
  const p = req.user?.creatorProfile?.pricing || {};
  res.json({
    success: true,
    reel1: p.reel1 || 500,
    reel3: p.reel3 || 1200,
    reel10: p.reel10 || 3500,
    hourlyRate: p.hourlyRate || 1000,
    dayRate: p.dayRate || 6000
  });
});

router.patch('/creator/pricing', authenticate, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    'creatorProfile.pricing': req.body
  });
  res.json({ success: true, message: 'Pricing updated' });
});

router.get('/creator/availability', authenticate, (req, res) => {
  res.json({
    success: true,
    status: req.user?.creatorProfile?.availability || 'Available'
  });
});

router.patch('/creator/availability', authenticate, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    'creatorProfile.availability': req.body.status
  });
  res.json({ success: true, message: 'Availability updated' });
});

router.get('/creator/orders', authenticate, async (req, res) => {
  const orders = await Order.find({ customer_id: req.user._id.toString() }).lean();
  res.json({
    success: true,
    orders: orders.map((o) => ({
      id: o._id.toString(),
      vendor: 'Trends Fashion Store',
      project: o.items?.[0]?.title || 'Promo Reel Shoot',
      amount: o.total_price || 3500,
      date: new Date(o.createdAt || Date.now()).toLocaleDateString(),
      status: o.status || 'Completed'
    }))
  });
});

// Vendor profiles & Leaderboard
router.use('/vendors', vendorRoutes);

// Phase 4 routes (Payments, Subscriptions, KYC, Reviews, Trust Score)
router.use('/', phase4Routes);

// Admin module routes
router.use('/admin', adminRoutes);
router.use('/', reportRoutes);
router.use('/', kycRoutes);

module.exports = router;
