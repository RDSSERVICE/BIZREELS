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
router.get('/boosts', authenticate, (req, res) => {
  res.json({
    success: true,
    active: [
      { id: 'b1', reelTitle: 'Hot Summer Fashion Collection', plan: 'Gold Boost (7 Days)', remainingDays: 5, status: 'Active', cost: 1499 }
    ]
  });
});

// Vendor dashboard & analytics
router.get('/vendor/dashboard', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      totalSales: 184500,
      totalOrders: 42,
      activeListings: 18,
      leadEnquiries: 29,
      walletBalance: req.user?.walletBalance || 4850,
      rating: 4.8
    }
  });
});

router.get('/vendor/analytics', authenticate, (req, res) => {
  res.json({
    success: true,
    reelViews: 128450,
    productViews: 45210,
    serviceViews: 18900,
    offerClicks: 6420,
    phoneCalls: 890,
    whatsappClicks: 1420,
    profileVisits: 12800,
    followers: 3890
  });
});

// Creator Studio endpoints
router.get('/creator/dashboard', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      totalProjects: 18,
      pendingRequests: 3,
      totalEarnings: req.user?.walletBalance || 42500,
      rating: 4.9,
      reviewCount: 24,
      portfolioViews: 8920
    }
  });
});

router.get('/creator/portfolio', authenticate, (req, res) => {
  res.json({
    success: true,
    reels: [
      { id: '1', title: 'Fashion Brand Commercial Reel', views: '45.2K', url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-neon-room-41566-large.mp4' },
      { id: '2', title: 'Smart Watch Unboxing Video Ad', views: '28.9K', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-with-green-screen-41548-large.mp4' }
    ],
    images: [
      { id: '1', title: 'Jewellery Model Photoshoot', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80' },
      { id: '2', title: 'Furniture Store Ad Shoot', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' }
    ]
  });
});

router.post('/creator/portfolio/reels', authenticate, (req, res) => {
  res.json({ success: true, message: 'Sample reel added' });
});

router.post('/creator/portfolio/images', authenticate, (req, res) => {
  res.json({ success: true, message: 'Portfolio image added' });
});

router.delete('/creator/portfolio/:type/:id', authenticate, (req, res) => {
  res.json({ success: true, message: 'Item deleted' });
});

router.get('/creator/pricing', authenticate, (req, res) => {
  res.json({
    success: true,
    reel1: 500,
    reel3: 1200,
    reel10: 3500,
    hourlyRate: 1000,
    dayRate: 6000
  });
});

router.patch('/creator/pricing', authenticate, (req, res) => {
  res.json({ success: true, message: 'Pricing updated' });
});

router.get('/creator/availability', authenticate, (req, res) => {
  res.json({
    success: true,
    status: 'Available'
  });
});

router.patch('/creator/availability', authenticate, (req, res) => {
  res.json({ success: true, message: 'Availability updated' });
});

router.get('/creator/orders', authenticate, (req, res) => {
  res.json({
    success: true,
    orders: [
      { id: 'c-1', vendor: 'Trends Fashion Store', project: '3 Promo Reels Shoot', amount: 3500, date: '2026-07-15', status: 'Completed' },
      { id: 'c-2', vendor: 'Sony Center Bandra', project: 'OLED TV Video Commercial', amount: 5000, date: '2026-07-10', status: 'Completed' }
    ]
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
