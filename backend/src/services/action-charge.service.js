const mongoose = require('mongoose');
const { Wallet } = require('../models/Phase4');
const WalletTransactionV2 = require('../models/WalletTransactionV2.model');
const ActionDedup = require('../models/ActionDedup');
const { AppSettings } = require('../models/Admin');
const User = require('../models/User');
const { emitToUser } = require('../sockets');
const logger = require('../utils/logger');

const DEFAULT_RATES = {
  uniqueView: 0.20,
  whatsapp: 2.50,
  callConnected: 2.50,
  firstChatMessage: 0.10,
  inquiry: 0.10,
  orderRequest: 5.00,
  reelBoost1Day: 2.00,
  reelBoostAdditional: 2.00,
  dedupWindowHours: 24,
};

let cachedRates = null;
let lastCacheTime = 0;

class ActionChargeService {
  /**
   * Clear cache when admin modifies credit rates
   */
  clearCache() {
    cachedRates = null;
    lastCacheTime = 0;
  }

  /**
   * Fetch current configurable action rates with 60-second caching
   */
  async getRates() {
    const now = Date.now();
    if (cachedRates && now - lastCacheTime < 60000) {
      return cachedRates;
    }

    try {
      const setting = await AppSettings.findOne({ key: 'credit_rates' }).lean();
      cachedRates = { ...DEFAULT_RATES, ...(setting?.value || {}) };
      const boostRate = Number(cachedRates.reelBoost1Day ?? cachedRates.reelBoostAdditional ?? 2.00);
      cachedRates.reelBoost1Day = boostRate;
      cachedRates.reelBoostAdditional = boostRate;
      lastCacheTime = now;
    } catch (e) {
      cachedRates = { ...DEFAULT_RATES };
    }

    return cachedRates;
  }

