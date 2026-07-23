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
const creatorRoutes = require('./creator.routes');
const phase4Routes = require('./phase4.routes');
const interactionRoutes = require('./interaction.routes');
const followRoutes = require('./follow.routes');
const walletController = require('../controllers/walletController');
const vendorController = require('../controllers/vendorController');
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

const uploadRoutes = require('./upload.routes');

// Core Module routes
router.use('/upload', uploadRoutes);
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
router.get('/boosts', authenticate, vendorController.getBoosts);

// Vendor Portal endpoints
router.get('/vendor/dashboard', authenticate, vendorController.getDashboard);
router.get('/vendor/analytics', authenticate, vendorController.getAnalytics);
router.use('/vendors', vendorRoutes);

// Creator Studio endpoints
router.use('/creator', creatorRoutes);

// Phase 4 routes (Payments, Subscriptions, KYC, Reviews, Trust Score)
router.use('/', phase4Routes);
router.use('/', interactionRoutes);
router.use('/follow', followRoutes);
router.use('/follows', followRoutes);


// Admin module routes
router.use('/admin', adminRoutes);
router.use('/', reportRoutes);
router.use('/', kycRoutes);

module.exports = router;
