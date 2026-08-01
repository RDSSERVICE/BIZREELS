const crypto = require('crypto');
const User = require('../models/User');
const { Referral } = require('../models/Misc');
const Listing = require('../models/Listing');
const { getReferralConfig } = require('./referral/referral.config.service');
const { runAllChecks } = require('./referral/referral.fraud.service');
const { tryAwardOnEvent } = require('./referral/referral.reward.service');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const CODE_LEN = 6;
const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate a unique referral code.
 */
const newUniqueCode = async () => {
  for (let i = 0; i < 10; i++) {
    let code = '';
    for (let c = 0; c < CODE_LEN; c++) {
      const idx = crypto.randomInt(0, CODE_ALPHABET.length);
      code += CODE_ALPHABET[idx];
    }
    const exists = await User.findOne({ referral_code: code }, { _id: 1 });
    if (!exists) return code;
  }
  // Fallback: longer code
  let fallbackCode = '';
  for (let c = 0; c < CODE_LEN + 2; c++) {
    const idx = crypto.randomInt(0, CODE_ALPHABET.length);
    fallbackCode += CODE_ALPHABET[idx];
  }
  return fallbackCode;
};

const ensureCode = async (userId) => {
  const u = await User.findById(userId, { referral_code: 1 });
  if (!u) throw ApiError.notFound('User not found');

  if (u.referral_code) return u.referral_code;

  const code = await newUniqueCode();
  const updated = await User.findOneAndUpdate(
    { _id: userId, referral_code: { $exists: false } },
    { $set: { referral_code: code, updated_at: new Date().toISOString() } },
    { new: true, select: { referral_code: 1 } }
  );
  return updated?.referral_code || code;
};

/**
 * Claim a referral code during signup — with fraud checks.
 */
const claimOnSignup = async (newUserId, code, ipAddress) => {
  if (!code) return null;

  const cleanCode = String(code).trim().toUpperCase();
  if (cleanCode.length < 4 || cleanCode.length > 16) return null;

  const referrer = await User.findOne({ referral_code: cleanCode, is_deleted: { $ne: true } });
  if (!referrer) return null;

  // Run all fraud checks
  const fraudResult = await runAllChecks({
    referrerId: referrer._id.toString(),
    referredId: newUserId,
    ipAddress,
  });

  if (!fraudResult.passed) {
    logger.warn(`Referral claim blocked: ${fraudResult.reason}`, { service: 'referral', newUserId, code: cleanCode });
    return null;
  }

  const config = await getReferralConfig();
  if (!config.is_active) return null;

  // Get names for dashboard display
  const referredUser = await User.findById(newUserId).select('name').lean();

  const doc = await Referral.create({
    referrer_id: referrer._id.toString(),
    referred_user_id: newUserId,
    referrer_name: referrer.name || null,
    referred_name: referredUser?.name || null,
    code_used: cleanCode,
    status: 'pending',
    referrer_reward: config.referrer_reward,
    referred_reward: config.referred_reward,
    ip_address: ipAddress || null,
  });

  // If eligibility is 'registration', award immediately
  if (config.eligibility_event === 'registration') {
    await tryAwardOnEvent(newUserId, 'registration');
  }

  // Emit real-time event to referrer
  try {
    const { emitToUser } = require('../sockets');
    emitToUser(referrer._id.toString(), 'referral:new_signup', {
      referred_name: referredUser?.name || 'New User',
      status: 'pending',
    });
  } catch (err) {}

  return doc.toObject();
};

/**
 * Auto-award when a vendor creates their first listing.
 */
const maybeAwardOnListing = async (vendorId) => {
  await tryAwardOnEvent(vendorId, 'first_listing');
};

/**
 * Auto-award when a user completes their first deal.
 */
const maybeAwardOnDealComplete = async (userId) => {
  await tryAwardOnEvent(userId, 'first_deal');
};

/**
 * Auto-award when KYC is approved.
 */
const maybeAwardOnKYC = async (userId) => {
  await tryAwardOnEvent(userId, 'kyc_approved');
};

/**
 * Get vendor referral dashboard data.
 */
const getVendorDashboard = async (userId) => {
  const uid = userId.toString();

  const [userDoc, config, docs] = await Promise.all([
    User.findById(userId, { referral_code: 1 }).lean(),
    getReferralConfig(),
    Referral.find({ referrer_id: uid, is_deleted: { $ne: true } }).sort({ _id: -1 }).limit(100).lean()
  ]);

  if (!userDoc) throw ApiError.notFound('User not found');

  let code = userDoc.referral_code;
  if (!code) {
    code = await ensureCode(userId);
  }

  const referredIds = docs.map(d => d.referred_user_id);
  const users = referredIds.length > 0
    ? await User.find({ _id: { $in: referredIds } }).select('name phone').lean()
    : [];

  const userMap = {};
  users.forEach(u => { userMap[u._id.toString()] = u; });

  const items = docs.map(d => {
    const u = userMap[d.referred_user_id] || {};
    const ph = u.phone || '';
    return {
      id: d._id.toString(),
      referred_user_id: d.referred_user_id,
      referred_name: d.referred_name || u.name || null,
      referred_phone_masked: ph ? ph.slice(0, 2) + '****' + ph.slice(-2) : null,
      code_used: d.code_used,
      status: d.status,
      referrer_reward: d.referrer_reward || config.referrer_reward,
      referred_reward: d.referred_reward || config.referred_reward,
      created_at: d.created_at,
      credited_at: d.credited_at || null,
    };
  });

  const credited = items.filter(x => x.status === 'credited').length;
  const pending = items.filter(x => x.status === 'pending').length;
  const earned = items.filter(x => x.status === 'credited').reduce((sum, x) => sum + x.referrer_reward, 0);

  return {
    referral_code: code,
    referral_link: `${process.env.CLIENT_URL || 'https://bizreels.in'}/register?ref=${code}`,
    items,
    summary: {
      total: items.length,
      successful: credited,
      credited,
      pending,
      credits_earned: earned,
      reward_per_referral: config.referrer_reward,
      bonus_per_referred: config.referred_reward,
    },
  };
};

/**
 * Get referral link for sharing.
 */
const getReferralLink = async (userId) => {
  const code = await ensureCode(userId);
  const baseUrl = process.env.CLIENT_URL || 'https://bizreels.in';
  return {
    referral_code: code,
    referral_link: `${baseUrl}/register?ref=${code}`,
    share_text: `Join BizReels and grow your business! Use my referral code ${code} to get bonus credits. ${baseUrl}/register?ref=${code}`,
  };
};

/**
 * List my referrals (user-facing).
 */
const listMyReferrals = async (userId) => {
  const dashboard = await getVendorDashboard(userId);
  return {
    items: dashboard.items,
    summary: dashboard.summary,
  };
};

module.exports = {
  ensureCode,
  claimOnSignup,
  maybeAwardOnListing,
  maybeAwardOnDealComplete,
  maybeAwardOnKYC,
  getVendorDashboard,
  getReferralLink,
  listMyReferrals,
};
