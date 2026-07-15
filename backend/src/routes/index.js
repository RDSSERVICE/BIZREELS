const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const categoryRoutes = require('./category.routes');
const listingRoutes = require('./listing.routes');
const mediaRoutes = require('./media.routes');
const feedRoutes = require('./feed.routes');
const followRoutes = require('./follow.routes');
const interactionRoutes = require('./interaction.routes');
const searchRoutes = require('./search.routes');
const locationRoutes = require('./location.routes');
const seoRoutes = require('./seo.routes');
const vendorRoutes = require('./vendor.routes');
const requirementRoutes = require('./requirement.routes');
const chatRoutes = require('./chat.routes');
const phase4Routes = require('./phase4.routes');
const reportRoutes = require('./report.routes');
const adminRoutes = require('./admin.routes');
const analyticsRoutes = require('./analytics.routes');
const referralRoutes = require('./referral.routes');
const onboardingRoutes = require('./onboarding.routes');
const aiRoutes = require('./ai.routes');
const identityRoutes = require('./identity.routes');
const cartRoutes = require('./cart.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/listings', listingRoutes);
router.use('/media', mediaRoutes);
router.use('/feed', feedRoutes);
router.use('/follows', followRoutes);
router.use('/search', searchRoutes);
router.use('/seo', seoRoutes);
router.use('/vendors', vendorRoutes);
router.use('/kyc', identityRoutes);
router.use('/cart', cartRoutes);
router.use('/admin', adminRoutes);
router.use('/vendor/analytics', analyticsRoutes);
router.use('/users/me/referrals', referralRoutes);
router.use('/users/me/onboarding-checklist', onboardingRoutes);
router.use('/ai', aiRoutes);

// Root level routers under v1 prefix
router.use('/', chatRoutes);
router.use('/', requirementRoutes);
router.use('/', phase4Routes);
router.use('/', reportRoutes);
router.use('/', interactionRoutes);
router.use('/utils', locationRoutes);

module.exports = router;
