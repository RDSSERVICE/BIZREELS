const mongoose = require('mongoose');
const { Wallet } = require('../models/Phase4');
const WalletTransactionV2 = require('../models/WalletTransactionV2.model');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

/**
 * WalletService — Production-Grade
 * All balance mutations happen inside MongoDB transactions.
 * Dual-sync: Wallet.credits (source of truth) + User.walletBalance (backward compat).
 * Emits Socket.IO events after every successful commit.
 */
class WalletService {

  // ─── Get or Create Wallet ────────────────────────────────
  async getOrCreate(userId, session = null) {
    return this.getOrCreateWallet(userId, session);
  }

  async getOrCreateWallet(userId, session = null) {
    const uid = userId.toString();
    const opts = session ? { session } : {};
    let wallet = await Wallet.findOne({ user_id: uid }, null, opts);
    if (!wallet) {
      const created = await Wallet.create([{
        user_id: uid,
        credits: 100,
        balance_inr_paise: 0,
        lifetime_earned_credits: 100,
        lifetime_spent_credits: 0,
        lifetime_deposited_paise: 0,
        lifetime_spent_paise: 0,
        is_frozen: false,
      }], opts);
      wallet = created[0];

      // Sync User walletBalance
      await User.updateOne({ _id: userId }, { $set: { walletBalance: 100 } }, opts);

      // Create transaction record
      try {
        const user = await User.findById(userId).select('name current_role roles').session(session).lean();
        await WalletTransactionV2.create([{
          user_id: uid,
          user_name: user?.name || 'Unknown',
          user_role: user?.current_role || user?.roles?.[0] || 'vendor',
          transaction_type: 'signup_bonus',
          credit_debit: 'credit',
          amount: 100,
          previous_balance: 0,
          updated_balance: 100,
          payment_method: 'internal',
          source: 'system',
          status: 'completed',
          reference_id: `welcome_${uid}`,
          admin_remarks: 'Welcome Free Onboarding Credits',
          meta: {},
        }], opts);
      } catch (err) {
        logger.warn(`Failed to create onboarding wallet transaction record: ${err.message}`);
      }
    }
    return wallet;
  }

