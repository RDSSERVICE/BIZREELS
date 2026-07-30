const walletService = require('../services/wallet.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const cache = require('../utils/cache');

/**
 * WalletController — Production-Grade
 * Handles wallet balance, transactions, plans, and payouts with real-time updates.
 */
class WalletController {

  // ── Get Wallet Balance ──────────────────────────────────
  getWallet = asyncHandler(async (req, res) => {
    const balance = await walletService.getBalance(req.user._id);
    return ApiResponse.ok(res, 'Wallet details loaded.', {
      balance: balance.credits,
      walletBalance: balance.credits,
      balance_inr_paise: balance.balance_inr_paise,
      is_frozen: balance.is_frozen,
    });
  });

  // ── Quick Balance Check ─────────────────────────────────
  getBalance = asyncHandler(async (req, res) => {
    const balance = await walletService.getBalance(req.user._id);
    return ApiResponse.ok(res, 'Balance fetched.', { balance: balance.credits });
  });

  // ── Get Active Subscription ─────────────────────────────
  getSubscription = asyncHandler(async (req, res) => {
    const UserSubscription = require('../models/UserSubscription.model');
    const activeSub = await UserSubscription.findOne({
      user_id: req.user._id.toString(),
      status: 'active',
      is_deleted: { $ne: true },
    }).lean();

    const planName = activeSub ? activeSub.plan_name : 'Free Member';

    return ApiResponse.ok(res, 'Subscription details loaded.', {
      subscription: activeSub || { planName, status: 'active' },
      plan: planName,
    });
  });

  // ── Get Available Plans ─────────────────────────────────
  getPlans = asyncHandler(async (req, res) => {
    const cacheKey = 'subscription:plans';
    const cached = await cache.getCache(cacheKey);
    if (cached) {
      return ApiResponse.ok(res, 'Active subscription plans loaded.', { items: cached });
    }

    const { SubscriptionPlan } = require('../models/Admin');
    const plans = await SubscriptionPlan.find({ is_active: true, is_deleted: { $ne: true } }).sort({ price_inr: 1 }).lean();

    const mapped = plans.map(obj => {
      const role = obj.user_type || obj.target_role || 'vendor';
      return {
        id: (obj._id || obj.id).toString(),
        title: obj.title,
        description: obj.description,
        plan_type: obj.plan_type || 'basic',
        user_type: role,
        target_role: role,
        billing_cycle: obj.billing_cycle,
        price_inr: obj.price_inr,
        duration_days: obj.duration_days || 30,
        features_list: obj.features_list || (obj.features ? obj.features.split(',').map(f => f.trim()) : []),
        product_limit: obj.product_limit,
        service_limit: obj.service_limit,
        reels_limit: obj.reels_limit,
        leads_limit: obj.leads_limit,
        ai_credits: obj.ai_credits || 0,
        is_active: obj.is_active !== false,
        is_archived: obj.is_archived || false,
      };
    });

    await cache.setCache(cacheKey, mapped, 86400);
    return ApiResponse.ok(res, 'Active subscription plans loaded.', { items: mapped });
  });

  // ── Recharge Wallet ─────────────────────────────────────
  recharge = asyncHandler(async (req, res) => {
    const { amount, referenceId } = req.body;
    const result = await walletService.rechargeWallet({
      userId: req.user._id,
      amount,
      referenceId,
    });
    return ApiResponse.ok(res, 'Wallet recharged successfully.', {
      walletBalance: result.wallet.credits,
      transaction: result.transaction,
    });
  });

  // ── Get Transactions History ────────────────────────────
  getTransactions = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 20, 10)));

    const result = await walletService.getTransactions(req.user._id, page, limit);

    const mapped = result.items.map(tx => ({
      id: tx.id,
      _id: tx.transaction_id,
      title: tx.transaction_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: tx.admin_remarks || tx.transaction_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type: tx.credit_debit === 'credit' ? 'credit' : 'debit',
      amount: tx.amount,
      createdAt: tx.created_at,
    }));

    return ApiResponse.paginated(res, 'Transactions ledger loaded.', mapped, {
      page,
      limit,
      total: result.total,
    });
  });

  // ── Purchase Plan ───────────────────────────────────────
  purchaseSubscription = asyncHandler(async (req, res) => {
    const plan = req.body.plan || req.body.planId;
    if (!plan) {
      return ApiResponse.ok(res, 'Plan is required.', null);
    }
    const result = await walletService.purchasePlan({
      userId: req.user._id,
      plan,
    });
    return ApiResponse.ok(res, `Subscribed to plan successfully.`, {
      subscription: result.user.subscription,
      walletBalance: result.user.walletBalance,
      transaction: result.transaction,
    });
  });

  // ── Request Payout ──────────────────────────────────────
  requestPayout = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const result = await walletService.requestPayout({
      userId: req.user._id,
      amount,
    });
    return ApiResponse.ok(res, 'Payout withdrawal request submitted successfully.', {
      walletBalance: result.wallet.credits,
      transaction: result.transaction,
    });
  });
}

module.exports = new WalletController();
