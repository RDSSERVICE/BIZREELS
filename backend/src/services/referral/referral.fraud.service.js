const { Referral } = require('../../models/Misc');
const User = require('../../models/User');
const { getReferralConfig } = require('./referral.config.service');
const logger = require('../../utils/logger');

/**
 * ReferralFraudService
 * Anti-fraud checks for the referral system.
 * Prevents self-referrals, duplicates, rate abuse, and IP abuse.
 */

/**
 * Check if referrer is trying to refer themselves.
 */
async function checkSelfReferral(referrerId, referredId) {
  if (referrerId.toString() === referredId.toString()) {
    logger.warn(`Self-referral blocked: ${referrerId}`, { service: 'referral-fraud' });
    return { blocked: true, reason: 'Self-referral is not allowed.' };
  }
  return { blocked: false };
}

/**
 * Check if this user has already been referred.
 */
async function checkDuplicateReferral(referredUserId) {
  const existing = await Referral.findOne({
    referred_user_id: referredUserId.toString(),
    is_deleted: { $ne: true },
  });
  if (existing) {
    logger.warn(`Duplicate referral blocked for user: ${referredUserId}`, { service: 'referral-fraud' });
    return { blocked: true, reason: 'User has already been referred.' };
  }
  return { blocked: false };
}

/**
 * Check daily referral limit for a referrer.
 */
async function checkDailyLimit(referrerId) {
  const config = await getReferralConfig();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await Referral.countDocuments({
    referrer_id: referrerId.toString(),
    created_at: { $gte: todayStart },
    is_deleted: { $ne: true },
  });

  if (todayCount >= config.max_referrals_per_day) {
    logger.warn(`Daily referral limit reached for ${referrerId}: ${todayCount}/${config.max_referrals_per_day}`, { service: 'referral-fraud' });
    return { blocked: true, reason: `Daily referral limit (${config.max_referrals_per_day}) reached.` };
  }
  return { blocked: false, remaining: config.max_referrals_per_day - todayCount };
}

/**
 * Check IP abuse — too many referrals from same IP in one day.
 */
async function checkIPAbuse(ipAddress) {
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
    return { blocked: false };
  }

  const config = await getReferralConfig();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const ipCount = await Referral.countDocuments({
    ip_address: ipAddress,
    created_at: { $gte: todayStart },
    is_deleted: { $ne: true },
  });

  if (ipCount >= config.max_referrals_per_ip_daily) {
    logger.warn(`IP abuse detected: ${ipAddress} has ${ipCount} referrals today`, { service: 'referral-fraud' });
    return { blocked: true, reason: 'Too many referrals from this network.' };
  }
  return { blocked: false };
}

/**
 * Run all fraud checks at once.
 */
async function runAllChecks({ referrerId, referredId, ipAddress }) {
  const checks = await Promise.all([
    checkSelfReferral(referrerId, referredId),
    checkDuplicateReferral(referredId),
    checkDailyLimit(referrerId),
    ipAddress ? checkIPAbuse(ipAddress) : { blocked: false },
  ]);

  const blocked = checks.find(c => c.blocked);
  if (blocked) {
    return { passed: false, reason: blocked.reason };
  }
  return { passed: true };
}

module.exports = {
  checkSelfReferral,
  checkDuplicateReferral,
  checkDailyLimit,
  checkIPAbuse,
  runAllChecks,
};
