const cron = require('node-cron');
const Reel = require('../models/Reel');
const logger = require('../utils/logger');

/**
 * Automatically publishes scheduled reels when their scheduled time arrives
 */
const publishScheduledReels = async () => {
  try {
    const now = new Date();

    // Find all scheduled reels where scheduledDate <= now
    const pendingReels = await Reel.find({
      status: 'scheduled',
      scheduledDate: { $lte: now },
      isDeleted: { $ne: true }
    });

    if (pendingReels.length > 0) {
      logger.info(`Scheduler found ${pendingReels.length} scheduled reels to publish.`, { service: 'reel-scheduler' });
      
      const reelIds = pendingReels.map(r => r._id);
      
      // Update status to 'published'
      const result = await Reel.updateMany(
        { _id: { $in: reelIds } },
        { $set: { status: 'published' } }
      );

      logger.info(`Successfully published ${result.modifiedCount} scheduled reels.`, { service: 'reel-scheduler' });

      // Emitting socket updates if socket is initialized (reels live feed, admin overview)
      try {
        const { emitToAdmin } = require('../sockets');
        emitToAdmin('admin:update', { tags: ['Reels', 'AdminOverview'] });
      } catch (socketErr) {
        logger.warn('Failed to emit socket updates for published reels:', socketErr.message);
      }
    }
  } catch (err) {
    logger.error(`Error executing Reel Scheduler: ${err.message}`, { service: 'reel-scheduler' });
  }
};

/**
 * Initializes the background reel cron scheduler.
 * Runs once every minute.
 */
const initReelScheduler = () => {
  logger.info('Initializing background Reel Scheduler...', { service: 'reel-scheduler' });

  // Cron schedule: Every minute
  cron.schedule('* * * * *', async () => {
    await publishScheduledReels();
  });
};

module.exports = {
  initReelScheduler,
  publishScheduledReels
};
