const express = require('express');
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Wallet & Subscriptions Routes — /api/v1/wallet
 */

router.get('/', authenticate, walletController.getWallet);
router.get('/me', authenticate, walletController.getWallet);
router.post('/recharge', authenticate, walletController.recharge);
router.get('/transactions', authenticate, walletController.getTransactions);
router.post('/subscribe', authenticate, walletController.purchaseSubscription);

module.exports = router;
