const User = require('../models/User');
const { KycDocument } = require('../models/Phase4');
const walletService = require('./wallet.service');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

const BONUS_CREDITS = 30;

const computeState = async (userId) => {
  const u = await User.findById(userId);
  if (!u) {
    return { steps: [], completed: 0, total: 3, reward_granted: false };
  }

  const hasPic = !!u.profile_pic;
  const hasCity = !!u.city;
  const verifiedCount = await KycDocument.countDocuments({
    user_id: userId,
    status: 'approved',
    is_deleted: { $ne: true },
  });
  const kycOk = verifiedCount > 0 || u.kyc_status === 'approved';
  const allDone = hasPic && hasCity && kycOk;
  const rewardGranted = !!u.has_received_profile_complete_bonus;

  const steps = [
    { key: 'profile_pic', label: 'Add a profile picture', done: hasPic },
    { key: 'city', label: 'Add your city', done: hasCity },
    { key: 'verification', label: 'Verify at least one ID', done: kycOk },
  ];

  const completed = steps.filter(s => s.done).length;
  return {
    steps,
    completed,
    total: steps.length,
    all_done: allDone,
    reward_granted: rewardGranted,
    reward_credits: BONUS_CREDITS,
  };
};

const maybeGrantBonus = async (userId) => {
  const state = await computeState(userId);
  if (!state.all_done || state.reward_granted) {
    return state;
  }

  const marker = await User.findOneAndUpdate(
    { _id: userId, has_received_profile_complete_bonus: { $ne: true } },
    { $set: { has_received_profile_complete_bonus: true, updated_at: new Date().toISOString() } },
    { returnDocument: 'after' }
  );

  if (!marker) {
    return await computeState(userId);
  }

  try {
    await walletService.earnCredits(
      userId,
      BONUS_CREDITS,
      'Profile completion bonus',
      'profile_complete',
      userId
    );
    await notificationService.create(
      userId,
      'reward',
      `+${BONUS_CREDITS} profile bonus!`,
      "You've completed all onboarding steps.",
      {},
      '/wallet'
    );
  } catch (err) {
    logger.error('profile-complete bonus grant failed:', err.message);
  }

  return await computeState(userId);
};

module.exports = {
  computeState,
  maybeGrantBonus,
};
