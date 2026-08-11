const Listing = require('../models/Listing');
const Reel = require('../models/Reel');
const { AppSettings, BoostPlan } = require('../models/Admin');
const walletService = require('./wallet.service');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { serializeListing } = require('./listing.service');

const validatePlan = async (durationDays) => {
  const days = parseInt(durationDays, 10);
  if (isNaN(days) || days <= 0) {
    throw ApiError.badRequest('Invalid duration days.');
  }

  const plan = await BoostPlan.findOne({ duration_days: days, is_active: true, is_deleted: { $ne: true } });
  if (!plan) {
    throw ApiError.badRequest(`No active listing boost plan found for ${days} days.`);
  }

  return {
    credits: plan.credits_cost,
    paise: Math.round(plan.price_inr * 100),
  };
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
  const plan = await validatePlan(durationDays);
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
    `/listing/${listing.slug}`,
    'vendor'
  );

  return { listing_id: listingId, boost, payment_method: 'credits' };
};

const boostWithInr = async (vendorId, listingId, durationDays) => {
  const plan = await validatePlan(durationDays);
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
    '/vendor/dashboard',
    'vendor'
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
  
  // 1. Expire listing boosts
  const resListing = await Listing.updateMany(
    { boost_expires_at: { $lte: nowIso, $ne: null } },
    { $set: { boost_expires_at: null, boost_duration_days: null, updated_at: nowIso } }
  );

  // 2. Expire reel boosts
  const resReel = await Reel.updateMany(
    { boostExpiresAt: { $lte: new Date(), $ne: null }, isBoosted: true },
    { $set: { isBoosted: false, boostExpiresAt: null, boostDurationDays: null } }
  );

  return resListing.modifiedCount + resReel.modifiedCount;
};

const boostReelWithCredits = async (vendorId, reelId, durationDays) => {
  const days = parseInt(durationDays, 10);
  if (isNaN(days) || days <= 0) {
    throw ApiError.badRequest('Duration in days must be a positive number');
  }

  const reel = await Reel.findOne({ _id: reelId, isDeleted: { $ne: true } });
  if (!reel) {
    throw ApiError.notFound('Reel not found');
  }

  if (reel.creator.toString() !== vendorId.toString()) {
    throw ApiError.forbidden('Only the reel owner can boost');
  }

  // Fetch active credit rates to get cost per day
  let costPerDay = 10; // fallback default
  try {
    const rateSetting = await AppSettings.findOne({ key: 'credit_rates' }).lean();
    if (rateSetting && rateSetting.value && rateSetting.value.reelBoost1Day !== undefined) {
      costPerDay = Number(rateSetting.value.reelBoost1Day);
    }
  } catch (err) {
    logger.error('Failed to fetch credit rates for reel boosting:', err);
  }

  const totalCost = costPerDay * days;

  // Deduct credits from vendor's wallet
  await walletService.spendCredits(
    vendorId,
    totalCost,
    `Boost reel for ${days} days`,
    'boost_reel'
  );

  // Calculate new boost expiration date
  const now = new Date();
  let baseFrom = now;
  if (reel.boostExpiresAt && reel.boostExpiresAt > now) {
    baseFrom = reel.boostExpiresAt;
  }
  const newExpiry = new Date(baseFrom.getTime() + days * 24 * 60 * 60 * 1000);

  // Update reel properties
  await Reel.updateOne(
    { _id: reelId },
    {
      $set: {
        isBoosted: true,
        boostExpiresAt: newExpiry,
        boostDurationDays: days,
        boostActivatedAt: now,
        boostCost: totalCost,
      }
    }
  );

  // Trigger notification for vendor
  await notificationService.create(
    vendorId,
    'boost',
    'Reel boosted!',
    `Your reel is boosted for ${days} days.`,
    {},
    '/vendor/reels',
    'vendor'
  );

  return { reel_id: reelId, isBoosted: true, boostExpiresAt: newExpiry };
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
  boostReelWithCredits,
  expireBoostsOnce,
  expireBoostsLoop,
};
