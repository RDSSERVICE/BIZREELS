const mongoose = require('mongoose');
const User = require('../models/User');
const { ChatThread } = require('../models/Chat');
const Deal = require('../models/Deal');
const walletService = require('./wallet.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const REVEAL_CREDIT_COST = 5;
const DAILY_REVEAL_LIMIT = 5;

const getDailyCount = async (userId) => {
  const conn = mongoose.connection;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  return await conn.db.collection('contact_reveals').countDocuments({
    requester_id: userId,
    created_at: { $gte: since.toISOString() },
  });
};

const hasActiveRelationship = async (requesterId, vendorId) => {
  // Check if they share a chat thread (either customer/vendor)
  const thread = await ChatThread.findOne({
    participants: { $all: [requesterId, vendorId] },
  });
  if (thread) return true;

  // Check if they have an accepted or completed deal
  const deal = await Deal.findOne({
    buyer_id: requesterId,
    seller_id: vendorId,
    status: { $in: ['accepted', 'completed'] },
  });
  if (deal) return true;

  return false;
};

const hasVerifiedBadge = (userDoc) => {
  return !!userDoc.is_subscribed_verified && userDoc.kyc_status === 'approved';
};

const revealContact = async (requesterId, vendorId) => {
  if (requesterId === vendorId) {
    throw ApiError.badRequest('Cannot reveal your own contact');
  }

  const vendor = await User.findOne({ _id: vendorId, is_deleted: { $ne: true } });
  if (!vendor) {
    throw ApiError.notFound('Vendor not found');
  }

  const requester = await User.findById(requesterId);
  if (!requester) {
    throw ApiError.unauthorized('Requester not found');
  }

  const usedToday = await getDailyCount(requesterId);
  if (usedToday >= DAILY_REVEAL_LIMIT) {
    throw new ApiError(429, `Daily reveal limit (${DAILY_REVEAL_LIMIT}) reached. Try again after midnight.`);
  }

  const relationship = await hasActiveRelationship(requesterId, vendorId);
  const verified = hasVerifiedBadge(requester);
  let creditsSpent = 0;

  if (!relationship && !verified) {
    try {
      const wallet = await walletService.getOrCreate(requesterId);
      const balance = parseInt(wallet.credits || 0, 10);
      if (balance < REVEAL_CREDIT_COST) {
        throw new ApiError(
          402,
          `Not enough credits (${balance} available; ${REVEAL_CREDIT_COST} needed). Start a chat with the vendor or subscribe for free reveals.`
        );
      }
      await walletService.spendCredits(
        requesterId,
        REVEAL_CREDIT_COST,
        'contact_reveal',
        'contact_reveal',
        vendorId
      );
      creditsSpent = REVEAL_CREDIT_COST;
    } catch (err) {
      if (err.statusCode) throw err;
      logger.error('Wallet spend failed on reveal:', err.message);
      throw ApiError.internal('Payment failed. Please try again.');
    }
  }

  const phone = vendor.phone || '';
  const unlock = relationship ? 'relationship' : (verified ? 'verified' : 'credits');

  const conn = mongoose.connection;
  await conn.db.collection('contact_reveals').insertOne({
    requester_id: requesterId,
    vendor_id: vendorId,
    unlock_reason: unlock,
    credits_spent: creditsSpent,
    created_at: new Date().toISOString(),
  });

  const whatsappUrl = phone ? `https://wa.me/91${phone}` : null;

  return {
    phone,
    whatsapp_url: whatsappUrl,
    unlock_reason: unlock,
    credits_spent: creditsSpent,
    reveals_used_today: usedToday + 1,
    reveals_remaining_today: DAILY_REVEAL_LIMIT - usedToday - 1,
  };
};

module.exports = {
  revealContact,
};
