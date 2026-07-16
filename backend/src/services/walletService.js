const walletRepository = require('../repositories/walletRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const PLANS = {
  premium: { cost: 499, durationDays: 30, boostCredits: 10 },
  business: { cost: 999, durationDays: 30, boostCredits: 25 },
  creator: { cost: 299, durationDays: 30, boostCredits: 5 },
};

/**
 * WalletService
 * Coordinates deposits, pricing tiers, plans purchases, and history inquiries.
 */
class WalletService {
  async rechargeWallet({ userId, amount, referenceId }) {
    if (!amount || amount <= 0) {
      throw ApiError.badRequest('Deposit amount must be positive.');
    }

    logger.info(`Recharging wallet for user: ${userId} with amount: ₹${amount}`, { service: 'wallet' });

    const result = await walletRepository.updateWalletBalance(
      userId,
      parseFloat(amount),
      'deposit',
      referenceId || `dep_${Date.now()}`,
      'Recharged wallet balance.'
    );

    return result;
  }

  async getTransactions(userId) {
    return walletRepository.getTransactionsForUser(userId);
  }

  async purchasePlan({ userId, plan }) {
    const activePlan = plan.toLowerCase();
    if (!PLANS[activePlan]) {
      throw ApiError.badRequest(`Invalid subscription plan: "${plan}".`);
    }

    const { cost, durationDays, boostCredits } = PLANS[activePlan];

    logger.info(`Processing subscription to plan "${plan.toUpperCase()}" for user: ${userId}`, { service: 'subscription' });

    const result = await walletRepository.purchaseSubscription(
      userId,
      activePlan,
      cost,
      durationDays,
      boostCredits
    );

    return result;
  }
}

module.exports = new WalletService();
module.exports.PLANS = PLANS;
