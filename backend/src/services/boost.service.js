const Listing = require('../models/Listing');
const walletService = require('./wallet.service');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { serializeListing } = require('./listing.service');

const BOOST_PLANS = {
  3: { credits: 300, paise: 9900 },
  7: { credits: 600, paise: 19900 },
  14: { credits: 1000, paise: 34900 },
};

const validatePlan = (durationDays) => {
  const plan = BOOST_PLANS[parseInt(durationDays, 10)];
  if (!plan) {
    throw ApiError.badRequest(`Invalid duration_days. Allowed: ${Object.keys(BOOST_PLANS)}`);
  }
  return plan;
};

const getOwnedListing = async (listingId, vendorId) => {
  const listing = await Listing.findOne({ _id: listingId, is_deleted: { $ne: true } });
  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }
  if (listing.vendor_id !== vendorId) {
    throw ApiError.forbidden('Only the listing owner can boost');
  }
  if (listing.is_takendown) {
    throw ApiError.forbidden('Listing is under admin review');
  }
  return listing;
};

const applyBoost = async (listingId, durationDays) => {
  const now = new Date();
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  const currentExpiryStr = listing.boost_expires_at;
  let baseFrom = now;
  if (currentExpiryStr) {
    try {
      const currentExpiry = new Date(currentExpiryStr);
      if (currentExpiry > now) {
        baseFrom = currentExpiry;
      }
    } catch {}
  }

  const newExpiry = new Date(baseFrom.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const nowIso = new Date().toISOString();
  await Listing.updateOne(
    { _id: listingId },
    {
      $set: {
        boost_expires_at: newExpiry.toISOString(),
        boost_duration_days: parseInt(durationDays, 10),
        boost_activated_at: nowIso,
        updated_at: nowIso,
      },
    }
  );

  const updated = await Listing.findById(listingId);
  return {
    listing_id: listingId,
    boost_expires_at: updated.boost_expires_at,
    boost_duration_days: updated.boost_duration_days,
    active: true,
  };
};

const boostWithCredits = async (vendorId, listingId, durationDays) => {
  const plan = validatePlan(durationDays);
  const listing = await getOwnedListing(listingId, vendorId);

  await walletService.spendCredits(
    vendorId,
    plan.credits,
    `Boost listing ${durationDays}d`,
    'boost_listing',
    listingId
  );

  const boost = await applyBoost(listingId, durationDays);

  await notificationService.create(
    vendorId,
    'boost',
    'Listing boosted!',
    `'${listing.title}' is boosted for ${durationDays} days.`,
    {},
    `/listing/${listing.slug}`
  );

  return { listing_id: listingId, boost, payment_method: 'credits' };
};

const boostWithInr = async (vendorId, listingId, durationDays) => {
  const plan = validatePlan(durationDays);
  await getOwnedListing(listingId, vendorId);
  const paymentService = require('./payment.service');
  const order = await paymentService.createPaymentOrder(
    vendorId,
    'listing_boost',
    plan.paise,
    `${listingId}:${durationDays}`
  );
  return {
    listing_id: listingId,
    payment: order,
    payment_method: 'inr',
    duration_days: durationDays,
  };
};

const activateBoostFromPayment = async (payment) => {
  const ref = payment.ref_id || '';
  if (!ref.includes(':')) {
    return null;
  }
  const parts = ref.split(':');
  const listingId = parts[0];
  const durationDays = parseInt(parts[1], 10);
  if (isNaN(durationDays)) {
    return null;
  }

  const boost = await applyBoost(listingId, durationDays);
  await notificationService.create(
    payment.user_id,
    'boost',
    'Boost activated',
    `Your listing is now boosted for ${durationDays} days.`,
    {},
    '/vendor/dashboard'
  );
  return boost;
};

const listMyBoosted = async (vendorId) => {
  const nowIso = new Date().toISOString();
  const docs = await Listing.find({
    vendor_id: vendorId,
    is_deleted: { $ne: true },
    boost_expires_at: { $gt: nowIso },
  }).sort({ boost_expires_at: 1 });
  return docs.map(serializeListing);
};

const expireBoostsOnce = async () => {
  const nowIso = new Date().toISOString();
  const res = await Listing.updateMany(
    { boost_expires_at: { $lte: nowIso, $ne: null } },
    { $set: { boost_expires_at: null, boost_duration_days: null, updated_at: nowIso } }
  );
  return res.modifiedCount;
};

const expireBoostsLoop = async () => {
  try {
    const n = await expireBoostsOnce();
    if (n > 0) {
      logger.info(`Expired ${n} boost(s)`);
    }
  } catch (err) {
    logger.warn(`boost expire loop error: ${err.message}`);
  }
};

module.exports = {
  boostWithCredits,
  boostWithInr,
  activateBoostFromPayment,
  listMyBoosted,
  expireBoostsOnce,
  expireBoostsLoop,
};
