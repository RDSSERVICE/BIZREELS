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

// Auth & Core Module routes
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

module.exports = router;
