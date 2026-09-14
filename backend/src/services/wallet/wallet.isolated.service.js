const mongoose = require('mongoose');
const IsolatedWallet = require('../../models/IsolatedWallet.model');
const IsolatedTransaction = require('../../models/IsolatedTransaction.model');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const cache = require('../../utils/cache');
const walletEvents = require('./wallet.events');

/**
 * Wallet Isolated Service
 * Handles vendor and creator role-isolated balances and transactions.
 */
class WalletIsolatedService {
  /**
   * Get or create a role-isolated wallet for a user.
   * @param {string} userId
   * @param {'vendor'|'creator'} role
   * @param {object} [session] - optional Mongoose session
   */
  async getRoleWallet(userId, role, session = null) {
    const uid = userId.toString();
    const opts = session ? { session } : {};
    let wallet = await IsolatedWallet.findOne({ userId: uid, role }, null, opts);
    if (!wallet) {
      const created = await IsolatedWallet.create([{
        userId: uid,
        role,
        balance: 0,
        currency: 'INR',
        lifetime_earned: 0,
        lifetime_spent: 0,
        is_frozen: false,
        status: 'active',
      }], opts);
      wallet = created[0];
    }
    return wallet;
  }

  /**
   * Get role-isolated wallet balance.
   */
  async getRoleBalance(userId, role) {
    const uid = userId.toString();
    const cacheKey = `wallet:role:${uid}:${role}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const wallet = await this.getRoleWallet(uid, role);
    const result = {
      balance: wallet.balance || 0,
      is_frozen: wallet.is_frozen || false,
      status: wallet.status,
      role,
    };
    await cache.setCache(cacheKey, result, 15);
    return result;
  }

  /**
   * Credit a role-isolated wallet.
   */
  async roleCredit({ userId, role, amount, type = 'credit', referenceId, description, paymentId, gateway = 'internal', meta = {} }) {
    if (!amount || amount <= 0) throw ApiError.badRequest('Credit amount must be positive.');
    const uid = userId.toString();
    const refId = referenceId || `rc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Idempotency check
    if (referenceId) {
      const existing = await IsolatedTransaction.findOne({ reference_id: referenceId, userId: uid, role, status: 'success' });
      if (existing) {
        logger.warn(`Duplicate role credit prevented: ${referenceId} for ${uid}/${role}`, { service: 'wallet' });
        return { transaction: existing, wallet: await this.getRoleBalance(uid, role), duplicate: true };
      }
    }

    const session = await mongoose.startSession();
    let txn, updatedBalance;

    try {
      await session.withTransaction(async () => {
        const wallet = await this.getRoleWallet(uid, role, session);
        if (wallet.is_frozen) throw ApiError.badRequest(`${role} wallet is frozen.`);

        const previousBalance = wallet.balance || 0;
        updatedBalance = previousBalance + parseFloat(amount);

        await IsolatedWallet.updateOne(
          { userId: uid, role },
          { $inc: { balance: parseFloat(amount), lifetime_earned: parseFloat(amount) } },
          { session }
        );

        const txnArr = await IsolatedTransaction.create([{
          userId: uid,
          role,
          walletId: wallet._id,
          type,
          amount: parseFloat(amount),
          previous_balance: previousBalance,
          updated_balance: updatedBalance,
          paymentId: paymentId || null,
          gateway,
          description: description || null,
          reference_id: refId,
          status: 'success',
          meta,
        }], { session });
        txn = txnArr[0];
      });

      await cache.deleteCache(`wallet:role:${uid}:${role}`);
      walletEvents._emitWalletUpdate(uid, updatedBalance, 'credit', parseFloat(amount), description);
      logger.info(`Role credit: +${amount} to ${uid}/${role} (${type})`, { service: 'wallet' });
      return { transaction: txn, wallet: { balance: updatedBalance, role } };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Debit a role-isolated wallet.
   */
  async roleDebit({ userId, role, amount, type = 'debit', referenceId, description, paymentId, gateway = 'internal', meta = {} }) {
    if (!amount || amount <= 0) throw ApiError.badRequest('Debit amount must be positive.');
    const uid = userId.toString();
    const refId = referenceId || `rd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Idempotency check
    if (referenceId) {
      const existing = await IsolatedTransaction.findOne({ reference_id: referenceId, userId: uid, role, status: 'success' });
      if (existing) {
        logger.warn(`Duplicate role debit prevented: ${referenceId} for ${uid}/${role}`, { service: 'wallet' });
        return { transaction: existing, wallet: await this.getRoleBalance(uid, role), duplicate: true };
      }
    }

    const session = await mongoose.startSession();
    let txn, updatedBalance;

    try {
      await session.withTransaction(async () => {
        const wallet = await this.getRoleWallet(uid, role, session);
        if (wallet.is_frozen) throw ApiError.badRequest(`${role} wallet is frozen.`);

        const previousBalance = wallet.balance || 0;
        if (parseFloat(amount) > previousBalance) {
          throw ApiError.badRequest(`Insufficient ${role} wallet balance. Available: ₹${previousBalance}, Required: ₹${amount}`);
        }
        updatedBalance = previousBalance - parseFloat(amount);

        await IsolatedWallet.updateOne(
          { userId: uid, role },
          { $inc: { balance: -parseFloat(amount), lifetime_spent: parseFloat(amount) } },
          { session }
        );

        const txnArr = await IsolatedTransaction.create([{
          userId: uid,
          role,
          walletId: wallet._id,
          type,
          amount: parseFloat(amount),
          previous_balance: previousBalance,
          updated_balance: updatedBalance,
          paymentId: paymentId || null,
          gateway,
          description: description || null,
          reference_id: refId,
          status: 'success',
          meta,
        }], { session });
        txn = txnArr[0];
      });

      await cache.deleteCache(`wallet:role:${uid}:${role}`);
      walletEvents._emitWalletUpdate(uid, updatedBalance, 'debit', parseFloat(amount), description);
      logger.info(`Role debit: -${amount} from ${uid}/${role} (${type})`, { service: 'wallet' });
      return { transaction: txn, wallet: { balance: updatedBalance, role } };
    } finally {
      await session.endSession();
    }
  }
}

module.exports = new WalletIsolatedService();
