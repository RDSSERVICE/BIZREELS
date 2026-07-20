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
  async purchaseSubscription(userId, plan, cost, durationDays, boostCredits) {
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
              description: `Subscribed to ${plan.toUpperCase()} plan`,
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
                plan,
                startedAt: new Date(),
                expiresAt,
                boostCredits,
                autoRenew: false,
              },
            },
          },
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
