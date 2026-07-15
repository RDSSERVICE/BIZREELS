const Listing = require('../models/Listing');
const User = require('../models/User');
const { WatcherNotification } = require('../models/Misc');
const eventService = require('./event.service');
const notificationService = require('./notification.service');
const msg91Service = require('./msg91.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const INDIA_PHONE_RX = '6789';
const DEDUP_WINDOW_HOURS = 24;

const validatePhone = (phone) => {
  const p = String(phone || '').trim();
  if (!/^\d{10}$/.test(p) || !INDIA_PHONE_RX.includes(p[0])) {
    throw ApiError.badRequest('Invalid Indian phone number');
  }
  return p;
};

const addWatcher = async (listingId, phone) => {
  const p = validatePhone(phone);
  const listing = await Listing.findOne({ _id: listingId, is_deleted: { $ne: true } });
  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  const now = new Date().toISOString();
  const existingPhones = new Set((listing.watchers || []).map(w => w.phone));

  if (!existingPhones.has(p)) {
    await Listing.updateOne(
      { _id: listingId },
      { $push: { watchers: { phone: p, added_at: now } } }
    );
  }

  const doc = await Listing.findById(listingId).select('watchers vendor_id');

  // Emit 'watch' analytics event (fire-and-forget)
  try {
    await eventService.emit({
      listing_id: listingId,
      vendor_id: doc && doc.vendor_id ? doc.vendor_id.toString() : null,
      event_type: 'watch',
      meta: { phone_hash: p.slice(-4) },
    });
  } catch {}

  return { ok: true, count: doc.watchers ? doc.watchers.length : 0 };
};

const wasRecentlyNotified = async (listingId, phone) => {
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const doc = await WatcherNotification.findOne({
    listing_id: listingId,
    phone,
    created_at: { $gte: cutoff },
  });
  return !!doc;
};

const recordNotification = async (listingId, phone, event, userId = null) => {
  await WatcherNotification.create({
    listing_id: listingId.toString(),
    phone,
    event,
    user_id: userId ? userId.toString() : null,
  });
};

const notifyWatchers = async ({ listingId, title, slug, effectivePrice, event = 'price_drop' } = {}) => {
  if (!listingId) {
    return { sent_inapp: 0, sent_sms: 0 };
  }
  const listing = await Listing.findById(listingId).select('watchers');
  if (!listing) {
    return { sent_inapp: 0, sent_sms: 0 };
  }

  const watchers = listing.watchers || [];
  let sentInapp = 0;
  let sentSms = 0;
  const actionUrl = slug ? `/listing/${slug}` : `/listing/${listingId}`;

  for (const w of watchers) {
    const phone = String(w.phone || '').trim();
    if (!phone) continue;

    if (await wasRecentlyNotified(listingId, phone)) {
      continue;
    }

    // Find user by phone
    const user = await User.findOne({ phone, is_deleted: { $ne: true } }).select('_id');
    const userId = user ? user._id.toString() : null;

    let titleTxt = '';
    let bodyTxt = '';
    if (event === 'price_drop') {
      const priceStr = effectivePrice !== undefined && effectivePrice !== null ? `₹${effectivePrice.toFixed(0)}` : 'a new price';
      titleTxt = `Price dropped on '${title}'!`;
      bodyTxt = `Now ${priceStr}.`;
    } else {
      titleTxt = `'${title}' is back in stock`;
      bodyTxt = 'Grab it before it\'s gone.';
    }

    if (userId) {
      try {
        await notificationService.create(
          userId,
          'price_drop',
          titleTxt,
          bodyTxt,
          { listing_id: listingId, event },
          actionUrl
        );
        sentInapp++;
      } catch (err) {
        logger.error(`in-app notify failed for user ${userId}:`, err.message);
      }
    } else {
      try {
        await msg91Service.sendTransactionalSms(phone, `${titleTxt} ${bodyTxt}`);
        sentSms++;
      } catch (err) {
        logger.info(`[SMS DEV] price-drop watcher notify ${listingId} ${phone}: ${titleTxt} ${bodyTxt}`);
        sentSms++;
      }
    }

    await recordNotification(listingId, phone, event, userId);
  }

  return { sent_inapp: sentInapp, sent_sms: sentSms };
};

module.exports = {
  addWatcher,
  notifyWatchers,
};