  // ─── Get Balance ─────────────────────────────────────────
  async getBalance(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      credits: wallet.credits || 0,
      balance_inr_paise: wallet.balance_inr_paise || 0,
      free_reel_boosts: wallet.free_reel_boosts || 0,
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

        // ─── Sync Isolated Wallet (New Architecture) ─────────────────
        try {
          const IsolatedWallet = require('../models/IsolatedWallet.model');
          const IsolatedTransaction = require('../models/IsolatedTransaction.model');

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

        let previousBalance = wallet.credits || 0;
        try {
          const IsolatedWallet = require('../models/IsolatedWallet.model');
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

        // ─── Sync Isolated Wallet (New Architecture) ─────────────────
        try {
          const IsolatedWallet = require('../models/IsolatedWallet.model');
          const IsolatedTransaction = require('../models/IsolatedTransaction.model');

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

  // ─── Recharge Vendor Credit Plan (Starter, Growth, Business) ───
  async rechargeCreditPlan({ userId, planId, paymentId = null, paymentMethod = 'razorpay' }) {
    const { SubscriptionPlan } = require('../models/Admin');
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
    const wallet = await this.getOrCreateWallet(uid);
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
    const UserSubscription = require('../models/UserSubscription.model');
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
      this._emitWalletUpdate(uid, updatedCredits, 'credit', creditsToAdd, `Recharged ${planDoc.title}`);
      const { emitToUser } = require('../sockets');
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

  // ─── Purchase Plan (Subscription Deduction) ──────────────
  async purchasePlan({ userId, plan, selected_addons = [] }) {
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
        const IsolatedWallet = require('../models/IsolatedWallet.model');
        const IsolatedTransaction = require('../models/IsolatedTransaction.model');

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
          const wallet = await this.getOrCreateWallet(uid, session);
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
  async purchasePlanDirect({ userId, planId, paymentId, razorpayPaymentId, selected_addons = [] }) {
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
      this._emitSubscriptionUpdate(uid);
      const updatedWallet = await this.getBalance(uid);
      this._emitWalletUpdate(uid, updatedWallet.credits, 'credit', Number(planDoc.wallet_credits || 0), `Recharged ${planDoc.title}`);

      logger.info(`Direct subscription purchase: ${planDoc.title} by user ${uid} (₹${cost} via Razorpay)`, { service: 'wallet' });
      return {
        transaction: this._serializeTxn(txn),
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

  // ═══════════════════════════════════════════════════════════
  // ROLE-ISOLATED WALLET METHODS (New Architecture)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get or create a role-isolated wallet for a user.
   * @param {string} userId
   * @param {'vendor'|'creator'} role
   * @param {object} [session] - optional Mongoose session
   */
  async getRoleWallet(userId, role, session = null) {
    const IsolatedWallet = require('../models/IsolatedWallet.model');
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
    const IsolatedWallet = require('../models/IsolatedWallet.model');
    const IsolatedTransaction = require('../models/IsolatedTransaction.model');

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
      this._emitWalletUpdate(uid, updatedBalance, 'credit', parseFloat(amount), description);
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
    const IsolatedWallet = require('../models/IsolatedWallet.model');
    const IsolatedTransaction = require('../models/IsolatedTransaction.model');

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
      this._emitWalletUpdate(uid, updatedBalance, 'debit', parseFloat(amount), description);
      logger.info(`Role debit: -${amount} from ${uid}/${role} (${type})`, { service: 'wallet' });
      return { transaction: txn, wallet: { balance: updatedBalance, role } };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get role-isolated transactions (paginated).
   * Unifies and deduplicates transactions across both IsolatedTransaction and WalletTransactionV2
   * so all usage credits, reel boosts, bid fees, listing fees, and recharges show in the ledger.
   */
  async getRoleTransactions(userId, role, page = 1, limit = 50) {
    const IsolatedTransaction = require('../models/IsolatedTransaction.model');
    const WalletTransactionV2 = require('../models/WalletTransactionV2.model');
    const uid = userId.toString();
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (parsedPage - 1) * parsedLimit;

    // Fetch from both IsolatedTransaction and WalletTransactionV2 in parallel
    const [isoItems, v2Items] = await Promise.all([
      IsolatedTransaction.find({ userId: uid, role }).lean(),
      WalletTransactionV2.find({ user_id: uid }).lean(),
    ]);

    const seenRefs = new Set();
    const seenTimeKeys = new Set();
    const merged = [];

    const addTx = (t) => {
      const rawRef = (t.reference_id || t.paymentId || t.payment_id || t.transaction_id || '').toString();
      const cleanRef = rawRef.toLowerCase().replace(/^iso_/, '');
      const createdAt = new Date(t.created_at || t.createdAt || Date.now());
      const amt = Number(t.amount || 0);

      const isCredit =
        (t.type || t.credit_debit || '').toLowerCase() === 'credit' ||
        t.type === 'recharge' ||
        t.type === 'refund' ||
        t.type === 'referral_bonus' ||
        t.transaction_type === 'recharge' ||
        t.transaction_type === 'manual_credit' ||
        t.transaction_type === 'refund';

      const typeStr = isCredit ? 'credit' : 'debit';
      const timeKey = Math.floor(createdAt.getTime() / 4000) + '_' + amt + '_' + typeStr;

      if (cleanRef && seenRefs.has(cleanRef)) return;
      if (seenTimeKeys.has(timeKey)) return;

      if (cleanRef) seenRefs.add(cleanRef);
      seenTimeKeys.add(timeKey);

      const rawDesc = t.description || t.admin_remarks;
      const cleanDesc = rawDesc || (t.transaction_type ? t.transaction_type.replace(/_/g, ' ') : 'Wallet Transaction');

      merged.push({
        _id: t._id ? t._id.toString() : `tx_${Date.now()}_${Math.random()}`,
        userId: uid,
        role: t.role || role,
        type: typeStr,
        credit_debit: typeStr,
        transaction_type: t.transaction_type || t.type || 'transaction',
        amount: amt,
        previous_balance: t.previous_balance ?? 0,
        updated_balance: t.updated_balance ?? 0,
        description: cleanDesc,
        reference_id: rawRef || `ref_${createdAt.getTime()}`,
        status: t.status === 'failed' ? 'failed' : (t.status || 'completed'),
        createdAt,
        created_at: createdAt,
        meta: t.meta || {},
      });
    };

    // Prioritize IsolatedTransaction, then append any additional WalletTransactionV2 records
    isoItems.forEach(addTx);
    v2Items.forEach(addTx);

    // Sort descending by date
    merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = merged.length;
    const paginatedItems = merged.slice(skip, skip + parsedLimit);

    return {
      items: paginatedItems,
      total,
      page: parsedPage,
      limit: parsedLimit,
    };
  }
}

const serviceInstance = new WalletService();
module.exports = serviceInstance;
