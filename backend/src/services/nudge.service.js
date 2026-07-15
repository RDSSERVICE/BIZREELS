const Listing = require('../models/Listing');
const { ListingEvent } = require('../models/Misc');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

const NUDGE_MIN_AGE_DAYS = 30;
const NUDGE_MAX_VIEWS_30D = 100;
const NUDGE_COOLDOWN_DAYS = 7;

const nudgeOnce = async () => {
  const now = new Date();
  const ageCutoff = new Date(now.getTime() - NUDGE_MIN_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const cooldownCutoff = new Date(now.getTime() - NUDGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const viewsCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Candidates: active, not takendown, not currently boosted, created >30d ago, last nudge either never or > cooldown
  const candidates = await Listing.find({
    is_deleted: { $ne: true },
    is_takendown: { $ne: true },
    status: 'active',
    created_at: { $lt: ageCutoff },
    $and: [
      {
        $or: [
          { boost_expires_at: null },
          { boost_expires_at: { $lt: now.toISOString() } },
        ],
      },
      {
        $or: [
          { last_boost_nudge_at: null },
          { last_boost_nudge_at: { $exists: false } },
          { last_boost_nudge_at: { $lt: cooldownCutoff } },
        ],
      },
    ],
  }).limit(500);

  let sent = 0;
  for (const li of candidates) {
    const listingId = li._id.toString();

    // Count views in last 30d
    const views30d = await ListingEvent.countDocuments({
      listing_id: listingId,
      event_type: 'view',
      created_at: { $gte: viewsCutoff },
    });

    if (views30d >= NUDGE_MAX_VIEWS_30D) {
      continue;
    }

    const vendorId = li.vendor_id ? li.vendor_id.toString() : null;
    if (!vendorId) continue;

    const title = li.title || 'Your listing';
    try {
      await notificationService.create(
        vendorId,
        'boost_nudge',
        `Give '${title.slice(0, 40)}' a boost`,
        `Only ${views30d} views in the last 30 days — a 3-day boost may 12x visibility.`,
        { listing_id: listingId, views_30d: views30d },
        `/listing/${li.slug || listingId}?open_boost=1`
      );

      await Listing.updateOne(
        { _id: li._id },
        { $set: { last_boost_nudge_at: new Date().toISOString() } }
      );
      sent++;
    } catch (err) {
      logger.error(`nudge emit failed for ${listingId}:`, err.message);
    }
  }

  if (sent > 0) {
    logger.info(`Boost & Bump nudge: emitted ${sent} nudges`);
  }
  return sent;
};

const nudgeLoop = async () => {
  try {
    await nudgeOnce();
  } catch (err) {
    logger.warn(`nudgeLoop error: ${err.message}`);
  }
};

module.exports = {
  nudgeOnce,
  nudgeLoop,
};
