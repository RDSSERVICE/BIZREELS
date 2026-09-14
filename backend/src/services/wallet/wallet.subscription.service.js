const mongoose = require('mongoose');
const { Wallet } = require('../../models/Phase4');
const WalletTransactionV2 = require('../../models/WalletTransactionV2.model');
const User = require('../../models/User');
const { SubscriptionPlan } = require('../../models/Admin');
const UserSubscription = require('../../models/UserSubscription.model');
const IsolatedWallet = require('../../models/IsolatedWallet.model');
const IsolatedTransaction = require('../../models/IsolatedTransaction.model');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const walletEvents = require('./wallet.events');
const walletCoreService = require('./wallet.core.service');

/**
 * Wallet Subscription Service
 * Handles plan subscriptions, credit plan recharges, add-on purchases, and direct Razorpay purchases.
 */
class WalletSubscriptionService {
  /**
   * Recharge Vendor Credit Plan (Starter, Growth, Business)
   */
  async rechargeCreditPlan({ userId, planId, paymentId = null, paymentMethod = 'razorpay' }) {
    const uid = userId.toString();

    let planDoc = null;
    if (mongoose.Types.ObjectId.isValid(planId)) {
      planDoc = await SubscriptionPlan.findById(planId);
    }
    if (!planDoc) {
      planDoc = await SubscriptionPlan.findOne({
        title: { $regex: new RegExp(`^${planId}$`, 'i') },
        is_deleted: { $ne: true },
      });
    }
    if (!planDoc) {
      throw ApiError.badRequest(`Invalid credit plan: "${planId}".`);
    }

    const creditsToAdd = Number(planDoc.wallet_credits || 0);
    const freeBoostsToAdd = Number(planDoc.free_reel_boosts || 0);
    const refId = paymentId || `rech_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Get or create vendor wallet
    const wallet = await walletCoreService.getOrCreateWallet(uid);
    const previousCredits = wallet.credits || 0;
    const previousBoosts = wallet.free_reel_boosts || 0;
    const updatedCredits = Number((previousCredits + creditsToAdd).toFixed(2));
    const updatedBoosts = previousBoosts + freeBoostsToAdd;

    // Accumulate credits and free boosts
    await Wallet.updateOne(
      { user_id: uid },
      {
        $inc: {
          credits: creditsToAdd,
          lifetime_earned_credits: creditsToAdd,
          free_reel_boosts: freeBoostsToAdd,
        },
        $set: { updated_at: new Date().toISOString() },
      }
    );

    // Sync User walletBalance and vendor profile subscription
    const userUpdate = {
      $inc: { walletBalance: creditsToAdd },
      $set: {
        'vendorProfile.subscription.plan': planDoc.title,
        'vendorProfile.subscription.price': planDoc.price_inr,
        'vendorProfile.subscription.purchasedAt': new Date(),
      },
    };
    if (planDoc.verified_badge) {
      userUpdate.$set.is_subscribed_verified = true;
    }
    await User.updateOne({ _id: uid }, userUpdate);

    // Record transaction in ledger
    const user = await User.findById(uid).select('name current_role').lean();
    const txn = await WalletTransactionV2.create({
      user_id: uid,
      user_name: user?.name || 'Vendor',
      user_role: 'vendor',
      transaction_type: 'plan_recharge',
      credit_debit: 'credit',
      amount: creditsToAdd,
      previous_balance: previousCredits,
      updated_balance: updatedCredits,
      payment_method: paymentMethod,
      source: 'razorpay',
      status: 'completed',
      reference_id: refId,
      admin_remarks: `Plan Recharge: ${planDoc.title} (+${creditsToAdd} Credits, +${freeBoostsToAdd} Free Reel Boosts)`,
      meta: {
        plan_id: planDoc._id.toString(),
        plan_title: planDoc.title,
        price_inr: planDoc.price_inr,
        free_reel_boosts_added: freeBoostsToAdd,
        payment_id: paymentId,
      },
    });

    // Update or create UserSubscription record
    await UserSubscription.create({
      user_id: uid,
      user_name: user?.name || 'Vendor',
      user_role: 'vendor',
      plan_id: planDoc._id.toString(),
      plan_name: planDoc.title,
      billing_cycle: 'recharge',
      start_date: new Date(),
      expiry_date: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // Non-expiring (100 years placeholder)
      status: 'active',
      payment_id: paymentId,
      paid_amount: planDoc.price_inr,
      original_amount: planDoc.price_inr,
      meta: {
        wallet_credits_added: creditsToAdd,
        free_reel_boosts_added: freeBoostsToAdd,
      },
    });

    // Real-time events
    try {
      walletEvents._emitWalletUpdate(uid, updatedCredits, 'credit', creditsToAdd, `Recharged ${planDoc.title}`);
      const { emitToUser } = require('../../sockets');
      emitToUser(uid, 'subscription:updated', {
        plan: planDoc.title,
        credits: updatedCredits,
        free_reel_boosts: updatedBoosts,
      });
    } catch (e) {}

    return {
      success: true,
      plan: planDoc.title,
      creditsAdded: creditsToAdd,
      freeBoostsAdded: freeBoostsToAdd,
      walletBalance: updatedCredits,
      freeReelBoosts: updatedBoosts,
      transaction: txn,
    };
  }

  /**
   * Purchase Plan (Subscription Deduction from Credits / Creator balance)
   */
  async purchasePlan({ userId, plan, selected_addons = [] }) {
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
    const baseCost = planDoc.price_inr;
    let addonsTotal = 0;
    const validatedAddons = [];
    if (Array.isArray(selected_addons)) {
      for (const a of selected_addons) {
        const p = Number(a.price_inr || 0);
        addonsTotal += p;
        validatedAddons.push({
          id: a.id || `addon_${Date.now()}`,
          title: a.title || 'Add-on',
          price_inr: p,
          quota_type: a.quota_type,
          quota_value: a.quota_value,
        });
      }
    }

    const cost = baseCost + addonsTotal;
    const durationDays = planDoc.duration_days || 30;
    const refId = `sub_${planDoc._id}_${Date.now()}`;
    const targetRole = planDoc.target_role || (planDoc.role === 'creator' || String(planDoc.title).toLowerCase().includes('creator') ? 'creator' : 'vendor');

    // Prevent duplicate subscription purchase if no add-ons (non-vendor only)
    if (targetRole !== 'vendor') {
      const activeSub = await UserSubscription.findOne({
        user_id: uid,
        user_role: targetRole,
        status: 'active',
        plan_id: planDoc._id.toString(),
        is_deleted: { $ne: true }
      });
      if (activeSub && (!selected_addons || selected_addons.length === 0)) {
        throw ApiError.badRequest(`You already have an active subscription for the "${planDoc.title}" plan.`);
      }
    }

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
        let previousBalance = 0;

        if (targetRole === 'creator') {
          // Check Creator Isolated Wallet
          let isoWallet = await IsolatedWallet.findOne({ userId: uid, role: 'creator' }).session(session);
          if (!isoWallet) {
            const createdIso = await IsolatedWallet.create([{
              userId: uid,
              role: 'creator',
              balance: 0,
              currency: 'INR',
              lifetime_earned: 0,
              lifetime_spent: 0,
              is_frozen: false,
              status: 'active',
            }], { session });
            isoWallet = createdIso[0];
          }
          if (isoWallet.is_frozen) throw ApiError.badRequest('Creator wallet is frozen.');
          previousBalance = isoWallet.balance || 0;
          if (cost > previousBalance) {
            throw ApiError.badRequest(`Insufficient creator wallet balance. Available: ₹${previousBalance}, Required: ₹${cost}`);
          }
          updatedBalance = previousBalance - cost;

          await IsolatedWallet.updateOne(
            { userId: uid, role: 'creator' },
            { $inc: { balance: -cost, lifetime_spent: cost } },
            { session }
          );

          await IsolatedTransaction.create([{
            userId: uid,
            role: 'creator',
            walletId: isoWallet._id,
            type: 'subscription_purchase',
            amount: cost,
            previous_balance: previousBalance,
            updated_balance: updatedBalance,
            paymentId: refId,
            gateway: 'internal',
            description: `Subscribed to ${planDoc.title}`,
            reference_id: `iso_${refId}`,
            status: 'success',
          }], { session });
        } else {
          // Check Vendor Wallet
          const wallet = await walletCoreService.getOrCreateWallet(uid, session);
          if (wallet.is_frozen) throw ApiError.badRequest('Wallet is frozen.');

          previousBalance = wallet.credits || 0;
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

          // Sync vendor isolated wallet if exists
          try {
            await IsolatedWallet.updateOne(
              { userId: uid, role: 'vendor' },
              { $inc: { balance: -cost, lifetime_spent: cost } },
              { session }
            );
          } catch (e) {}
        }

        // Create wallet transaction
        const user = await User.findById(userId).select('name current_role roles').session(session).lean();
        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        const txnArr = await WalletTransactionV2.create([{
          user_id: uid,
          user_name: user?.name || 'Unknown',
          user_role: targetRole,
          transaction_type: 'subscription_purchase',
          credit_debit: 'debit',
          amount: cost,
          previous_balance: previousBalance,
          updated_balance: updatedBalance,
          payment_method: 'wallet',
          source: 'subscription',
          status: 'completed',
          reference_id: refId,
          admin_remarks: `Subscribed to ${planDoc.title} ${validatedAddons.length > 0 ? `with ${validatedAddons.length} Add-on(s)` : ''}`,
          meta: {
            plan_id: planDoc._id.toString(),
            plan_name: planDoc.title,
            duration_days: durationDays,
            base_plan_price: baseCost,
            addons_total: addonsTotal,
            selected_addons: validatedAddons,
            role: targetRole,
          },
        }], { session });
        txn = txnArr[0];

        // Deactivate existing active subscriptions for THIS role only
        await UserSubscription.updateMany(
          { user_id: uid, user_role: targetRole, status: 'active' },
          { $set: { status: 'cancelled', cancelled_at: new Date(), cancelled_reason: 'New plan purchased' } },
          { session }
        );

        // Create new subscription record
        await UserSubscription.create([{
          user_id: uid,
          user_name: user?.name || '',
          user_role: targetRole,
          plan_id: planDoc._id.toString(),
          plan_name: planDoc.title,
          plan_type: planDoc.plan_type || 'basic',
          billing_cycle: planDoc.billing_cycle || 'monthly',
          start_date: new Date(),
          expiry_date: expiresAt,
          auto_renewal: false,
          status: 'active',
          base_plan_price: baseCost,
          addons_total: addonsTotal,
          selected_addons: validatedAddons,
          original_amount: cost,
          paid_amount: cost,
          payment_method: 'wallet',
        }], { session });

        // Update user subscription flag for the role
        const subData = {
          plan: planDoc.title,
          plan_id: planDoc._id.toString(),
          selected_addons: validatedAddons,
          startedAt: new Date(),
          expiresAt,
          autoRenew: false,
          status: 'active',
        };

        const updateSet = {};
        if (targetRole === 'creator') {
          updateSet['creatorProfile.subscription'] = subData;
          updateSet['creatorProfile.is_subscribed_verified'] = true;
        } else {
          updateSet['is_subscribed_verified'] = true;
          updateSet['subscription'] = subData;
          updateSet['vendorProfile.subscription'] = subData;
        }

        // Apply bonus AI credits if add-ons include ai_credits
        const bonusAiCredits = validatedAddons
          .filter(a => a.quota_type === 'ai_credits' && Number(a.quota_value) > 0)
          .reduce((sum, a) => sum + Number(a.quota_value), 0);
        if (bonusAiCredits > 0) {
          updateSet['$inc'] = { ai_credits: bonusAiCredits };
        }

        await User.updateOne(
          { _id: userId },
          updateSet['$inc'] ? { $set: Object.fromEntries(Object.entries(updateSet).filter(([k]) => k !== '$inc')), $inc: updateSet['$inc'] } : { $set: updateSet },
          { session }
        );
      });

      // Emit real-time events AFTER commit
      walletEvents._emitWalletUpdate(uid, updatedBalance, 'debit', cost, `Subscribed to ${planDoc.title}`);
      walletEvents._emitSubscriptionUpdate(uid);

      logger.info(`Subscription purchase: ${planDoc.title} by user ${uid} (-₹${cost})`, { service: 'wallet' });
      return {
        transaction: walletEvents._serializeTxn(txn),
        user: { walletBalance: updatedBalance, subscription: { plan: planDoc.title } },
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Purchase Plan Direct (Razorpay — no wallet debit)
   */
  async purchasePlanDirect({ userId, planId, paymentId, razorpayPaymentId, selected_addons = [] }) {
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
    const targetRole = planDoc.target_role || (planDoc.role === 'creator' || String(planDoc.title).toLowerCase().includes('creator') ? 'creator' : 'vendor');

    // For non-vendor plans, prevent duplicate active subscription
    if (targetRole !== 'vendor') {
      const activeSub = await UserSubscription.findOne({
        user_id: uid,
        user_role: targetRole,
        status: 'active',
        plan_id: planDoc._id.toString(),
        is_deleted: { $ne: true }
      });
      if (activeSub && (!selected_addons || selected_addons.length === 0)) {
        throw ApiError.badRequest(`You already have an active subscription for the "${planDoc.title}" plan.`);
      }
    }

    const baseCost = planDoc.price_inr;
    let addonsTotal = 0;
    const validatedAddons = [];
    if (Array.isArray(selected_addons)) {
      for (const a of selected_addons) {
        const p = Number(a.price_inr || 0);
        addonsTotal += p;
        validatedAddons.push({
          id: a.id || `addon_${Date.now()}`,
          title: a.title || 'Add-on',
          price_inr: p,
          quota_type: a.quota_type,
          quota_value: a.quota_value,
        });
      }
    }

    const totalCost = baseCost + addonsTotal;
    const durationDays = planDoc.duration_days || 365; // Non-expiring vendor credits
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const session = await mongoose.startSession();
    let txn;

    try {
      await session.withTransaction(async () => {
        // Create transaction record
        const user = await User.findById(userId).select('name current_role roles').session(session).lean();
        const txnArr = await WalletTransactionV2.create([{
          user_id: uid,
          user_name: user?.name || 'Unknown',
          user_role: targetRole,
          transaction_type: 'subscription_purchase',
          credit_debit: 'debit',
          amount: totalCost,
          previous_balance: 0,
          updated_balance: 0,
          payment_method: 'razorpay',
          source: 'subscription_direct',
          status: 'completed',
          reference_id: `sub_direct_${planDoc._id}_${Date.now()}`,
          admin_remarks: `Recharged ${planDoc.title} (${planDoc.wallet_credits || 0} credits) ${validatedAddons.length > 0 ? `with ${validatedAddons.length} Add-on(s)` : ''} via Razorpay`,
          meta: {
            plan_id: planDoc._id.toString(),
            plan_name: planDoc.title,
            duration_days: durationDays,
            base_plan_price: baseCost,
            wallet_credits: planDoc.wallet_credits || 0,
            free_reel_boosts: planDoc.free_reel_boosts || 0,
            addons_total: addonsTotal,
            selected_addons: validatedAddons,
            payment_id: paymentId || null,
            razorpay_payment_id: razorpayPaymentId || null,
            role: targetRole,
          },
        }], { session });
        txn = txnArr[0];

        // For non-vendor plans, deactivate old active subscription
        if (targetRole !== 'vendor') {
          await UserSubscription.updateMany(
            { user_id: uid, user_role: targetRole, status: 'active' },
            { $set: { status: 'cancelled', cancelled_at: new Date(), cancelled_reason: 'New plan purchased' } },
            { session }
          );
        } else {
          // For vendors, mark previous purchases as 'completed_topup' to show continuous audit trail
          await UserSubscription.updateMany(
            { user_id: uid, user_role: 'vendor', status: 'active' },
            { $set: { status: 'completed_topup', updated_at: new Date() } },
            { session }
          );
        }

        // Create new subscription record with add-ons
        await UserSubscription.create([{
          user_id: uid,
          user_name: user?.name || '',
          user_role: targetRole,
          plan_id: planDoc._id.toString(),
          plan_name: planDoc.title,
          plan_type: planDoc.plan_type || 'basic',
          billing_cycle: planDoc.billing_cycle || 'monthly',
          start_date: new Date(),
          expiry_date: expiresAt,
          auto_renewal: false,
          status: 'active',
          base_plan_price: baseCost,
          addons_total: addonsTotal,
          selected_addons: validatedAddons,
          original_amount: totalCost,
          paid_amount: totalCost,
          payment_method: 'razorpay',
          payment_id: razorpayPaymentId || paymentId || null,
        }], { session });

        // Update user subscription flag for this role
        const subData = {
          plan: planDoc.title,
          plan_id: planDoc._id.toString(),
          selected_addons: validatedAddons,
          startedAt: new Date(),
          expiresAt,
          autoRenew: false,
          status: 'active',
        };

        const updateSet = {};
        if (targetRole === 'creator') {
          updateSet['creatorProfile.subscription'] = subData;
          updateSet['creatorProfile.is_subscribed_verified'] = true;
        } else {
          updateSet['is_subscribed_verified'] = true;
          updateSet['subscription'] = subData;
          updateSet['vendorProfile.subscription'] = subData;
        }

        // Credit Wallet credits and free reel boosts if plan includes them
        if (targetRole === 'vendor' && (Number(planDoc.wallet_credits) > 0 || Number(planDoc.free_reel_boosts) > 0)) {
          const creditsToAdd = Number(planDoc.wallet_credits || 0);
          const freeBoostsToAdd = Number(planDoc.free_reel_boosts || 0);

          await Wallet.updateOne(
            { user_id: uid },
            {
              $inc: {
                credits: creditsToAdd,
                lifetime_earned_credits: creditsToAdd,
                free_reel_boosts: freeBoostsToAdd,
              },
              $set: { updated_at: new Date().toISOString() },
            },
            { session }
          );

          updateSet['$inc'] = {
            ...(updateSet['$inc'] || {}),
            walletBalance: creditsToAdd,
            wallet_credits: creditsToAdd,
            free_reel_boosts: freeBoostsToAdd,
          };
        }

        // Apply bonus AI credits if add-ons include ai_credits
        const bonusAiCredits = validatedAddons
          .filter(a => a.quota_type === 'ai_credits' && Number(a.quota_value) > 0)
          .reduce((sum, a) => sum + Number(a.quota_value), 0);
        if (bonusAiCredits > 0) {
          updateSet['$inc'] = { ...(updateSet['$inc'] || {}), ai_credits: bonusAiCredits };
        }

        await User.updateOne(
          { _id: userId },
          updateSet['$inc'] ? { $set: Object.fromEntries(Object.entries(updateSet).filter(([k]) => k !== '$inc')), $inc: updateSet['$inc'] } : { $set: updateSet },
          { session }
        );
      });

      // Emit real-time events AFTER commit
      walletEvents._emitSubscriptionUpdate(uid);
      const updatedWallet = await walletCoreService.getBalance(uid);
      walletEvents._emitWalletUpdate(uid, updatedWallet.credits, 'credit', Number(planDoc.wallet_credits || 0), `Recharged ${planDoc.title}`);

      logger.info(`Direct subscription purchase: ${planDoc.title} by user ${uid} (₹${totalCost} via Razorpay)`, { service: 'wallet' });
      return {
        transaction: walletEvents._serializeTxn(txn),
        user: {
          subscription: {
            plan: planDoc.title,
            plan_id: planDoc._id.toString(),
            startedAt: new Date(),
            expiresAt,
            autoRenew: false,
            status: 'active',
          }
        },
      };
    } finally {
      await session.endSession();
    }
  }
}

module.exports = new WalletSubscriptionService();
