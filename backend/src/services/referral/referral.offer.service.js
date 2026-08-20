const { Referral } = require('../../models/Misc');
const Offer = require('../../models/Offer');
const User = require('../../models/User');
const logger = require('../../utils/logger');

/**
 * ReferralOfferService
 * Handles vendor-scoped, offer-scoped referral qualification and reward processing.
 * Extends (does not replace) the platform-wide referral system.
 */

/**
 * Check if a referral qualifies for a vendor's referral offer reward.
 * @param {Object} referral - Referral document
 * @param {Object} offer - Offer document (category: 'referral')
 * @param {Object} order - The qualifying order { vendorId, totalAmount, customerId }
 * @returns {{ eligible: boolean, reason?: string }}
 */
async function checkOfferReferralEligibility(referral, offer, order) {
  // 1. Confirm the order is with the correct vendor
  if (offer.vendorId.toString() !== order.vendorId) {
    return { eligible: false, reason: 'Order is not with this vendor' };
  }

  // 2. Confirm offer is active
  if (offer.status !== 'Active') {
    return { eligible: false, reason: 'Referral offer is not active' };
  }

  // 3. Check date validity
  const now = new Date();
  if (now < new Date(offer.startTime) || now > new Date(offer.endTime)) {
    return { eligible: false, reason: 'Referral offer has expired or not yet started' };
  }

  // 4. Check min purchase
  const config = offer.config || {};
  if (config.minPurchaseAmount && order.totalAmount < config.minPurchaseAmount) {
    return {
      eligible: false,
      reason: `Order total ₹${order.totalAmount} is below minimum ₹${config.minPurchaseAmount}`,
    };
  }

  // 5. Check per-customer referral limit for this offer
  if (config.referralLimitPerCustomer) {
    const existingCount = await Referral.countDocuments({
      referrer_id: referral.referrer_id,
      offer_id: offer._id.toString(),
      offer_reward_given: true,
      is_deleted: { $ne: true },
    });

    if (existingCount >= config.referralLimitPerCustomer) {
      return {
        eligible: false,
        reason: `Referral limit (${config.referralLimitPerCustomer}) reached for this offer`,
      };
    }
  }

  return { eligible: true };
}

/**
 * Process offer-scoped reward for a referral.
 * Issues coupon-based rewards by default (no platform wallet liability).
 * @param {string} referralId - Referral document ID
 * @param {string} offerId - Offer document ID
 * @returns {{ processed: boolean, reason?: string }}
 */
async function processOfferReward(referralId, offerId) {
  const ref = await Referral.findById(referralId);
  if (!ref) {
    return { processed: false, reason: 'Referral not found' };
  }

  // Idempotency: already processed for this offer
  if (ref.offer_reward_given && ref.offer_id === offerId) {
    return { processed: false, reason: 'Offer reward already given' };
  }

  const offer = await Offer.findById(offerId);
  if (!offer || offer.category !== 'referral') {
    return { processed: false, reason: 'Referral offer not found' };
  }

  const config = offer.config || {};

  try {
    let referrerRewardResult = null;
    let referredRewardResult = null;

    // Process referrer benefit
    if (config.referrerBenefitValue > 0) {
      if (config.referrerBenefitType === 'coupon') {
        referrerRewardResult = await generateRewardCoupon(
          ref.referrer_id,
          offer.vendorId.toString(),
          config.referrerBenefitValue,
          config.validityDays || 30,
          `Referral reward: you referred a friend`
        );
      } else if (config.referrerBenefitType === 'wallet') {
        const walletService = require('../wallet.service');
        await walletService.earnCredits(
          ref.referrer_id,
          config.referrerBenefitValue,
          `Vendor referral reward from ${offer.title}`,
          'referral',
          `ref_offer_reward_${referralId}_${offerId}_referrer`
        );
        referrerRewardResult = { type: 'wallet', value: config.referrerBenefitValue };
      }
    }

    // Process referred customer benefit
    if (config.newCustomerBenefitValue > 0) {
      if (config.newCustomerBenefitType === 'coupon') {
        referredRewardResult = await generateRewardCoupon(
          ref.referred_user_id,
          offer.vendorId.toString(),
          config.newCustomerBenefitValue,
          config.validityDays || 30,
          `Welcome referral bonus`
        );
      } else if (config.newCustomerBenefitType === 'wallet') {
        const walletService = require('../wallet.service');
        await walletService.earnCredits(
          ref.referred_user_id,
          config.newCustomerBenefitValue,
          `Welcome referral bonus from ${offer.title}`,
          'referral',
          `ref_offer_reward_${referralId}_${offerId}_referred`
        );
        referredRewardResult = { type: 'wallet', value: config.newCustomerBenefitValue };
      }
    }

    // Update referral with offer-scoped reward info
    await Referral.updateOne(
      { _id: ref._id },
      {
        $set: {
          offer_id: offerId,
          vendor_id: offer.vendorId.toString(),
          offer_reward_given: true,
          offer_referrer_reward: referrerRewardResult,
          offer_referred_reward: referredRewardResult,
          offer_min_purchase_met: true,
        },
      }
    );

    // Send notifications
    try {
      const notificationService = require('../notification.service');
      const { emitToUser } = require('../../sockets');

      if (referrerRewardResult) {
        const msg = referrerRewardResult.type === 'coupon'
          ? `You earned a ₹${config.referrerBenefitValue} coupon for referring a friend!`
          : `+₹${config.referrerBenefitValue} referral credits!`;

        await notificationService.create(
          ref.referrer_id, 'reward', msg,
          `Your friend completed a purchase. ${referrerRewardResult.couponCode ? `Use code: ${referrerRewardResult.couponCode}` : ''}`,
          {}, '/wallet', null
        );

        emitToUser(ref.referrer_id, 'referral:offer_reward', {
          type: referrerRewardResult.type,
          value: config.referrerBenefitValue,
          offerId,
        });
      }

      if (referredRewardResult) {
        const msg = referredRewardResult.type === 'coupon'
          ? `You earned a ₹${config.newCustomerBenefitValue} welcome coupon!`
          : `+₹${config.newCustomerBenefitValue} welcome bonus!`;

        await notificationService.create(
          ref.referred_user_id, 'reward', msg,
          `Welcome referral bonus unlocked. ${referredRewardResult.couponCode ? `Use code: ${referredRewardResult.couponCode}` : ''}`,
          {}, '/wallet', null
        );

        emitToUser(ref.referred_user_id, 'referral:offer_bonus', {
          type: referredRewardResult.type,
          value: config.newCustomerBenefitValue,
          offerId,
        });
      }
    } catch (err) {
      // Non-blocking notification failure
    }

    logger.info(`Offer referral reward processed: referral=${referralId}, offer=${offerId}`, {
      service: 'referral-offer',
    });

    return {
      processed: true,
      referrerReward: referrerRewardResult,
      referredReward: referredRewardResult,
    };
  } catch (err) {
    logger.error(`Offer referral reward failed: ${err.message}`, {
      service: 'referral-offer',
      referralId,
      offerId,
    });
    return { processed: false, reason: err.message };
  }
}

