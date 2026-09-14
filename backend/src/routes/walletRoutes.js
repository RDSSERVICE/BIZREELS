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
router.get('/credit-rates', walletController.getCreditRates);
router.post('/subscribe', authenticate, walletController.purchaseSubscription);
router.post('/payout', authenticate, walletController.requestPayout);

// ─── Role-Isolated Wallet Endpoints (New Architecture) ──────

// GET /api/v1/wallet/vendor — Vendor wallet balance
router.get('/vendor', authenticate, roleMiddleware('vendor'), asyncHandler(async (req, res) => {
  const balance = await walletService.getRoleBalance(req.user._id, 'vendor');
  const mainWallet = await walletService.getBalance(req.user._id);
  const credits = Math.max(
    balance?.balance ?? 0,
    mainWallet?.credits ?? 0,
    req.user?.walletBalance ?? 0,
    req.user?.wallet_credits ?? 0
  );
  const withdrawableInr = (mainWallet?.balance_inr_paise || 0) / 100;
  return ApiResponse.ok(res, 'Vendor wallet loaded.', {
    ...balance,
    credits,
    walletBalance: credits,
    balance: credits,
    free_reel_boosts: mainWallet?.free_reel_boosts || req.user?.free_reel_boosts || 0,
    freeReelBoosts: mainWallet?.free_reel_boosts || req.user?.free_reel_boosts || 0,
    balance_inr_paise: mainWallet?.balance_inr_paise || 0,
    earnings_inr: withdrawableInr,
    platformCredits: {
      available: credits,
      free_reel_boosts: mainWallet?.free_reel_boosts || req.user?.free_reel_boosts || 0,
      currency: 'CREDITS',
      conversionRate: '1 Credit = ₹1 INR',
    },
    merchantRevenue: {
      withdrawable_inr: withdrawableInr,
      balance_inr_paise: mainWallet?.balance_inr_paise || 0,
      pending_escrow_inr: 0,
      currency: 'INR',
    },
    bankAccount: req.user?.vendorProfile?.bankDetails || null,
  });
}));

// GET /api/v1/wallet/creator — Creator wallet balance
router.get('/creator', authenticate, roleMiddleware('creator'), asyncHandler(async (req, res) => {
  const balance = await walletService.getRoleBalance(req.user._id, 'creator');
  return ApiResponse.ok(res, 'Creator wallet loaded.', balance);
}));

module.exports = router;
