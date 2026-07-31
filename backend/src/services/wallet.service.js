const mongoose = require('mongoose');
const { Wallet } = require('../models/Phase4');
const WalletTransactionV2 = require('../models/WalletTransactionV2.model');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * WalletService — Production-Grade
 * All balance mutations happen inside MongoDB transactions.
 * Dual-sync: Wallet.credits (source of truth) + User.walletBalance (backward compat).
 * Emits Socket.IO events after every successful commit.
 */
class WalletService {

  // ─── Get or Create Wallet ────────────────────────────────
  async getOrCreateWallet(userId, session = null) {
    const uid = userId.toString();
    const opts = session ? { session } : {};
    let wallet = await Wallet.findOne({ user_id: uid }, null, opts);
    if (!wallet) {
      const created = await Wallet.create([{
        user_id: uid,
        credits: 0,
        balance_inr_paise: 0,
        lifetime_earned_credits: 0,
        lifetime_spent_credits: 0,
        lifetime_deposited_paise: 0,
        lifetime_spent_paise: 0,
        is_frozen: false,
      }], opts);
      wallet = created[0];
    }
    return wallet;
  }

  // ─── Get Balance ─────────────────────────────────────────
  async getBalance(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      credits: wallet.credits || 0,
      balance_inr_paise: wallet.balance_inr_paise || 0,
      is_frozen: wallet.is_frozen || false,
    };
  }

  // ─── Credit (Add Money) ──────────────────────────────────
  async credit({ userId, amount, transactionType = 'manual_credit', referenceId, reason, source = 'system', meta = {} }) {
    if (!amount || amount <= 0) {
      throw ApiError.badRequest('Credit amount must be positive.');
    }

    const uid = userId.toString();
    const refId = referenceId || `cr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Idempotency check
    if (referenceId) {
      const existing = await WalletTransactionV2.findOne({ reference_id: referenceId, user_id: uid, status: 'completed' });
      if (existing) {
        logger.warn(`Duplicate credit prevented: ${referenceId} for user ${uid}`, { service: 'wallet' });
        return { transaction: this._serializeTxn(existing), wallet: await this.getBalance(uid), duplicate: true };
      }
    }

    const session = await mongoose.startSession();
    let txn, updatedBalance;

    try {
      await session.withTransaction(async () => {
        const wallet = await this.getOrCreateWallet(uid, session);
        if (wallet.is_frozen) throw ApiError.badRequest('Wallet is frozen.');

        const previousBalance = wallet.credits || 0;
        updatedBalance = previousBalance + parseFloat(amount);

        // Atomic wallet update
        await Wallet.updateOne(
          { user_id: uid },
          {
            $inc: { credits: parseFloat(amount), lifetime_earned_credits: parseFloat(amount) },
            $set: { updated_at: new Date().toISOString() },
          },
          { session }
        );

        // Sync User.walletBalance
        await User.updateOne({ _id: userId }, { $inc: { walletBalance: parseFloat(amount) } }, { session });

        // Create transaction record
        const user = await User.findById(userId).select('name current_role roles').session(session).lean();
        const txnArr = await WalletTransactionV2.create([{
          user_id: uid,
          user_name: user?.name || 'Unknown',
          user_role: user?.current_role || user?.roles?.[0] || 'customer',
          transaction_type: transactionType,
          credit_debit: 'credit',
          amount: parseFloat(amount),
          previous_balance: previousBalance,
          updated_balance: updatedBalance,
          payment_method: source === 'admin_panel' ? 'manual' : 'internal',
          source,
          status: 'completed',
          reference_id: refId,
          admin_remarks: reason || null,
          meta,
        }], { session });
        txn = txnArr[0];
      });

      // Emit real-time events AFTER commit
      this._emitWalletUpdate(uid, updatedBalance, 'credit', parseFloat(amount), reason);

      logger.info(`Wallet credit: +${amount} to user ${uid} (${transactionType})`, { service: 'wallet' });
      return { transaction: this._serializeTxn(txn), wallet: { credits: updatedBalance } };
    } finally {
      await session.endSession();
    }
  }

  // ─── Debit (Subtract Money) ──────────────────────────────
  async debit({ userId, amount, transactionType = 'manual_debit', referenceId, reason, source = 'system', meta = {} }) {
    if (!amount || amount <= 0) {
      throw ApiError.badRequest('Debit amount must be positive.');
    }

    const uid = userId.toString();
    const refId = referenceId || `db_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Idempotency check
    if (referenceId) {
      const existing = await WalletTransactionV2.findOne({ reference_id: referenceId, user_id: uid, status: 'completed' });
      if (existing) {
        logger.warn(`Duplicate debit prevented: ${referenceId} for user ${uid}`, { service: 'wallet' });
        return { transaction: this._serializeTxn(existing), wallet: await this.getBalance(uid), duplicate: true };
      }
    }

    const session = await mongoose.startSession();
    let txn, updatedBalance;

    try {
      await session.withTransaction(async () => {
        const wallet = await this.getOrCreateWallet(uid, session);
        if (wallet.is_frozen) throw ApiError.badRequest('Wallet is frozen.');

        const previousBalance = wallet.credits || 0;
        if (parseFloat(amount) > previousBalance) {
          throw ApiError.badRequest(`Insufficient balance. Available: ${previousBalance}, Required: ${amount}`);
        }

        updatedBalance = previousBalance - parseFloat(amount);

        // Atomic wallet update
        await Wallet.updateOne(
          { user_id: uid },
          {
            $inc: { credits: -parseFloat(amount), lifetime_spent_credits: parseFloat(amount) },
            $set: { updated_at: new Date().toISOString() },
          },
          { session }
        );

        // Sync User.walletBalance
        await User.updateOne({ _id: userId }, { $inc: { walletBalance: -parseFloat(amount) } }, { session });

        // Create transaction record
        const user = await User.findById(userId).select('name current_role roles').session(session).lean();
        const txnArr = await WalletTransactionV2.create([{
          user_id: uid,
          user_name: user?.name || 'Unknown',
          user_role: user?.current_role || user?.roles?.[0] || 'customer',
          transaction_type: transactionType,
          credit_debit: 'debit',
          amount: parseFloat(amount),
          previous_balance: previousBalance,
          updated_balance: updatedBalance,
          payment_method: source === 'admin_panel' ? 'manual' : 'internal',
          source,
          status: 'completed',
          reference_id: refId,
          admin_remarks: reason || null,
          meta,
        }], { session });
        txn = txnArr[0];
      });

      // Emit real-time events AFTER commit
      this._emitWalletUpdate(uid, updatedBalance, 'debit', parseFloat(amount), reason);

      logger.info(`Wallet debit: -${amount} from user ${uid} (${transactionType})`, { service: 'wallet' });
      return { transaction: this._serializeTxn(txn), wallet: { credits: updatedBalance } };
    } finally {
      await session.endSession();
    }
  }

  // ─── Recharge Wallet ─────────────────────────────────────
  async rechargeWallet({ userId, amount, referenceId }) {
    return this.credit({
      userId,
      amount,
      transactionType: 'recharge',
      referenceId: referenceId || `rch_${Date.now()}`,
      reason: 'Wallet recharge',
      source: 'payment_gateway',
    });
  }

  // ─── Refund ──────────────────────────────────────────────
  async refund({ userId, amount, referenceId, reason }) {
    return this.credit({
      userId,
      amount,
      transactionType: 'refund',
      referenceId: referenceId || `ref_${Date.now()}`,
      reason: reason || 'Refund processed',
      source: 'refund_system',
    });
  }

  // ─── Purchase Plan (Subscription Deduction) ──────────────
  async purchasePlan({ userId, plan }) {
    const { SubscriptionPlan } = require('../models/Admin');
    const UserSubscription = require('../models/UserSubscription.model');

    let planDoc = null;
    if (mongoose.Types.ObjectId.isValid(plan)) {
      planDoc = await SubscriptionPlan.findById(plan);
    }
    if (!planDoc) {
      planDoc = await SubscriptionPlan.findOne({
        title: { $regex: new RegExp(`^${plan}$`, 'i') },
        is_deleted: { $ne: true },
        is_active: true,
      });
    }
    if (!planDoc) {
      throw ApiError.badRequest(`Invalid subscription plan: "${plan}".`);
    }

    const uid = userId.toString();
    const cost = planDoc.price_inr;
    const durationDays = planDoc.duration_days || 30;
    const refId = `sub_${planDoc._id}_${Date.now()}`;

    // Idempotency: prevent purchasing same plan within 1 minute
    const recentPurchase = await WalletTransactionV2.findOne({
      user_id: uid,
      transaction_type: 'subscription_purchase',
      'meta.plan_id': planDoc._id.toString(),
      created_at: { $gte: new Date(Date.now() - 60000).toISOString() },
      status: 'completed',
    });
    if (recentPurchase) {
      throw ApiError.badRequest('You have already purchased this plan. Please wait before trying again.');
    }

    const session = await mongoose.startSession();
    let txn, updatedBalance;

    try {
      await session.withTransaction(async () => {
        const wallet = await this.getOrCreateWallet(uid, session);
        if (wallet.is_frozen) throw ApiError.badRequest('Wallet is frozen.');

        const previousBalance = wallet.credits || 0;
        if (cost > previousBalance) {
          throw ApiError.badRequest(`Insufficient balance. Available: ₹${previousBalance}, Required: ₹${cost}`);
        }

        updatedBalance = previousBalance - cost;

        // Deduct wallet
        await Wallet.updateOne(
          { user_id: uid },
          {
            $inc: { credits: -cost, lifetime_spent_credits: cost },
            $set: { updated_at: new Date().toISOString() },
          },
          { session }
        );
        await User.updateOne({ _id: userId }, { $inc: { walletBalance: -cost } }, { session });

        // Create wallet transaction
        const user = await User.findById(userId).select('name current_role roles').session(session).lean();
        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        const txnArr = await WalletTransactionV2.create([{
          user_id: uid,
          user_name: user?.name || 'Unknown',
          user_role: user?.current_role || user?.roles?.[0] || 'customer',
          transaction_type: 'subscription_purchase',
          credit_debit: 'debit',
          amount: cost,
          previous_balance: previousBalance,
          updated_balance: updatedBalance,
          payment_method: 'wallet',
          source: 'subscription',
          status: 'completed',
          reference_id: refId,
          admin_remarks: `Subscribed to ${planDoc.title}`,
          meta: { plan_id: planDoc._id.toString(), plan_name: planDoc.title, duration_days: durationDays },
        }], { session });
        txn = txnArr[0];

        // Deactivate existing active subscriptions
        await UserSubscription.updateMany(
          { user_id: uid, status: 'active' },
          { $set: { status: 'cancelled', cancelled_at: new Date(), cancelled_reason: 'New plan purchased' } },
          { session }
        );

        // Create new subscription record
        const userRole = user?.current_role || user?.roles?.[0] || 'vendor';
        await UserSubscription.create([{
          user_id: uid,
          user_name: user?.name || '',
          user_role: userRole === 'customer' ? 'vendor' : userRole,
          plan_id: planDoc._id.toString(),
          plan_name: planDoc.title,
          plan_type: planDoc.plan_type || 'basic',
          billing_cycle: planDoc.billing_cycle || 'monthly',
          start_date: new Date(),
          expiry_date: expiresAt,
          auto_renewal: false,
          status: 'active',
          original_amount: cost,
          paid_amount: cost,
          payment_method: 'wallet',
        }], { session });

        // Update user subscription flag
        await User.updateOne(
          { _id: userId },
          {
            $set: {
              is_subscribed_verified: true,
              subscription: {
                plan: planDoc.title,
                startedAt: new Date(),
                expiresAt,
                boostCredits: planDoc.ai_credits || 0,
                autoRenew: false,
              },
            },
          },
          { session }
        );
      });

      // Emit real-time events AFTER commit
      this._emitWalletUpdate(uid, updatedBalance, 'debit', cost, `Subscribed to ${planDoc.title}`);
      this._emitSubscriptionUpdate(uid);

      logger.info(`Subscription purchase: ${planDoc.title} by user ${uid} (-₹${cost})`, { service: 'wallet' });
      return {
        transaction: this._serializeTxn(txn),
        user: { walletBalance: updatedBalance, subscription: { plan: planDoc.title } },
      };
    } finally {
      await session.endSession();
    }
  }

  // ─── Purchase Plan Direct (Razorpay — no wallet debit) ────
  async purchasePlanDirect({ userId, planId, paymentId, razorpayPaymentId }) {
    const { SubscriptionPlan } = require('../models/Admin');
    const UserSubscription = require('../models/UserSubscription.model');

    let planDoc = null;
    if (mongoose.Types.ObjectId.isValid(planId)) {
      planDoc = await SubscriptionPlan.findById(planId);
    }
    if (!planDoc) {
      planDoc = await SubscriptionPlan.findOne({
        title: { $regex: new RegExp(`^${planId}$`, 'i') },
        is_deleted: { $ne: true },
        is_active: true,
      });
    }
    if (!planDoc) {
      throw ApiError.badRequest(`Invalid subscription plan: "${planId}".`);
    }

    const uid = userId.toString();
    const cost = planDoc.price_inr;
    const durationDays = planDoc.duration_days || 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const session = await mongoose.startSession();
    let txn;

    try {
      await session.withTransaction(async () => {
        // Create transaction record (no wallet debit — paid via Razorpay)
        const user = await User.findById(userId).select('name current_role roles').session(session).lean();
        const txnArr = await WalletTransactionV2.create([{
          user_id: uid,
          user_name: user?.name || 'Unknown',
          user_role: user?.current_role || user?.roles?.[0] || 'customer',
          transaction_type: 'subscription_purchase',
          credit_debit: 'debit',
          amount: cost,
          previous_balance: 0,
          updated_balance: 0,
          payment_method: 'razorpay',
          source: 'subscription_direct',
          status: 'completed',
          reference_id: `sub_direct_${planDoc._id}_${Date.now()}`,
          admin_remarks: `Subscribed to ${planDoc.title} via Razorpay`,
          meta: {
            plan_id: planDoc._id.toString(),
            plan_name: planDoc.title,
            duration_days: durationDays,
            payment_id: paymentId || null,
            razorpay_payment_id: razorpayPaymentId || null,
          },
        }], { session });
        txn = txnArr[0];

        // Deactivate existing active subscriptions
        await UserSubscription.updateMany(
          { user_id: uid, status: 'active' },
          { $set: { status: 'cancelled', cancelled_at: new Date(), cancelled_reason: 'New plan purchased' } },
          { session }
        );

        // Create new subscription record
        const userRole = user?.current_role || user?.roles?.[0] || 'vendor';
        await UserSubscription.create([{
          user_id: uid,
          user_name: user?.name || '',
          user_role: userRole === 'customer' ? 'vendor' : userRole,
          plan_id: planDoc._id.toString(),
          plan_name: planDoc.title,
          plan_type: planDoc.plan_type || 'basic',
          billing_cycle: planDoc.billing_cycle || 'monthly',
          start_date: new Date(),
          expiry_date: expiresAt,
          auto_renewal: false,
          status: 'active',
          original_amount: cost,
          paid_amount: cost,
          payment_method: 'razorpay',
          payment_id: razorpayPaymentId || paymentId || null,
        }], { session });

        // Update user subscription flag
        await User.updateOne(
          { _id: userId },
          {
            $set: {
              is_subscribed_verified: true,
              subscription: {
                plan: planDoc.title,
                startedAt: new Date(),
                expiresAt,
                boostCredits: planDoc.ai_credits || 0,
                autoRenew: false,
              },
            },
          },
          { session }
        );
      });

      // Emit real-time events AFTER commit
      this._emitSubscriptionUpdate(uid);

      logger.info(`Direct subscription purchase: ${planDoc.title} by user ${uid} (₹${cost} via Razorpay)`, { service: 'wallet' });
      return {
        transaction: this._serializeTxn(txn),
        user: { subscription: { plan: planDoc.title, expiresAt } },
      };
    } finally {
      await session.endSession();
    }
  }

  // ─── Get Transactions (Paginated) ────────────────────────
  async getTransactions(userId, page = 1, limit = 50) {
    const uid = userId.toString();
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const query = { user_id: uid, is_deleted: { $ne: true } };

    const [items, total] = await Promise.all([
      WalletTransactionV2.find(query).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      WalletTransactionV2.countDocuments(query),
    ]);

    return { items: items.map(this._serializeTxn), total, page: parseInt(page), limit: parseInt(limit) };
  }

  // ─── Earn Credits (Referral/Bonus shorthand) ─────────────
  async earnCredits(userId, amount, reason, source = 'referral', refId = null) {
    return this.credit({
      userId,
      amount,
      transactionType: source === 'referral' ? 'referral_bonus' : 'promotional_credit',
      referenceId: refId || `earn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      reason,
      source,
    });
  }

  // ─── Spend Credits (Shorthand) ───────────────────────────
  async spendCredits(userId, amount, reason, refType = 'system') {
    return this.debit({
      userId,
      amount,
      transactionType: 'manual_debit',
      reason,
      source: refType,
    });
  }

  // ─── Request Payout ──────────────────────────────────────
  async requestPayout({ userId, amount }) {
    if (!amount || amount <= 0) {
      throw ApiError.badRequest('Payout amount must be positive.');
    }
    return this.debit({
      userId,
      amount: parseFloat(amount),
      transactionType: 'withdrawal',
      referenceId: `pay_${Date.now()}`,
      reason: 'Payout withdrawal request',
      source: 'payout',
    });
  }

  // ─── Deposit INR (Paise conversion) ──────────────────────
  async depositInr(userId, paise, reason) {
    return this.rechargeWallet({ userId, amount: paise / 100 });
  }

  // ─── List Transactions (Alias) ───────────────────────────
  async listTransactions(userId, limit = 50, page = 1) {
    return this.getTransactions(userId, page, limit);
  }

  // ─── Internal: Serialize Transaction ─────────────────────
  _serializeTxn(txn) {
    if (!txn) return null;
    return {
      id: txn._id?.toString() || txn.id,
      transaction_id: txn.transaction_id,
      reference_id: txn.reference_id,
      user_id: txn.user_id,
      transaction_type: txn.transaction_type,
      credit_debit: txn.credit_debit,
      amount: txn.amount,
      previous_balance: txn.previous_balance,
      updated_balance: txn.updated_balance,
      status: txn.status,
      source: txn.source,
      admin_remarks: txn.admin_remarks,
      created_at: txn.created_at,
    };
  }

  // ─── Internal: Emit Wallet Update ────────────────────────
  _emitWalletUpdate(userId, newBalance, action, amount, reason) {
    try {
      const { emitToUser, emitToAdmin } = require('../sockets');
      emitToUser(userId, 'wallet:updated', { action, amount, new_balance: newBalance, reason });
      emitToAdmin('admin:update', { tags: ['AdminWallet', 'AdminWalletTransactions', 'AdminOverview'] });
    } catch (err) {
      logger.warn('Socket emit failed in wallet service', { error: err.message });
    }
  }

  // ─── Internal: Emit Subscription Update ──────────────────
  _emitSubscriptionUpdate(userId) {
    try {
      const { emitToUser, emitToAdmin } = require('../sockets');
      emitToUser(userId, 'subscription:updated', { updated: true });
      emitToAdmin('admin:update', { tags: ['UserSubscriptions', 'AdminOverview'] });
    } catch (err) {
      logger.warn('Socket emit failed for subscription update', { error: err.message });
    }
  }
}

const serviceInstance = new WalletService();
module.exports = serviceInstance;
