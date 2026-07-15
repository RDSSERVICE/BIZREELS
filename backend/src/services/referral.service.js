const crypto = require('crypto');
const User = require('../models/User');
const { Referral } = require('../models/Misc');
const Listing = require('../models/Listing');
const Deal = require('../models/Deal');
const walletService = require('./wallet.service');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const REFERRER_REWARD = 200;
const REFERRED_REWARD = 100;
const CODE_LEN = 6;
const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const newUniqueCode = async () => {
  for (let i = 0; i < 10; i++) {
    let code = '';
    for (let c = 0; c < CODE_LEN; c++) {
      const idx = crypto.randomInt(0, CODE_ALPHABET.length);
      code += CODE_ALPHABET[idx];
    }
    const exists = await User.findOne({ referral_code: code }, { _id: 1 });
    if (!exists) {
      return code;
    }
  }
  // Fallback: longer length
  let fallbackCode = '';
  for (let c = 0; c < CODE_LEN + 2; c++) {
    const idx = crypto.randomInt(0, CODE_ALPHABET.length);
    fallbackCode += CODE_ALPHABET[idx];
  }
  return fallbackCode;
};

const ensureCode = async (userId) => {
  const u = await User.findById(userId, { referral_code: 1 });
  if (!u) {
    throw ApiError.notFound('User not found');
  }
  if (u.referral_code) {
    return u.referral_code;
  }
  const code = await newUniqueCode();
  await User.updateOne(
    { _id: userId, referral_code: { $exists: false } },
    { $set: { referral_code: code, updated_at: new Date().toISOString() } }
  );
  const fresh = await User.findById(userId, { referral_code: 1 });
  return fresh.referral_code || code;
};

const claimOnSignup = async (newUserId, code) => {
  if (!code) return null;
  const cleanCode = String(code).trim().toUpperCase();
  if (cleanCode.length < 4 || cleanCode.length > 16) {
    return null;
  }
  const referrer = await User.findOne({ referral_code: cleanCode, is_deleted: { $ne: true } });
  if (!referrer) return null;
  if (referrer._id.toString() === newUserId) return null;

  // Check unique referral per referred user
  const existing = await Referral.findOne({ referred_user_id: newUserId });
  if (existing) return null;

  const doc = await Referral.create({
    referrer_id: referrer._id.toString(),
    referred_user_id: newUserId,
    code_used: cleanCode,
    status: 'pending',
    referrer_reward: REFERRER_REWARD,
    referred_reward: REFERRED_REWARD,
  });

  return doc.toObject();
};

const awardPending = async (referredUserId, event) => {
  const ref = await Referral.findOne({ referred_user_id: referredUserId, status: 'pending' });
  if (!ref) return;

  try {
    await walletService.earnCredits(
      ref.referrer_id,
      ref.referrer_reward,
      'Referral reward',
      'referral',
      ref.referred_user_id
    );
    await walletService.earnCredits(
      ref.referred_user_id,
      ref.referred_reward,
      'Referral bonus',
      'referral',
      ref.referrer_id
    );
    await Referral.updateOne(
      { _id: ref._id },
      { $set: { status: 'credited', credited_at: new Date().toISOString(), trigger_event: event } }
    );

    // Notify both users
    await notificationService.create(
      ref.referrer_id,
      'reward',
      `+${ref.referrer_reward} referral credits!`,
      'A friend you referred just joined the action.',
      {},
      '/wallet'
    );
    await notificationService.create(
      ref.referred_user_id,
      'reward',
      `+${ref.referred_reward} bonus credits!`,
      'Referral bonus unlocked.',
      {},
      '/wallet'
    );
  } catch (err) {
    logger.error('referral award failed:', err.message);
  }
};

const maybeAwardOnListing = async (vendorId) => {
  const count = await Listing.countDocuments({ vendor_id: vendorId, is_deleted: { $ne: true } });
  if (count === 1) {
    await awardPending(vendorId, 'first_listing');
  }
};

const maybeAwardOnDealComplete = async (userId) => {
  const completed = await Deal.countDocuments({
    $or: [{ buyer_id: userId }, { seller_id: userId }],
    status: 'completed',
  });
  if (completed === 1) {
    await awardPending(userId, 'first_deal_complete');
  }
};

const listMyReferrals = async (userId) => {
  const docs = await Referral.find({ referrer_id: userId }).sort({ _id: -1 }).limit(100);
  const ids = docs.map(d => d.referred_user_id);
  const users = ids.length > 0 ? await User.find({ _id: { $in: ids } }, { name: 1, phone: 1 }) : [];
  const umap = {};
  for (const u of users) {
    umap[u._id.toString()] = u;
  }

  const items = [];
  for (const d of docs) {
    const u = umap[d.referred_user_id] || {};
    const ph = u.phone || '';
    const maskedPhone = ph ? ph.slice(0, 2) + '****' + ph.slice(-2) : null;
    items.push({
      id: d._id.toString(),
      referred_user_id: d.referred_user_id,
      referred_name: u.name || null,
      referred_phone_masked: maskedPhone,
      code_used: d.code_used,
      status: d.status,
      referrer_reward: d.referrer_reward,
      referred_reward: d.referred_reward,
      created_at: d.created_at,
      credited_at: d.credited_at || null,
    });
  }

  const credited = items.filter(x => x.status === 'credited').length;
  const pending = items.filter(x => x.status === 'pending').length;
  const earned = items.filter(x => x.status === 'credited').reduce((sum, x) => sum + x.referrer_reward, 0);

  return {
    items,
    summary: { total: items.length, credited, pending, credits_earned: earned },
  };
};

module.exports = {
  ensureCode,
  claimOnSignup,
  maybeAwardOnListing,
  maybeAwardOnDealComplete,
  listMyReferrals,
};
