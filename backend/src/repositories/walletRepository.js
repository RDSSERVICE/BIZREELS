const mongoose = require('mongoose');
const User = require('../models/User');
const { Wallet } = require('../models/Phase4');
const WalletTransactionV2 = require('../models/WalletTransactionV2.model');
const logger = require('../utils/logger');

/**
 * WalletRepository — Production-Grade
 * All balance mutations use MongoDB transactions with dual-sync (Wallet + User).
 * Uses WalletTransactionV2 for all transaction records.
 */
class WalletRepository {

  // ─── Update Balance (Transaction-Safe) ───────────────────
  async updateWalletBalance(userId, amount, type, referenceId, description) {
    const uid = userId.toString();
    const session = await mongoose.startSession();

    try {
      let transaction, updatedUser;

      await session.withTransaction(async () => {
        // Idempotency check
        if (referenceId) {
          const existing = await WalletTransactionV2.findOne(
            { reference_id: referenceId, user_id: uid, status: 'completed' }
          ).session(session);
          if (existing) {
            transaction = existing;
            updatedUser = await User.findById(userId).session(session).lean();
            return;
          }
        }

        const user = await User.findById(userId).session(session);
        if (!user) throw new Error('User not found.');

        // Get or create wallet
        let wallet = await Wallet.findOne({ user_id: uid }).session(session);
        if (!wallet) {
          const created = await Wallet.create([{
            user_id: uid, credits: 0, balance_inr_paise: 0,
            lifetime_earned_credits: 0, lifetime_spent_credits: 0,
            lifetime_deposited_paise: 0, lifetime_spent_paise: 0, is_frozen: false,
          }], { session });
          wallet = created[0];
        }

        if (wallet.is_frozen) throw new Error('Wallet is frozen.');

        const previousBalance = wallet.credits || 0;
        const newBalance = previousBalance + amount;
        if (newBalance < 0) {
          throw new Error('Insufficient wallet balance.');
        }

        // Update Wallet model
        const incFields = amount > 0
          ? { credits: amount, lifetime_earned_credits: amount }
          : { credits: amount, lifetime_spent_credits: Math.abs(amount) };

        await Wallet.updateOne(
          { user_id: uid },
          { $inc: incFields, $set: { updated_at: new Date().toISOString() } },
          { session }
        );

        // Update User.walletBalance
        updatedUser = await User.findByIdAndUpdate(
          userId,
          { $inc: { walletBalance: amount } },
          { returnDocument: 'after', session }
        );

        // Create V2 transaction record
        const creditDebit = amount >= 0 ? 'credit' : 'debit';
        const txnType = type === 'deposit' ? 'recharge' : type === 'payment' ? 'subscription_purchase' : type === 'withdrawal' ? 'withdrawal' : 'manual_credit';

        const txnArr = await WalletTransactionV2.create([{
          user_id: uid,
          user_name: user.name || 'Unknown',
          user_role: user.current_role || user.roles?.[0] || 'customer',
          transaction_type: txnType,
          credit_debit: creditDebit,
          amount: Math.abs(amount),
          previous_balance: previousBalance,
          updated_balance: newBalance,
          payment_method: 'internal',
          source: 'system',
          status: 'completed',
          reference_id: referenceId || `txn_${Date.now()}`,
          admin_remarks: description || null,
        }], { session });
        transaction = txnArr[0];
      });

      // Emit socket events after commit
      try {
        const { emitToUser, emitToAdmin } = require('../sockets');
        emitToUser(uid, 'wallet:updated', {
          action: amount >= 0 ? 'credit' : 'debit',
          amount: Math.abs(amount),
          new_balance: updatedUser?.walletBalance || 0,
        });
        emitToAdmin('admin:update', { tags: ['AdminWallet', 'AdminWalletTransactions'] });
      } catch (err) {
        logger.warn('Socket emit failed in walletRepository', { error: err.message });
      }

      return { transaction, user: updatedUser };
    } finally {
      await session.endSession();
    }
  }