  /**
   * Universal customer action deduction engine with 24-hour deduplication
   * @param {Object} params
   * @param {string} params.vendorId - Target vendor user ID
   * @param {string} params.customerId - Customer user ID triggering action
   * @param {string} [params.targetId] - Listing, Reel, or Form ID
   * @param {string} params.actionType - 'view' | 'whatsapp' | 'chat' | 'inquiry' | 'order' | 'call'
   * @param {Object} [params.metadata]
   */
  async deductAction({ vendorId, customerId, targetId = 'general', actionType, metadata = {} }) {
    if (!vendorId || !customerId || !actionType) {
      return { charged: false, reason: 'missing_parameters' };
    }

    const vId = vendorId.toString();
    const cId = customerId.toString();
    const tId = (targetId || 'general').toString();

    // Prevent vendors from being charged for their own self-actions
    if (vId === cId) {
      return { charged: false, reason: 'self_interaction' };
    }

    const rates = await this.getRates();

    let rateCost = 0;
    let txnType = 'action_charge';

    switch (actionType) {
      case 'view':
        rateCost = rates.uniqueView || 0.20;
        txnType = 'unique_view';
        break;
      case 'whatsapp':
        rateCost = rates.whatsapp || 2.50;
        txnType = 'whatsapp_lead';
        break;
      case 'chat':
        rateCost = rates.firstChatMessage || 0.10;
        txnType = 'chat_first_message';
        break;
      case 'inquiry':
        rateCost = rates.inquiry || 0.10;
        txnType = 'inquiry';
        break;
      case 'order':
        rateCost = rates.orderRequest || 5.00;
        txnType = 'order_request';
        break;
      case 'call':
        rateCost = rates.callConnected || 2.50;
        txnType = 'call_connected';
        break;
      default:
        return { charged: false, deducted: false, reason: 'unsupported_action' };
    }

    // ── 24-Hour Deduplication Window Check ──
    const dedupWindowHours = rates.dedupWindowHours || 24;
    const dedupKey = `${cId}_${vId}_${tId}_${actionType}`;

    const existingDedup = await ActionDedup.findOne({ dedup_key: dedupKey });
    if (existingDedup) {
      return {
        charged: false,
        deducted: false,
        reason: 'duplicate_within_charge_window',
        windowHours: dedupWindowHours,
      };
    }

    // ── Check Vendor Wallet ──
    let wallet = await Wallet.findOne({ user_id: vId });
    if (!wallet) {
      const user = await User.findById(vId).select('walletBalance wallet_credits free_reel_boosts').lean();
      const initialCredits = Number(user?.wallet_credits ?? user?.walletBalance ?? 0);
      const initialBoosts = Number(user?.free_reel_boosts ?? 0);
      wallet = await Wallet.create({
        user_id: vId,
        credits: initialCredits,
        balance_inr_paise: 0,
        free_reel_boosts: initialBoosts,
      });
    } else if ((wallet.credits === undefined || wallet.credits === 0) && wallet.balance_inr_paise === 0) {
      const user = await User.findById(vId).select('walletBalance wallet_credits free_reel_boosts').lean();
      const userCreds = Number(user?.wallet_credits ?? user?.walletBalance ?? 0);
      if (userCreds > 0) {
        wallet.credits = userCreds;
        await Wallet.updateOne({ user_id: vId }, { $set: { credits: userCreds } });
      }
    }

    if (wallet.is_frozen) {
      return { charged: false, deducted: false, reason: 'wallet_frozen' };
    }

    const previousBalance = wallet.credits || 0;

    // Safeguard: Ensure wallet never goes negative
    if (previousBalance < rateCost) {
      logger.warn(`Insufficient credits for vendor ${vId} for action ${actionType} (Needed: ${rateCost}, Has: ${previousBalance})`);
      return {
        charged: false,
        deducted: false,
        reason: 'insufficient_vendor_credits',
        available: previousBalance,
        required: rateCost,
      };
    }

    const updatedBalance = Math.max(0, Number((previousBalance - rateCost).toFixed(2)));

    // ── Atomic Conditional Wallet Update (Guarantees balance never goes negative) ──
    const updateResult = await Wallet.updateOne(
      { user_id: vId, credits: { $gte: rateCost }, is_frozen: { $ne: true } },
      {
        $inc: { credits: -rateCost, lifetime_spent_credits: rateCost },
        $set: { updated_at: new Date().toISOString() },
      }
    );

    if (updateResult.matchedCount === 0) {
      logger.warn(`Atomic decrement failed: concurrent request depleted vendor ${vId} credits below ${rateCost}`);
      return {
        charged: false,
        deducted: false,
        reason: 'insufficient_vendor_credits',
        available: 0,
        required: rateCost,
      };
    }

    // Sync User.walletBalance
    await User.updateOne({ _id: vId }, { $inc: { walletBalance: -rateCost } });

    // ── Record Transaction in Ledger ──
    const vendorUser = await User.findById(vId).select('name current_role').lean();
    const refId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await WalletTransactionV2.create({
      user_id: vId,
      user_name: vendorUser?.name || 'Vendor',
      user_role: vendorUser?.current_role || 'vendor',
      transaction_type: txnType,
      credit_debit: 'debit',
      amount: rateCost,
      previous_balance: previousBalance,
      updated_balance: updatedBalance,
      payment_method: 'internal',
      source: 'system',
      status: 'completed',
      reference_id: refId,
      admin_remarks: `Customer ${actionType.toUpperCase()} on item: ${tId} (-${rateCost} Credits)`,
      meta: {
        customer_id: cId,
        target_id: tId,
        action_type: actionType,
        ...metadata,
      },
    });

    // ── Record Dedup Entry (TTL 24h) ──
    const expiresAt = new Date(Date.now() + dedupWindowHours * 60 * 60 * 1000);
    try {
      await ActionDedup.create({
        dedup_key: dedupKey,
        customer_id: cId,
        vendor_id: vId,
        target_id: tId,
        action_type: actionType,
        credits_charged: rateCost,
        expires_at: expiresAt,
      });
    } catch (err) {
      // Ignore duplicate key race condition
    }

    // ── Real-time Socket Dispatch to Vendor ──
    try {
      emitToUser(vId, 'wallet:updated', {
        credits: updatedBalance,
        change: -rateCost,
        action: actionType,
      });
    } catch (e) {}

    return {
      charged: true,
      deducted: true,
      deductedAmount: rateCost,
      creditsDeducted: rateCost,
      newBalance: updatedBalance,
      referenceId: refId,
    };
  }

