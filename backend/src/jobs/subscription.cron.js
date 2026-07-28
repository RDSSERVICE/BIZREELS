const cron = require('node-cron');
const UserSubscription = require('../models/UserSubscription.model');
const User = require('../models/User');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * Subscription Cron Jobs
 * Runs daily to check for expired subscriptions and send reminders.
 */
const initSubscriptionCron = () => {
  // Run daily at midnight: 0 0 * * *
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily subscription check cron...', { service: 'subscription-cron' });
    
    try {
      const now = new Date();
      const nowISO = now.toISOString();

      // 1. Process expired subscriptions
      const expiredSubs = await UserSubscription.find({
        expiry_date: { $lt: nowISO },
        status: 'active',
        is_deleted: { $ne: true }
      });

      for (const sub of expiredSubs) {
        await UserSubscription.updateOne(
          { _id: sub._id },
          { $set: { status: 'expired' } }
        );
        
        await User.updateOne(
          { _id: sub.user_id },
          { $set: { is_subscribed_verified: false } }
        );

        logger.info(`Subscription expired: ${sub.plan_name} for user ${sub.user_id}`, { service: 'subscription-cron' });
        
        try {
          await notificationService.create(
            sub.user_id,
            'subscription',
            'Subscription Expired',
            `Your ${sub.plan_name} subscription has expired. Please renew to keep your premium benefits.`,
            {},
            '/subscriptions'
          );
        } catch (err) {
          logger.error(`Error sending expiry notification to ${sub.user_id}`, { error: err.message });
        }
      }

      // 2. Pre-expiry notifications (7 days and 1 day before)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const sevenDaysISO = sevenDaysFromNow.toISOString().split('T')[0];

      const upcomingExpiry7 = await UserSubscription.find({
        expiry_date: {
          $gte: `${sevenDaysISO}T00:00:00.000Z`,
          $lte: `${sevenDaysISO}T23:59:59.999Z`
        },
        status: 'active',
        is_deleted: { $ne: true }
      });

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
        } catch (err) {}
      }

      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
      const oneDayISO = oneDayFromNow.toISOString().split('T')[0];

      const upcomingExpiry1 = await UserSubscription.find({
        expiry_date: {
          $gte: `${oneDayISO}T00:00:00.000Z`,
          $lte: `${oneDayISO}T23:59:59.999Z`
        },
        status: 'active',
        is_deleted: { $ne: true }
      });

      for (const sub of upcomingExpiry1) {
        try {
          await notificationService.create(
            sub.user_id,
            'subscription',
            'Subscription Expiring Tomorrow',
            `Your ${sub.plan_name} subscription will expire tomorrow. Please renew now to avoid interruption.`,
            {},
            '/subscriptions'
          );
        } catch (err) {}
      }

    } catch (err) {
      logger.error('Error in subscription check cron:', { error: err.message });
    }
  });
};

module.exports = { initSubscriptionCron };
