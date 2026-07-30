const express = require('express');
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Wallet Routes — /api/v1/wallet
 */

router.get('/', authenticate, walletController.getWallet);
router.get('/me', authenticate, walletController.getWallet);
router.get('/balance', authenticate, walletController.getBalance);
router.post('/recharge', authenticate, walletController.recharge);
router.get('/transactions', authenticate, walletController.getTransactions);
router.post('/subscribe', authenticate, walletController.purchaseSubscription);
router.post('/payout', authenticate, walletController.requestPayout);

module.exports = router;
