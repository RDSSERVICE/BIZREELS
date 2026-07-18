const walletService = require('../services/walletService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * WalletController
 * Handles requests for wallet deposits, transactions audits, and plans upgrades.
 */
class WalletController {
  // ── Recharge Wallet ─────────────────────────────────────
  recharge = asyncHandler(async (req, res) => {
    const { amount, referenceId } = req.body;
    const result = await walletService.rechargeWallet({
      userId: req.user._id,
      amount,
      referenceId,
    });
    return ApiResponse.ok(res, 'Wallet recharged successfully.', {
      walletBalance: result.user.walletBalance,
      transaction: result.transaction,
    });
  });

  // ── Retrieve Transactions History ───────────────────────
  getTransactions = asyncHandler(async (req, res) => {
    const list = await walletService.getTransactions(req.user._id);
    return ApiResponse.ok(res, 'Transactions ledger loaded.', { transactions: list });
  });

  // ── Purchase Plan ───────────────────────────────────────
  purchaseSubscription = asyncHandler(async (req, res) => {
    const plan = req.body.plan || req.body.planId;
    const result = await walletService.purchasePlan({
      userId: req.user._id,
      plan,
    });
    return ApiResponse.ok(res, `Subscribed to ${plan.toUpperCase()} plan successfully.`, {
      subscription: result.user.subscription,
      walletBalance: result.user.walletBalance,
      transaction: result.transaction,
    });
  });
}

module.exports = new WalletController();
