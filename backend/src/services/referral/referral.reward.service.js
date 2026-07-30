const { Referral } = require('../../models/Misc');
const User = require('../../models/User');
const Listing = require('../../models/Listing');
const { getReferralConfig } = require('./referral.config.service');
const logger = require('../../utils/logger');

/**
 * ReferralRewardService
 * Handles eligibility checks and reward processing.
 * Credits rewards to wallets via the wallet service inside transactions.
 */

/**
 * Check if a referred user meets the eligibility criteria for reward.
 */
async function checkEligibility(referredUserId) {
  const config = await getReferralConfig();
  const uid = referredUserId.toString();

  switch (config.eligibility_event) {
    case 'registration':
      // Just being registered is enough
      return { eligible: true, event: 'registration' };

    case 'first_listing': {
      const count = await Listing.countDocuments({ vendor_id: uid, is_deleted: { $ne: true } });
      return { eligible: count >= 1, event: 'first_listing' };
    }

    case 'kyc_approved': {
      const user = await User.findById(referredUserId).select('kyc_status').lean();
      return { eligible: user?.kyc_status === 'approved', event: 'kyc_approved' };
    }

    case 'first_deal': {
      const Deal = require('../../models/Deal');
      const count = await Deal.countDocuments({
        $or: [{ buyer_id: uid }, { seller_id: uid }],
        status: 'completed',
      });
      return { eligible: count >= 1, event: 'first_deal' };
    }

    default:
      return { eligible: true, event: config.eligibility_event || 'registration' };
  }
}

/**
 * Process reward for a referral.
 * Checks eligibility, credits both wallets, updates referral status.
 */
async function processReward(referralId) {
  const ref = await Referral.findById(referralId);
  if (!ref) {
    logger.warn(`Referral not found: ${referralId}`, { service: 'referral-reward' });
    return { processed: false, reason: 'Referral not found' };
  }

  if (ref.status === 'credited') {
    return { processed: false, reason: 'Already credited' };
  }

  const config = await getReferralConfig();
  if (!config.is_active) {
    return { processed: false, reason: 'Referral program is disabled' };
  }

  // Check eligibility
  const eligibility = await checkEligibility(ref.referred_user_id);
  if (!eligibility.eligible) {
    return { processed: false, reason: `Eligibility not met: ${eligibility.event}` };
  }

  // Credit rewards via wallet service
  const walletService = require('../wallet.service');
  const notificationService = require('../notification.service');

  try {
    // Credit referrer
    if (config.referrer_reward > 0) {
      await walletService.earnCredits(
        ref.referrer_id,
        config.referrer_reward,
        `Referral reward: invited a new vendor`,
        'referral',
        `ref_reward_${ref._id}`
      );
    }

    // Credit referred user
    if (config.referred_reward > 0) {
      await walletService.earnCredits(
        ref.referred_user_id,
        config.referred_reward,
        'Welcome referral bonus',
        'referral',
        `ref_bonus_${ref._id}`
      );
    }

    // Update referral status
    await Referral.updateOne(
      { _id: ref._id },
      {
        $set: {
          status: 'credited',
          reward_given: true,
          credited_at: new Date().toISOString(),
          trigger_event: eligibility.event,
          referrer_reward: config.referrer_reward,
          referred_reward: config.referred_reward,
        },
      }
    );

    // Emit real-time events
    try {
      const { emitToUser } = require('../../sockets');
      emitToUser(ref.referrer_id, 'referral:reward_credited', {
        amount: config.referrer_reward,
        referred_user_id: ref.referred_user_id,
      });
      emitToUser(ref.referred_user_id, 'referral:bonus_credited', {
        amount: config.referred_reward,
      });
    } catch (err) {}

    // Notifications
    try {
      await notificationService.create(
        ref.referrer_id,
        'reward',
        `+${config.referrer_reward} referral credits!`,
        'A vendor you referred just completed their first action.',
        {},
        '/wallet'
      );
      await notificationService.create(
        ref.referred_user_id,
        'reward',
        `+${config.referred_reward} welcome bonus!`,
        'Referral bonus unlocked.',
        {},
        '/wallet'
      );
    } catch (err) {}

    logger.info(`Referral reward processed: ${ref._id} (referrer: ${ref.referrer_id}, referred: ${ref.referred_user_id})`, { service: 'referral-reward' });
    return { processed: true, referrer_reward: config.referrer_reward, referred_reward: config.referred_reward };
  } catch (err) {
    logger.error(`Referral reward failed: ${err.message}`, { service: 'referral-reward', referralId });
    return { processed: false, reason: err.message };
  }
}

/**
 * Try to award pending referral when an eligibility event occurs.
 */
async function tryAwardOnEvent(referredUserId, event) {
  const ref = await Referral.findOne({
    referred_user_id: referredUserId.toString(),
    status: 'pending',
    is_deleted: { $ne: true },
  });

  if (!ref) return;

  const result = await processReward(ref._id);
  if (result.processed) {
    logger.info(`Referral auto-awarded on ${event} for user ${referredUserId}`, { service: 'referral-reward' });
  }
}

module.exports = {
  checkEligibility,
  processReward,
  tryAwardOnEvent,
};
