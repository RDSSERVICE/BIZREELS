const express = require('express');
const referralController = require('../controllers/referral.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * Referral Routes — /api/v1/referrals
 */

// Vendor referral dashboard (code, link, stats, history)
router.get('/me', authenticate, referralController.getDashboard);
router.get('/dashboard', authenticate, referralController.getDashboard);

// Get shareable referral link
router.get('/link', authenticate, referralController.getLink);

// List my referrals
router.get('/list', authenticate, referralController.getMyReferrals);

// Get referral code only
router.get('/code', authenticate, referralController.getCode);

// ── Admin Endpoints (Admin-Only) ──────────────────────────
router.get('/admin/analytics', authenticate, authorize('admin'), referralController.adminGetAnalytics);
router.get('/admin/list', authenticate, authorize('admin'), referralController.adminListReferrals);
router.post('/admin/status', authenticate, authorize('admin'), referralController.adminUpdateStatus);
router.get('/admin/config', authenticate, authorize('admin'), referralController.adminGetConfig);
router.post('/admin/config', authenticate, authorize('admin'), referralController.adminUpdateConfig);

// Backward compatibility: GET /referrals
router.get('/', authenticate, referralController.getDashboard);

module.exports = router;
