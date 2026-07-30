const express = require('express');
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Subscription Routes — /api/v1/subscriptions
 */

router.get('/me', authenticate, subscriptionController.getMySubscription);
router.get('/plans', authenticate, subscriptionController.getPlans);
router.post('/purchase', authenticate, subscriptionController.purchaseSubscription);
router.post('/cancel', authenticate, subscriptionController.cancelSubscription);
router.get('/history', authenticate, subscriptionController.getHistory);
router.post('/upgrade', authenticate, subscriptionController.upgradeSubscription);
router.post('/downgrade', authenticate, subscriptionController.downgradeSubscription);

module.exports = router;
