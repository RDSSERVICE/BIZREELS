const express = require('express');
const authRoutes = require('./authRoutes');
const reelRoutes = require('./reelRoutes');

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

// Auth routes
router.use('/auth', authRoutes);
router.use('/reels', reelRoutes);

// Future route modules will be added here:
// router.use('/users', userRoutes);
// router.use('/reels', reelRoutes);
// router.use('/products', productRoutes);
// router.use('/services', serviceRoutes);
// router.use('/requirements', requirementRoutes);
// router.use('/chat', chatRoutes);
// router.use('/wallet', walletRoutes);
// router.use('/subscriptions', subscriptionRoutes);
// router.use('/search', searchRoutes);
// router.use('/admin', adminRoutes);

module.exports = router;
