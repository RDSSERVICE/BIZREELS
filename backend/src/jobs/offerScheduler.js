const cron = require('node-cron');
const Offer = require('../models/Offer');
const User = require('../models/User');
const notificationService = require('../services/notification.service');
const { emitToRole, emitToAdmin } = require('../sockets');
const logger = require('../utils/logger');

/**
 * Automatically activates and notifies eligible users about active offers
 */
const activateOfferAndNotify = async (offer) => {
  try {
    // 1. Fetch eligible users targeting the selected roles
    const targetUsers = await User.find({
      roles: { $in: offer.targetRoles },
      is_deleted: { $ne: true }
    }).select('_id name roles');

    logger.info(`Activating offer "${offer.title}" (${offer._id}). Notifying ${targetUsers.length} target users.`, { service: 'scheduler' });

    // 2. Bulk create database notifications and emit real-time socket events for each user
    for (const user of targetUsers) {
      await notificationService.create(
        user._id.toString(),
        'offer',
        offer.title,
        offer.description,
        {
          offerId: offer._id.toString(),
          code: offer.code || '',
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          endTime: offer.endTime.toISOString(),
        },
        '/customer/home'
      );
    }

    // 3. Update offer recipient and notification status
    offer.status = 'Active';
    offer.recipientCount = targetUsers.length;
    offer.notificationStatus = {
      sent: true,
      sentAt: new Date(),
      deliveryRate: targetUsers.length > 0 ? 100 : 0
    };
    await offer.save();

    // 4. Emit socket notifications to all target role rooms and admin room
    offer.targetRoles.forEach(role => {
      emitToRole(role, 'offer:activated', offer);
    });
    emitToAdmin('offer:activated', offer);

  } catch (err) {
    logger.error(`Error activating offer ${offer._id}: ${err.message}`, { service: 'scheduler' });
  }
};

/**
 * Automatically expires active offers when they pass their end time
 */
const expireOffer = async (offer) => {
  try {
    logger.info(`Expiring offer "${offer.title}" (${offer._id}).`, { service: 'scheduler' });

    offer.status = 'Expired';
    await offer.save();

    // Broadcast expiration to target roles and admin
    offer.targetRoles.forEach(role => {
      emitToRole(role, 'offer:expired', { id: offer._id.toString(), title: offer.title });
    });
    emitToAdmin('offer:expired', { id: offer._id.toString(), title: offer.title });

  } catch (err) {
    logger.error(`Error expiring offer ${offer._id}: ${err.message}`, { service: 'scheduler' });
  }
};

/**
 * Initializes the background cron scheduler.
 * Runs once every minute.
 */
const initOfferScheduler = () => {
  logger.info('Initializing background Offer Activation/Expiration Scheduler...', { service: 'scheduler' });

  // Cron schedule: Every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();

    try {
      // 1. Process Scheduled -> Active transitions
      const pendingActivations = await Offer.find({
        status: 'Scheduled',
        startTime: { $lte: now },
        isDeleted: { $ne: true }
      });

      if (pendingActivations.length > 0) {
        logger.info(`Scheduler found ${pendingActivations.length} offers to activate.`, { service: 'scheduler' });
        for (const offer of pendingActivations) {
          await activateOfferAndNotify(offer);
        }
      }

      // Also support Draft/Disabled -> Active if startTime arrived (in case they are not draft/disabled but status is scheduled/active)
      // Wait, we only auto-transition status for non-draft/disabled offers as per model lifecycle rules.

      // 2. Process Active -> Expired transitions
      const pendingExpirations = await Offer.find({
        status: 'Active',
        endTime: { $lte: now },
        isDeleted: { $ne: true }
      });

      if (pendingExpirations.length > 0) {
        logger.info(`Scheduler found ${pendingExpirations.length} offers to expire.`, { service: 'scheduler' });
        for (const offer of pendingExpirations) {
          await expireOffer(offer);
        }
      }

    } catch (err) {
      logger.error(`Error executing Offer Scheduler: ${err.message}`, { service: 'scheduler' });
    }
  });
};

module.exports = {
  initOfferScheduler,
  activateOfferAndNotify,
  expireOffer
};