  // ─── Purchase Subscription (Transaction-Safe) ────────────
  async purchaseSubscription(userId, planId, planName, planType, billingCycle, cost, durationDays, boostCredits) {
    const uid = userId.toString();
    const session = await mongoose.startSession();

    try {
      let transaction, updatedUser;

      await session.withTransaction(async () => {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error('User not found.');

        // Get or create wallet
        let wallet = await Wallet.findOne({ user_id: uid }).session(session);
        if (!wallet) {
          const created = await Wallet.create([{
            user_id: uid, credits: 0, balance_inr_paise: 0,
            lifetime_earned_credits: 0, lifetime_spent_credits: 0,
            lifetime_deposited_paise: 0, lifetime_spent_paise: 0, is_frozen: false,
          }], { session });
          wallet = created[0];
        }

        const previousBalance = wallet.credits || 0;
        if (cost > previousBalance) {
          throw new Error('Insufficient balance to purchase subscription.');
        }

        const updatedBalance = previousBalance - cost;
        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        // Deduct from Wallet
        await Wallet.updateOne(
          { user_id: uid },
          {
            $inc: { credits: -cost, lifetime_spent_credits: cost },
            $set: { updated_at: new Date().toISOString() },
          },
          { session }
        );

        // Create transaction record
        const txnArr = await WalletTransactionV2.create([{
          user_id: uid,
          user_name: user.name || 'Unknown',
          user_role: user.current_role || user.roles?.[0] || 'customer',
          transaction_type: 'subscription_purchase',
          credit_debit: 'debit',
          amount: cost,
          previous_balance: previousBalance,
          updated_balance: updatedBalance,
          payment_method: 'wallet',
          source: 'subscription',
          status: 'completed',
          reference_id: `sub_${planId}_${Date.now()}`,
          admin_remarks: `Subscribed to ${planName}`,
          meta: { plan_id: planId, plan_name: planName },
        }], { session });
        transaction = txnArr[0];

        // Update user subscription + balance
        updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            $inc: { walletBalance: -cost },
            $set: {
              is_subscribed_verified: true,
              subscription: {
                plan: planName,
                startedAt: new Date(),
                expiresAt,
                boostCredits,
                autoRenew: false,
              },
            },
          },
          { returnDocument: 'after', session }
        );

        // Create UserSubscription document
        const UserSubscription = require('../models/UserSubscription.model');
        await UserSubscription.updateMany(
          { user_id: uid, status: 'active' },
          { $set: { status: 'cancelled', cancelled_at: new Date(), cancelled_reason: 'Upgraded/Changed' } },
          { session }
        );

        const userRole = user.current_role || user.roles?.[0] || 'vendor';
        await UserSubscription.create([{
          user_id: uid,
          user_name: user.name || '',
          user_role: userRole === 'customer' ? 'vendor' : userRole,
          plan_id: planId,
          plan_name: planName,
          plan_type: planType || 'basic',
          billing_cycle: billingCycle || 'monthly',
          start_date: new Date(),
          expiry_date: expiresAt,
          auto_renewal: false,
          status: 'active',
          original_amount: cost,
          paid_amount: cost,
          payment_method: 'wallet',
        }], { session });
      });

      // Emit socket events after commit
      try {
        const { emitToUser, emitToAdmin } = require('../sockets');
        emitToUser(uid, 'wallet:updated', { action: 'debit', amount: cost, new_balance: updatedUser?.walletBalance || 0 });
        emitToUser(uid, 'subscription:updated', { updated: true, plan: planName });
        emitToAdmin('admin:update', { tags: ['AdminWallet', 'UserSubscriptions', 'AdminOverview'] });
      } catch (err) {
        logger.warn('Socket emit failed in walletRepository', { error: err.message });
      }

      return { transaction, user: updatedUser };
    } finally {
      await session.endSession();
    }
  }

  // ─── Request Withdrawal (Transaction-Safe) ───────────────
  async requestWithdrawal(userId, amount) {
    const uid = userId.toString();
    const session = await mongoose.startSession();

    try {
      let transaction, updatedUser;

      await session.withTransaction(async () => {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error('User not found.');

        let wallet = await Wallet.findOne({ user_id: uid }).session(session);
        if (!wallet) throw new Error('Wallet not found.');
        if (wallet.is_frozen) throw new Error('Wallet is frozen.');

        const previousBalance = wallet.credits || 0;
        if (amount > previousBalance) {
          throw new Error('Insufficient wallet balance for withdrawal.');
        }

        const updatedBalance = previousBalance - amount;

        // Deduct from both
        await Wallet.updateOne(
          { user_id: uid },
          {
            $inc: { credits: -amount, lifetime_spent_credits: amount },
            $set: { updated_at: new Date().toISOString() },
          },
          { session }
        );

        updatedUser = await User.findByIdAndUpdate(
          userId,
          { $inc: { walletBalance: -amount } },
          { returnDocument: 'after', session }
        );

        const txnArr = await WalletTransactionV2.create([{
          user_id: uid,
          user_name: user.name || 'Unknown',
          user_role: user.current_role || user.roles?.[0] || 'customer',
          transaction_type: 'withdrawal',
          credit_debit: 'debit',
          amount: Math.abs(amount),
          previous_balance: previousBalance,
          updated_balance: updatedBalance,
          payment_method: 'internal',
          source: 'payout',
          status: 'pending',
          reference_id: `pay_${Date.now()}`,
          admin_remarks: 'Payout withdrawal request',
        }], { session });
        transaction = txnArr[0];
      });

      // Emit events
      try {
        const { emitToUser, emitToAdmin } = require('../sockets');
        emitToUser(uid, 'wallet:updated', { action: 'debit', amount, new_balance: updatedUser?.walletBalance || 0 });
        emitToAdmin('admin:update', { tags: ['AdminWallet', 'AdminWalletTransactions'] });
      } catch (err) {}

      return { transaction, user: updatedUser };
    } finally {
      await session.endSession();
    }
  }

  // ─── Get Transactions ────────────────────────────────────
  async getTransactionsForUser(userId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return WalletTransactionV2.find({ user_id: userId.toString(), is_deleted: { $ne: true } })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

module.exports = new WalletRepository();
