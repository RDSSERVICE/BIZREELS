const cron = require('node-cron');
const UserSubscription = require('../models/UserSubscription.model');
const User = require('../models/User');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * Subscription Cron Jobs — Production-Grade
 * Runs every hour to check for expired subscriptions, send reminders, and process auto-renewals.
 * Emits real-time Socket.IO events for instant UI updates.
 */
const initSubscriptionCron = () => {
  // Run every hour: 0 * * * *
  cron.schedule('0 * * * *', async () => {
    logger.info('Running subscription check cron...', { service: 'subscription-cron' });

    try {
      const now = new Date();

      // 1. Process expired subscriptions
      const expiredSubs = await UserSubscription.find({
        expiry_date: { $lt: now },
        status: 'active',
        is_deleted: { $ne: true },
      }).lean();

      let expiredCount = 0;
      for (const sub of expiredSubs) {
        // Check if auto-renewal is enabled
        if (sub.auto_renewal) {
          try {
            await processAutoRenewal(sub);
            continue; // Skip expiration if renewal succeeded
          } catch (renewErr) {
            logger.warn(`Auto-renewal failed for ${sub.user_id}: ${renewErr.message}`, { service: 'subscription-cron' });
          }
        }

        // Mark as expired
        await UserSubscription.updateOne(
          { _id: sub._id },
          { $set: { status: 'expired' } }
        );

        await User.updateOne(
          { _id: sub.user_id },
          {
            $set: {
              is_subscribed_verified: false,
              subscription: {
                plan: 'Free Member',
                plan_id: null,
                startedAt: null,
                expiresAt: null,
                boostCredits: 0,
                autoRenew: false,
                status: 'inactive'
              }
            }
          }
        );

        expiredCount++;

        // Emit real-time expiry event
        try {
          const { emitToUser, emitToAdmin } = require('../sockets');
          emitToUser(sub.user_id, 'subscription:expired', {
            plan: sub.plan_name,
            expired_at: now.toISOString(),
          });
          emitToAdmin('admin:update', { tags: ['UserSubscriptions', 'AdminOverview'] });
        } catch (err) {}

        // Send notification
        try {
          await notificationService.create(
            sub.user_id,
            'subscription',
            'Subscription Expired',
            `Your ${sub.plan_name} subscription has expired. Renew to keep premium benefits.`,
            {},
            '/subscriptions'
          );
        } catch (err) {
          logger.error(`Expiry notification failed for ${sub.user_id}`, { error: err.message });
        }

        logger.info(`Subscription expired: ${sub.plan_name} for user ${sub.user_id}`, { service: 'subscription-cron' });
      }

      // 2. Pre-expiry notifications (7 days before)
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const sevenDaysISO = sevenDaysFromNow.toISOString().split('T')[0];

      const upcomingExpiry7 = await UserSubscription.find({
        expiry_date: {
          $gte: new Date(`${sevenDaysISO}T00:00:00.000Z`),
          $lte: new Date(`${sevenDaysISO}T23:59:59.999Z`),
        },
        status: 'active',
        is_deleted: { $ne: true },
      }).lean();

      for (const sub of upcomingExpiry7) {
        try {
          await notificationService.create(
            sub.user_id,
            'subscription',
            'Subscription Expiry Reminder',
            `Your ${sub.plan_name} subscription will expire in 7 days.`,
            {},
            '/subscriptions'
          );
          const { emitToUser } = require('../sockets');
          emitToUser(sub.user_id, 'subscription:expiry_warning', { days_remaining: 7, plan: sub.plan_name });
        } catch (err) {}
      }

      // 3. Pre-expiry notifications (1 day before)
      const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      const oneDayISO = oneDayFromNow.toISOString().split('T')[0];

      const upcomingExpiry1 = await UserSubscription.find({
        expiry_date: {
          $gte: new Date(`${oneDayISO}T00:00:00.000Z`),
          $lte: new Date(`${oneDayISO}T23:59:59.999Z`),
        },
        status: 'active',
        is_deleted: { $ne: true },
      }).lean();

      for (const sub of upcomingExpiry1) {
        try {
          await notificationService.create(
            sub.user_id,
            'subscription',
            'Subscription Expiring Tomorrow!',
            `Your ${sub.plan_name} subscription expires tomorrow. Renew now!`,
            {},
            '/subscriptions'
          );
          const { emitToUser } = require('../sockets');
          emitToUser(sub.user_id, 'subscription:expiry_warning', { days_remaining: 1, plan: sub.plan_name });
        } catch (err) {}
      }

      if (expiredCount > 0) {
        logger.info(`Subscription cron: ${expiredCount} subscriptions expired`, { service: 'subscription-cron' });
      }
    } catch (err) {
      logger.error('Error in subscription check cron:', { error: err.message, stack: err.stack });
    }
  });
};

/**
 * Process auto-renewal for a subscription.
 * Deducts from wallet and creates a new subscription period.
 */
async function processAutoRenewal(sub) {
  const { SubscriptionPlan } = require('../models/Admin');
  const walletService = require('../services/wallet.service');

  const plan = await SubscriptionPlan.findById(sub.plan_id).lean();
  if (!plan || !plan.is_active) {
    throw new Error('Plan no longer available for renewal.');
  }

  const cost = plan.price_inr;
  const durationDays = plan.duration_days || 30;

  // Check balance
  const balance = await walletService.getBalance(sub.user_id);
  if (balance.credits < cost) {
    throw new Error('Insufficient balance for auto-renewal.');
  }

  // Debit wallet
  await walletService.debit({
    userId: sub.user_id,
    amount: cost,
    transactionType: 'subscription_renewal',
    referenceId: `renewal_${sub._id}_${Date.now()}`,
    reason: `Auto-renewal: ${plan.title}`,
    source: 'auto_renewal',
  });

  // Extend subscription
  const newExpiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  await UserSubscription.updateOne(
    { _id: sub._id },
    {
      $set: { expiry_date: newExpiry, start_date: new Date(), status: 'active' },
      $inc: { renewed_count: 1 },
    }
  );

  // Emit events
  try {
    const { emitToUser, emitToAdmin } = require('../sockets');
    emitToUser(sub.user_id, 'subscription:renewed', { plan: plan.title, new_expiry: newExpiry.toISOString() });
    emitToAdmin('admin:update', { tags: ['UserSubscriptions', 'AdminOverview'] });
  } catch (err) {}

  // Notify user
  try {
    const notificationService = require('../services/notification.service');
    await notificationService.create(
      sub.user_id,
      'subscription',
      'Subscription Renewed',
      `Your ${plan.title} subscription has been auto-renewed. New expiry: ${newExpiry.toLocaleDateString('en-IN')}`,
      {},
      '/subscriptions'
    );
  } catch (err) {}

  logger.info(`Auto-renewal successful: ${plan.title} for user ${sub.user_id}`, { service: 'subscription-cron' });
}

module.exports = { initSubscriptionCron };
