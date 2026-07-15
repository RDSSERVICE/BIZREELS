const User = require('../models/User');
const Deal = require('../models/Deal');
const Listing = require('../models/Listing');
const { Review } = require('../models/Phase4');
const { ChatThread } = require('../models/Chat');
const subscriptionService = require('./subscription.service');
const ApiError = require('../utils/ApiError');

const trustScore = async (userId) => {
  const u = await User.findById(userId);
  if (!u) {
    throw ApiError.notFound('User not found');
  }

  const completed = await Deal.countDocuments({
    $or: [{ seller_id: userId }, { buyer_id: userId }],
    status: 'completed',
  });

  const listingIds = (await Listing.find({ vendor_id: userId, is_deleted: { $ne: true } }).select('_id')).map(li => li._id.toString());

  const reviewMatch = {
    $or: [
      { target_type: 'vendor', target_id: userId },
      ...(listingIds.length > 0 ? [{ target_type: { $in: ['listing', 'service'] }, target_id: { $in: listingIds } }] : []),
    ],
    is_deleted: { $ne: true },
  };

  const reviewsAgg = await Review.aggregate([
    { $match: reviewMatch },
    { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ]);

  const avgRating = reviewsAgg.length > 0 ? Math.round(reviewsAgg[0].avg * 100) / 100 : 0.0;
  const totalReviews = reviewsAgg.length > 0 ? reviewsAgg[0].n : 0;
  const verifiedPurchaseCount = await Review.countDocuments({
    ...reviewMatch,
    is_verified_purchase: true,
  });

  // Days since joining
  let days = 0;
  try {
    const created = new Date(u.created_at || u.createdAt);
    days = Math.floor((new Date() - created) / (24 * 60 * 60 * 1000));
  } catch {}

  const storedRate = parseFloat(u.chat_response_rate || 0.0);
  const respondedN = parseInt(u.total_conversations_responded || 0, 10);
  let chatRate = 0.0;

  if (respondedN > 0) {
    chatRate = storedRate;
  } else {
    const myThreads = await ChatThread.countDocuments({ participants: userId });
    // In ChatMessage sender_id is stored
    const { ChatMessage } = require('../models/Chat');
    const myMsgThreads = await ChatMessage.distinct('thread_id', { sender_id: userId });
    chatRate = myThreads ? myMsgThreads.length / myThreads : 0.0;
  }

  const isKyc = u.kyc_status === 'approved';
  const isSub = await subscriptionService.hasActiveVerifiedSub(userId);

  const base = 30;
  const dealsPts = Math.min(30, completed * 3);
  const ratingPts = avgRating ? Math.max(-20, Math.min(20, (avgRating - 3) * 10)) : 0;
  const chatPts = Math.min(10, chatRate * 10);
  const agePts = Math.min(10, days / 10);
  const kycPts = isKyc ? 10 : 0;
  const subsPts = isSub ? 5 : 0;

  const score = Math.max(0, Math.min(100, Math.round(base + dealsPts + ratingPts + chatPts + agePts + kycPts + subsPts)));
  let tier = 'newcomer';
  if (score >= 85) tier = 'elite';
  else if (score >= 60) tier = 'top-rated';
  else if (score >= 30) tier = 'trusted';

  // Update user stats
  await User.updateOne(
    { _id: userId },
    { $set: { trust_score: score, is_subscribed_verified: isSub } }
  );

  return {
    score,
    tier,
    breakdown: {
      base,
      deals_completed: completed,
      deals_pts: dealsPts,
      avg_rating: avgRating,
      total_reviews: totalReviews,
      verified_purchase_count: verifiedPurchaseCount,
      rating_pts: ratingPts,
      chat_response_rate: Math.round(chatRate * 100) / 100,
      chat_pts: Math.round(chatPts * 10) / 10,
      days_since_join: days,
      age_pts: Math.round(agePts * 10) / 10,
      kyc_approved: isKyc,
      kyc_pts: kycPts,
      is_subscribed_verified: isSub,
      subs_pts: subsPts,
    },
  };
};

module.exports = {
  trustScore,
};
