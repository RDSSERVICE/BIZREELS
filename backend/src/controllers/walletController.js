const walletService = require('../services/wallet.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const cache = require('../utils/cache');

/**
 * WalletController
 * Handles requests for wallet deposits, transactions audits, and plans upgrades.
 */
class WalletController {
  // ── Retrieve Wallet Balance ─────────────────────────────
  getWallet = asyncHandler(async (req, res) => {
    const { Wallet } = require('../models/Phase4');
    const wallet = await Wallet.findOne({ user_id: req.user._id.toString() }).lean();
    const credits = wallet ? wallet.credits : (req.user.walletBalance || 0);
    return ApiResponse.ok(res, 'Wallet details loaded.', {
      balance: credits,
      walletBalance: credits,
      balance_inr_paise: wallet ? wallet.balance_inr_paise : 0,
    });
  });

  // ── Retrieve Active Subscription ───────────────────────
  getSubscription = asyncHandler(async (req, res) => {
    const UserSubscription = require('../models/UserSubscription.model');
    const activeSub = await UserSubscription.findOne({
      user_id: req.user._id.toString(),
      status: 'active',
      is_deleted: { $ne: true }
    }).lean();

    const planName = activeSub ? activeSub.plan_name : 'Free Member';

    return ApiResponse.ok(res, 'Subscription details loaded.', {
      subscription: activeSub || { planName, status: 'active' },
      plan: planName,
    });
  });

  // ── Retrieve Active Plans (For Vendors / Creators) ───────
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

    await cache.setCache(cacheKey, mapped, 86400); // 24 hours
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
      walletBalance: result.user.walletBalance,
      transaction: result.transaction,
    });
  });

  // ── Retrieve Transactions History ───────────────────────
  getTransactions = asyncHandler(async (req, res) => {
    const WalletTransactionV2 = require('../models/WalletTransactionV2.model');
    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 20, 10)));
    const skip = (page - 1) * limit;

    const query = { user_id: req.user._id.toString(), is_deleted: { $ne: true } };

    const [list, total] = await Promise.all([
      WalletTransactionV2.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WalletTransactionV2.countDocuments(query)
    ]);

    const mapped = list.map(tx => ({
      id: tx._id.toString(),
      _id: tx.transaction_id,
      title: tx.transaction_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: tx.admin_remarks || tx.notes || tx.transaction_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type: tx.credit_debit === 'credit' ? 'credit' : 'debit',
      amount: tx.amount,
      createdAt: tx.created_at,
    }));

    return ApiResponse.paginated(res, 'Transactions ledger loaded.', mapped, {
      page,
      limit,
      total,
    });
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

  // ── Request Payout ──────────────────────────────────────
  requestPayout = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const result = await walletService.requestPayout({
      userId: req.user._id,
      amount,
    });
    return ApiResponse.ok(res, 'Payout withdrawal request submitted successfully.', {
      walletBalance: result.user.walletBalance,
      transaction: result.transaction,
    });
  });
}

module.exports = new WalletController();
