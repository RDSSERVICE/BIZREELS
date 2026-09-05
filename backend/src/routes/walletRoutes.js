const express = require('express');
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');
const { roleMiddleware } = require('../middleware/role');
const walletService = require('../services/wallet.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * Wallet Routes — /api/v1/wallet
 */

// ─── Existing unified wallet endpoints (backward compat) ────
router.get('/', authenticate, walletController.getWallet);
router.get('/me', authenticate, walletController.getWallet);
router.get('/balance', authenticate, walletController.getBalance);
router.post('/recharge', authenticate, walletController.recharge);
router.get('/transactions', authenticate, walletController.getTransactions);
router.get('/topup-packs', walletController.getTopupPacks);
router.post('/subscribe', authenticate, walletController.purchaseSubscription);
router.post('/payout', authenticate, walletController.requestPayout);

// ─── Role-Isolated Wallet Endpoints (New Architecture) ──────

// GET /api/v1/wallet/vendor — Vendor wallet balance
router.get('/vendor', authenticate, roleMiddleware('vendor'), asyncHandler(async (req, res) => {
  const balance = await walletService.getRoleBalance(req.user._id, 'vendor');
  return ApiResponse.ok(res, 'Vendor wallet loaded.', balance);
}));

// GET /api/v1/wallet/creator — Creator wallet balance
router.get('/creator', authenticate, roleMiddleware('creator'), asyncHandler(async (req, res) => {
  const balance = await walletService.getRoleBalance(req.user._id, 'creator');
  return ApiResponse.ok(res, 'Creator wallet loaded.', balance);
}));

module.exports = router;
