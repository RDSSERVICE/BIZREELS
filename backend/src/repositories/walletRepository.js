const mongoose = require('mongoose');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * WalletRepository
 * Handles transactions and wallet logic.
 */
class WalletRepository {
  async createTransaction(transactionData) {
    return WalletTransaction.create(transactionData);
  }

  async getTransactionsForUser(userId) {
    return WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Safe double-entry wallet adjustment with session protection.
   */
  async updateWalletBalance(userId, amount, type, referenceId, description) {
    const session = await mongoose.startSession();
    try {
      let transaction;
      let updatedUser;

      await session.withTransaction(async () => {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error('User not found.');

        const newBalance = user.walletBalance + amount;
        if (newBalance < 0) {
          throw new Error('Insufficient wallet balance.');
        }

        // Create transaction history
        const transRecord = await WalletTransaction.create(
          [
            {
              user: userId,
              type,
              amount: Math.abs(amount),
              status: 'completed',
              referenceId,
              description,
            },
          ],
          { session }
        );
        transaction = transRecord[0];

        // Update user balance
        updatedUser = await User.findByIdAndUpdate(
          userId,
          { $inc: { walletBalance: amount } },
          { returnDocument: 'after', session }
        );
      });

      return { transaction, user: updatedUser };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Safe purchase of a premium business or creator subscription using wallet credits.
   */
  async purchaseSubscription(userId, planId, planName, planType, billingCycle, cost, durationDays, boostCredits) {
    const session = await mongoose.startSession();
    try {
      let transaction;
      let updatedUser;

      await session.withTransaction(async () => {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error('User not found.');

        if (user.walletBalance < cost) {
          throw new Error('Insufficient balance to purchase subscription.');
        }

        // Deduct wallet balance
        const transRecord = await WalletTransaction.create(
          [
            {
              user: userId,
              type: 'payment',
              amount: cost,
              status: 'completed',
              description: `Subscribed to ${planName} plan`,
            },
          ],
          { session }
        );
        transaction = transRecord[0];

        // Calculate expiresAt
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        // Update subscription data & balance
        updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            $inc: { walletBalance: -cost },
            $set: {
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

        // Manage UserSubscription records
        const UserSubscription = require('../models/UserSubscription.model');
        
        // 1. Deactivate existing active subscriptions
        await UserSubscription.updateMany(
          { user_id: userId.toString(), status: 'active' },
          { $set: { status: 'cancelled', cancelled_at: new Date(), cancelled_reason: 'Upgraded/Changed subscription' } },
          { session }
        );

        // 2. Create the new UserSubscription document
        const userRole = user.current_role || (user.roles && user.roles[0]) || 'vendor';
        await UserSubscription.create(
          [
            {
              user_id: userId.toString(),
              user_name: user.name || '',
              user_role: userRole,
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
            },
          ],
          { session }
        );
      });

      // Emit socket notification for real-time update
      try {
        const { emitToRole, emitToUser } = require('../sockets');
        emitToUser(userId.toString(), 'subscription:updated', { updated: true });
        emitToRole('admin', 'subscription:updated', { updated: true });
      } catch (err) {}

      return { transaction, user: updatedUser };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Safe request payout withdrawal with status: 'pending'
   */
  async requestWithdrawal(userId, amount) {
    const session = await mongoose.startSession();
    try {
      let transaction;
      let updatedUser;

      await session.withTransaction(async () => {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error('User not found.');

        if (user.walletBalance < amount) {
          throw new Error('Insufficient wallet balance for withdrawal.');
        }

        // Create transaction history with status: 'pending'
        const transRecord = await WalletTransaction.create(
          [
            {
              user: userId,
              type: 'withdrawal',
              amount: Math.abs(amount),
              status: 'pending',
              referenceId: `pay_${Date.now()}`,
              description: 'Payout withdrawal request.',
            },
          ],
          { session }
        );
        transaction = transRecord[0];

        // Update user balance (deduct the amount)
        updatedUser = await User.findByIdAndUpdate(
          userId,
          { $inc: { walletBalance: -amount } },
          { returnDocument: 'after', session }
        );
      });

      return { transaction, user: updatedUser };
    } finally {
      await session.endSession();
    }
  }
}

module.exports = new WalletRepository();