/**
 * Generate a single-use coupon for a reward.
 * Creates a new Offer document of category 'coupon' scoped to the customer and vendor.
 */
async function generateRewardCoupon(customerId, vendorId, value, validityDays, description) {
  const crypto = require('crypto');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let couponCode = 'REF';
  for (let i = 0; i < 6; i++) {
    couponCode += chars.charAt(crypto.randomInt(0, chars.length));
  }

  const now = new Date();
  const endTime = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

  const couponOffer = new Offer({
    category: 'coupon',
    offerName: 'Referral Reward Coupon',
    vendorId,
    isVendorOffer: true,
    config: {
      couponCode,
      couponType: 'fixed',
      minOrderAmount: 0,
      maxDiscountLimit: value,
      usagePerCustomer: 1,
      totalUsageLimit: 1,
      applicableProducts: [],
      visibility: 'private',
      selectedCustomerIds: [customerId],
    },
    title: `₹${value} Referral Reward`,
    description: description || `Referral reward coupon worth ₹${value}`,
    code: couponCode,
    targetRoles: ['customer'],
    discountType: 'fixed',
    discountValue: value,
    startTime: now,
    endTime,
    status: 'Active',
    createdBy: vendorId,
    perUserLimit: 1,
    usageLimit: 1,
  });

  await couponOffer.save();

  return {
    type: 'coupon',
    value,
    couponCode,
    couponOfferId: couponOffer._id.toString(),
    expiresAt: endTime.toISOString(),
  };
}

/**
 * Get aggregated stats for a vendor's referral offer.
 */
async function getVendorReferralOfferStats(vendorId) {
  const referralOffer = await Offer.findOne({
    vendorId,
    category: 'referral',
    isVendorOffer: true,
    isDeleted: { $ne: true },
    status: 'Active',
  }).lean();

  if (!referralOffer) {
    return { hasActiveOffer: false, offer: null, stats: null };
  }

  const offerId = referralOffer._id.toString();
  const [total, converted] = await Promise.all([
    Referral.countDocuments({ offer_id: offerId, is_deleted: { $ne: true } }),
    Referral.countDocuments({ offer_id: offerId, offer_reward_given: true, is_deleted: { $ne: true } }),
  ]);

  return {
    hasActiveOffer: true,
    offer: referralOffer,
    stats: {
      totalReferrals: total,
      convertedReferrals: converted,
      conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
    },
  };
}

/**
 * Check and process offer-scoped referral on order completion.
 * Called from the order completion flow after platform referral processing.
 * @param {string} customerId - The customer who placed the order
 * @param {string} vendorId - The vendor who received the order
 * @param {number} orderTotal - Order total amount
 */
async function maybeAwardOfferReferralOnOrder(customerId, vendorId, orderTotal) {
  try {
    // Find the referral record for this customer
    const referral = await Referral.findOne({
      referred_user_id: customerId,
      is_deleted: { $ne: true },
    });

    if (!referral) return;

    // Already processed for an offer
    if (referral.offer_reward_given) return;

    // Find active referral offer for this vendor
    const referralOffer = await Offer.findOne({
      vendorId,
      category: 'referral',
      isVendorOffer: true,
      isDeleted: { $ne: true },
      status: 'Active',
    });

    if (!referralOffer) return;

    // Check eligibility
    const eligibility = await checkOfferReferralEligibility(referral, referralOffer, {
      vendorId,
      totalAmount: orderTotal,
      customerId,
    });

    if (!eligibility.eligible) {
      logger.info(`Offer referral not eligible: ${eligibility.reason}`, {
        service: 'referral-offer',
        customerId,
        vendorId,
      });
      return;
    }

    // Process the reward
    const result = await processOfferReward(referral._id.toString(), referralOffer._id.toString());
    if (result.processed) {
      logger.info(`Offer referral reward auto-awarded: customer=${customerId}, vendor=${vendorId}`, {
        service: 'referral-offer',
      });
    }
  } catch (err) {
    logger.error(`maybeAwardOfferReferralOnOrder failed: ${err.message}`, {
      service: 'referral-offer',
      customerId,
      vendorId,
    });
  }
}

module.exports = {
  checkOfferReferralEligibility,
  processOfferReward,
  generateRewardCoupon,
  getVendorReferralOfferStats,
  maybeAwardOfferReferralOnOrder,
};
