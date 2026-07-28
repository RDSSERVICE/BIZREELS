const walletRepository = require('../repositories/walletRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const PLANS = {
  free: { cost: 0, durationDays: 9999, boostCredits: 0 },
  growth: { cost: 1500, durationDays: 30, boostCredits: 1 },
  ultimate: { cost: 3500, durationDays: 30, boostCredits: 3 },
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
    const mongoose = require('mongoose');
    const { SubscriptionPlan } = require('../models/Admin');

    let planId = null;
    let planName = '';
    let planType = 'basic';
    let billingCycle = 'monthly';
    let cost = 0;
    let durationDays = 30;
    let boostCredits = 0;

    let planDoc = null;
    if (mongoose.Types.ObjectId.isValid(plan)) {
      planDoc = await SubscriptionPlan.findById(plan);
    }
    if (!planDoc) {
      planDoc = await SubscriptionPlan.findOne({
        title: { $regex: new RegExp(`^${plan}$`, 'i') },
        is_deleted: { $ne: true }
      });
    }

    if (planDoc) {
      planId = planDoc._id.toString();
      planName = planDoc.title;
      planType = planDoc.plan_type || 'basic';
      billingCycle = planDoc.billing_cycle || 'monthly';
      cost = planDoc.price_inr;
      durationDays = planDoc.duration_days || 30;
      boostCredits = planDoc.ai_credits || 0;
    } else {
      const activePlan = plan.toLowerCase();
      if (!PLANS[activePlan]) {
        throw ApiError.badRequest(`Invalid subscription plan: "${plan}".`);
      }
      const legacyPlan = PLANS[activePlan];
      planId = `static_${activePlan}`;
      planName = plan;
      planType = 'basic';
      billingCycle = 'monthly';
      cost = legacyPlan.cost;
      durationDays = legacyPlan.durationDays || 30;
      boostCredits = legacyPlan.boostCredits || 0;
    }

    logger.info(`Processing subscription to plan "${planName}" for user: ${userId} (Cost: ₹${cost})`, { service: 'subscription' });

    const result = await walletRepository.purchaseSubscription(
      userId,
      planId,
      planName,
      planType,
      billingCycle,
      cost,
      durationDays,
      boostCredits
    );

    return result;
  }

  async getOrCreate(userId) {
    return { user_id: userId, balance: 0, credits: 0 };
  }

  async earnCredits(userId, amount, reason) {
    return this.rechargeWallet({ userId, amount });
  }

  async spendCredits(userId, amount, reason) {
    return { ok: true };
  }

  async depositInr(userId, paise, reason) {
    return this.rechargeWallet({ userId, amount: paise / 100 });
  }

  async purchaseInr(userId, paise, reason) {
    return { ok: true };
  }

  async listTransactions(userId) {
    return this.getTransactions(userId);
  }

  async requestPayout({ userId, amount }) {
    if (!amount || amount <= 0) {
      throw ApiError.badRequest('Payout amount must be positive.');
    }
    const result = await walletRepository.requestWithdrawal(userId, parseFloat(amount));
    return result;
  }

  async backfillAll() {
    return { ok: true };
  }
}

const serviceInstance = new WalletService();
serviceInstance.PLANS = PLANS;

module.exports = serviceInstance;