  /**
   * Deduct Reel Boost with Free Boost Priority
   * If vendor has free_reel_boosts > 0, deducts 1 boost (0 credits).
   * Otherwise deducts durationDays * ratePerDay (2.00 Credits/day) from wallet.
   */
  async deductReelBoost({ vendorId, reelId, durationDays = 1 }) {
    const vId = vendorId.toString();
    const rates = await this.getRates();
    const days = Math.max(1, parseInt(durationDays || 1, 10));
    const ratePerDay = Number(rates.reelBoost1Day || rates.reelBoostAdditional || 2.00);
    const boostCost = Number((days * ratePerDay).toFixed(2));

    let wallet = await Wallet.findOne({ user_id: vId });
    if (!wallet) {
      const user = await User.findById(vId).select('walletBalance wallet_credits free_reel_boosts').lean();
      wallet = await Wallet.create({
        user_id: vId,
        credits: Number(user?.wallet_credits ?? user?.walletBalance ?? 0),
        free_reel_boosts: Number(user?.free_reel_boosts ?? 0),
        balance_inr_paise: 0,
      });
    } else if (wallet.free_reel_boosts === undefined) {
      const user = await User.findById(vId).select('free_reel_boosts').lean();
      if (user?.free_reel_boosts > 0) {
        wallet.free_reel_boosts = user.free_reel_boosts;
        await Wallet.updateOne({ user_id: vId }, { $set: { free_reel_boosts: user.free_reel_boosts } });
      }
    }

    const freeBoosts = wallet.free_reel_boosts || 0;

    if (freeBoosts > 0) {
      // Consume 1 Free Boost
      await Wallet.updateOne(
        { user_id: vId },
        {
          $inc: { free_reel_boosts: -1 },
          $set: { updated_at: new Date().toISOString() },
        }
      );
      await User.updateOne({ _id: vId }, { $inc: { free_reel_boosts: -1 } });

      const refId = `boost_free_${Date.now()}`;
      await WalletTransactionV2.create({
        user_id: vId,
        user_name: 'Vendor',
        user_role: 'vendor',
        transaction_type: 'reel_boost',
        credit_debit: 'debit',
        amount: 0,
        previous_balance: wallet.credits || 0,
        updated_balance: wallet.credits || 0,
        payment_method: 'internal',
        source: 'system',
        status: 'completed',
        reference_id: refId,
        admin_remarks: `Free Reel Boost Applied for ${days} days (1 used, ${freeBoosts - 1} remaining)`,
        meta: { reel_id: reelId, free_boost_used: true, duration_days: days },
      });

      try {
        emitToUser(vId, 'wallet:updated', {
          credits: wallet.credits || 0,
          free_reel_boosts: freeBoosts - 1,
        });
      } catch (e) {}

      return {
        success: true,
        type: 'free_boost',
        usedFreeBoost: true,
        durationDays: days,
        ratePerDay,
        freeBoostRemaining: freeBoosts - 1,
        remainingFreeBoosts: freeBoosts - 1,
        deductedAmount: 0,
        creditsDeducted: 0,
      };
    }

    // No free boosts -> Check credit balance for durationDays * ratePerDay (2.00 Credits/day)
    const previousCredits = wallet.credits || 0;
    if (previousCredits < boostCost) {
      throw new Error(`Insufficient credits to boost reel for ${days} days. Needed: ${boostCost.toFixed(2)} Credits (${days} days × ${ratePerDay.toFixed(2)} Credits/day), Available: ${previousCredits.toFixed(2)} Credits. Please recharge your wallet.`);
    }

    const updatedCredits = Math.max(0, Number((previousCredits - boostCost).toFixed(2)));

    await Wallet.updateOne(
      { user_id: vId },
      {
        $inc: { credits: -boostCost, lifetime_spent_credits: boostCost },
        $set: { updated_at: new Date().toISOString() },
      }
    );

    await User.updateOne({ _id: vId }, { $inc: { walletBalance: -boostCost } });

    const refId = `boost_paid_${Date.now()}`;
    await WalletTransactionV2.create({
      user_id: vId,
      user_name: 'Vendor',
      user_role: 'vendor',
      transaction_type: 'reel_boost',
      credit_debit: 'debit',
      amount: boostCost,
      previous_balance: previousCredits,
      updated_balance: updatedCredits,
      payment_method: 'internal',
      source: 'system',
      status: 'completed',
      reference_id: refId,
      admin_remarks: `Reel Boost for ${days} days (-${boostCost.toFixed(2)} Credits at ${ratePerDay.toFixed(2)} Credits/day)`,
      meta: { reel_id: reelId, free_boost_used: false, duration_days: days, rate_per_day: ratePerDay },
    });

    try {
      emitToUser(vId, 'wallet:updated', {
        credits: updatedCredits,
        free_reel_boosts: 0,
      });
    } catch (e) {}

    return {
      success: true,
      type: 'credits',
      usedFreeBoost: false,
      durationDays: days,
      ratePerDay,
      freeBoostRemaining: 0,
      remainingFreeBoosts: 0,
      deductedAmount: boostCost,
      creditsDeducted: boostCost,
      newBalance: updatedCredits,
      referenceId: refId,
    };
  }
}

module.exports = new ActionChargeService();
