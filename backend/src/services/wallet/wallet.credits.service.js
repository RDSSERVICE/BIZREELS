const mongoose = require('mongoose');
const { Wallet } = require('../../models/Phase4');
const WalletTransactionV2 = require('../../models/WalletTransactionV2.model');
const User = require('../../models/User');
const IsolatedWallet = require('../../models/IsolatedWallet.model');
const IsolatedTransaction = require('../../models/IsolatedTransaction.model');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const cache = require('../../utils/cache');
const walletEvents = require('./wallet.events');
const walletCoreService = require('./wallet.core.service');

/**
 * Wallet Credits Service
 * Handles platform utility usage credits: credit, debit, recharge, refund, earn, and spend.
 */
class WalletCreditsService {
  /**
   * Credit platform usage credits (Transactional with MongoDB sessions and isolated wallet sync).
   */
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
        return { transaction: walletEvents._serializeTxn(existing), wallet: await walletCoreService.getBalance(uid), duplicate: true };
      }
    }

    const session = await mongoose.startSession();
    let txn, updatedBalance;

    try {
      await session.withTransaction(async () => {
        const wallet = await walletCoreService.getOrCreateWallet(uid, session);
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

        // ─── Sync Isolated Wallet ──────────────────────────────────
        try {
          let targetRole = null;
          const desc = (reason || '').toLowerCase();
          if (desc.includes('campaign') || desc.includes('creator') || desc.includes('shoot')) {
            targetRole = 'creator';
          } else {
            targetRole = 'vendor';
          }

          // Get or create isolated wallet
          let isoWallet = await IsolatedWallet.findOne({ userId: uid, role: targetRole }).session(session);
          if (!isoWallet) {
            let initialBalance = 0;
            if (targetRole === 'vendor') {
              initialBalance = previousBalance;
            }
            const createdIso = await IsolatedWallet.create([{
              userId: uid,
              role: targetRole,
              balance: initialBalance,
              currency: 'INR',
              lifetime_earned: targetRole === 'vendor' ? initialBalance : 0,
              lifetime_spent: 0,
              is_frozen: false,
              status: 'active',
            }], { session });
            isoWallet = createdIso[0];
          }

          if (!isoWallet.is_frozen) {
            const prevIsoBalance = isoWallet.balance || 0;
            const updatedIsoBalance = prevIsoBalance + parseFloat(amount);

            if (updatedIsoBalance >= 0) {
              await IsolatedWallet.updateOne(
                { userId: uid, role: targetRole },
                { $inc: { balance: parseFloat(amount), lifetime_earned: parseFloat(amount) } },
                { session }
              );

              let isoTxType = transactionType === 'recharge' ? 'recharge' : transactionType === 'refund' ? 'refund' : 'credit';

              await IsolatedTransaction.create([{
                userId: uid,
                role: targetRole,
                walletId: isoWallet._id,
                type: isoTxType,
                amount: parseFloat(amount),
                previous_balance: prevIsoBalance,
                updated_balance: updatedIsoBalance,
                paymentId: refId || null,
                gateway: source === 'admin_panel' ? 'internal' : 'razorpay',
                description: reason || null,
                reference_id: refId ? `iso_${refId}` : `txn_iso_${Date.now()}`,
                status: 'success',
              }], { session });
            }
          }
        } catch (err) {
          logger.error('Failed to sync isolated wallet during credit', { error: err.message });
        }

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
      walletEvents._emitWalletUpdate(uid, updatedBalance, 'credit', parseFloat(amount), reason);

      logger.info(`Wallet credit: +${amount} to user ${uid} (${transactionType})`, { service: 'wallet' });
      return { transaction: walletEvents._serializeTxn(txn), wallet: { credits: updatedBalance } };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Debit platform usage credits (Transactional with session and isolated wallet sync).
   */
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
        return { transaction: walletEvents._serializeTxn(existing), wallet: await walletCoreService.getBalance(uid), duplicate: true };
      }
    }

    const session = await mongoose.startSession();
    let txn, updatedBalance;

    try {
      await session.withTransaction(async () => {
        const wallet = await walletCoreService.getOrCreateWallet(uid, session);
        if (wallet.is_frozen) throw ApiError.badRequest('Wallet is frozen.');

        let previousBalance = wallet.credits || 0;
        try {
          const isoWallet = await IsolatedWallet.findOne({ userId: uid, role: 'vendor' }).session(session);
          if (isoWallet && (isoWallet.balance || 0) > previousBalance) {
            previousBalance = isoWallet.balance;
            wallet.credits = previousBalance;
            await Wallet.updateOne({ user_id: uid }, { $set: { credits: previousBalance } }, { session });
          }
        } catch (_) {}

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

        // ─── Sync Isolated Wallet ──────────────────────────────────
        try {
          let targetRole = null;
          const desc = (reason || '').toLowerCase();
          if (desc.includes('campaign') || desc.includes('creator') || desc.includes('shoot') || transactionType === 'withdrawal') {
            targetRole = 'creator';
          } else {
            targetRole = 'vendor';
          }

          // Get or create isolated wallet
          let isoWallet = await IsolatedWallet.findOne({ userId: uid, role: targetRole }).session(session);
          if (!isoWallet) {
            let initialBalance = 0;
            if (targetRole === 'vendor') {
              initialBalance = previousBalance;
            }
            const createdIso = await IsolatedWallet.create([{
              userId: uid,
              role: targetRole,
              balance: initialBalance,
              currency: 'INR',
              lifetime_earned: targetRole === 'vendor' ? initialBalance : 0,
              lifetime_spent: 0,
              is_frozen: false,
              status: 'active',
            }], { session });
            isoWallet = createdIso[0];
          }

          if (!isoWallet.is_frozen) {
            const prevIsoBalance = isoWallet.balance || 0;
            const updatedIsoBalance = prevIsoBalance - parseFloat(amount);

            if (updatedIsoBalance >= 0) {
              await IsolatedWallet.updateOne(
                { userId: uid, role: targetRole },
                { $inc: { balance: -parseFloat(amount), lifetime_spent: parseFloat(amount) } },
                { session }
              );

              let isoTxType = transactionType === 'withdrawal' ? 'payout' : transactionType === 'subscription_purchase' ? 'subscription_purchase' : 'debit';

              await IsolatedTransaction.create([{
                userId: uid,
                role: targetRole,
                walletId: isoWallet._id,
                type: isoTxType,
                amount: parseFloat(amount),
                previous_balance: prevIsoBalance,
                updated_balance: updatedIsoBalance,
                paymentId: refId || null,
                gateway: 'internal',
                description: reason || null,
                reference_id: refId ? `iso_${refId}` : `txn_iso_${Date.now()}`,
                status: 'success',
              }], { session });
            }
          }
        } catch (err) {
          logger.error('Failed to sync isolated wallet during debit', { error: err.message });
        }

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

      await cache.deleteCache(`wallet:role:${uid}:vendor`);
      await cache.deleteCache(`wallet:role:${uid}:creator`);
      await cache.deleteCache(`wallet:balance:${uid}`);

      // Emit real-time events AFTER commit
      walletEvents._emitWalletUpdate(uid, updatedBalance, 'debit', parseFloat(amount), reason);

      logger.info(`Wallet debit: -${amount} from user ${uid} (${transactionType})`, { service: 'wallet' });
      return { transaction: walletEvents._serializeTxn(txn), wallet: { credits: updatedBalance } };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Recharge Wallet (Shorthand for credit)
   */
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

  /**
   * Refund (Shorthand for credit)
   */
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

  /**
   * Earn Credits (Referral/Bonus shorthand)
   */
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

  /**
   * Spend Credits (Shorthand for debit)
   */
  async spendCredits(userId, amount, reason, refType = 'system') {
    return this.debit({
      userId,
      amount,
      transactionType: 'manual_debit',
      reason,
      source: refType,
    });
  }
}

module.exports = new WalletCreditsService();
