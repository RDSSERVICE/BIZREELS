const { KycDocument } = require('../models/Phase4');
const User = require('../models/User');
const walletService = require('./wallet.service');
const logger = require('../utils/logger');

const MIN_DOCS_FOR_TRUST_PLUS = 2;
const BONUS_CREDITS = 100;
const MATCH_BOOST = 15;
const FEED_BOOST = 15;

const computeStatus = async (userId) => {
  const approved = await KycDocument.countDocuments({
    user_id: userId,
    status: 'approved',
    is_deleted: { $ne: true },
  });
  const u = await User.findById(userId).select('has_received_trusted_plus_bonus');
  return {
    verified_doc_count: approved,
    is_trusted_plus: approved >= MIN_DOCS_FOR_TRUST_PLUS,
    bonus_awarded: u ? !!u.has_received_trusted_plus_bonus : false,
    min_required: MIN_DOCS_FOR_TRUST_PLUS,
    match_boost: MATCH_BOOST,
    feed_boost: FEED_BOOST,
  };
};

const maybeAwardBonus = async (userId) => {
  const approved = await KycDocument.countDocuments({
    user_id: userId,
    status: 'approved',
    is_deleted: { $ne: true },
  });

  if (approved < MIN_DOCS_FOR_TRUST_PLUS) {
    return { awarded: false, reason: `needs ${MIN_DOCS_FOR_TRUST_PLUS} verified docs` };
  }

  // Atomic CLAIM — only fires when the flag isn't already true.
  const claim = await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { has_received_trusted_plus_bonus: { $exists: false } },
        { has_received_trusted_plus_bonus: false },
      ],
    },
    {
      $set: {
        has_received_trusted_plus_bonus: true,
        is_trusted_plus: true,
      },
    }
  );

  if (!claim) {
    return { awarded: false, reason: 'already awarded' };
  }

  // Credit wallet
  try {
    await walletService.earnCredits(
      userId,
      BONUS_CREDITS,
      'trust_plus_bonus',
      'kyc',
      `trust_plus:${userId}`
    );
  } catch (err) {
    // Roll back the atomic claim so the user can retry.
    await User.updateOne(
      { _id: userId },
      { $set: { has_received_trusted_plus_bonus: false } }
    );
    logger.warn(`wallet credit failed, rolled back trust_plus flag: ${err.message}`);
    return { awarded: false, reason: `credit error: ${err.message}` };
  }

  return { awarded: true, credits: BONUS_CREDITS };
};

module.exports = {
  computeStatus,
  maybeAwardBonus,
};
