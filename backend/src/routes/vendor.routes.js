const express = require('express');
const mongoose = require('mongoose');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const followService = require('../services/follow.service');
const listingService = require('../services/listing.service');
const contactRevealService = require('../services/contact-reveal.service');
const { notTestFilter, catchAsync } = require('../utils/helpers');
const User = require('../models/User');
const Listing = require('../models/Listing');
const ApiError = require('../utils/ApiError');

const router = express.Router();

router.get('/:user_id', optionalAuth, catchAsync(async (req, res) => {
  const { user_id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    throw ApiError.badRequest('Invalid user id');
  }

  const u = await User.findOne({ _id: user_id, is_deleted: { $ne: true } });
  if (!u) {
    throw ApiError.notFound('User not found');
  }

  const followersCount = await followService.followersCount(user_id);
  const viewerId = req.userId || null;
  let following = false;
  if (viewerId && viewerId !== user_id) {
    following = await followService.isFollowing(viewerId, user_id);
  }

  const listingsCount = await Listing.countDocuments({
    vendor_id: user_id,
    is_deleted: { $ne: true },
    status: 'active',
  });

  const isSub = !!u.is_subscribed_verified;
  res.json({
    id: u._id.toString(),
    name: u.name,
    profile_pic: u.profile_pic || null,
    roles: u.roles || [],
    kyc_status: u.kyc_status || 'unverified',
    followers_count: followersCount,
    listings_count: listingsCount,
    viewer_following: following,
    is_subscribed_verified: isSub,
    verified_badge: isSub && u.kyc_status === 'approved',
    rating_avg: u.rating_avg || 0.0,
    rating_count: u.rating_count || 0,
    trust_score: u.trust_score || 0,
    city: u.city || null,
    avg_response_time_seconds: u.avg_response_time_seconds || null,
    chat_response_rate: u.chat_response_rate || 0.0,
  });
}));

router.get('/:user_id/listings', catchAsync(async (req, res) => {
  const { user_id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    throw ApiError.badRequest('Invalid user id');
  }

  const items = await listingService.listByVendor(user_id, false);
  res.json({ items });
}));

router.get('/:user_id/followers/count', catchAsync(async (req, res) => {
  const { user_id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    throw ApiError.badRequest('Invalid user id');
  }

  const count = await followService.followersCount(user_id);
  res.json({ count });
}));

router.get('/leaderboard/fast-responders', catchAsync(async (req, res) => {
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || 10, 10)));
  const { city } = req.query;

  const q = {
    roles: 'vendor',
    is_deleted: { $ne: true },
    is_banned: { $ne: true },
    chat_response_rate: { $gte: 0.7 },
    avg_response_time_seconds: { $gt: 0, $ne: null },
    ...notTestFilter('name'),
  };

  if (city) {
    const escaped = String(city).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').slice(0, 80);
    q.city = { $regex: `^${escaped}$`, $options: 'i' };
  }

  const docs = await User.find(q)
    .sort({ avg_response_time_seconds: 1, chat_response_rate: -1 })
    .limit(limit);

  const items = docs.map(u => {
    const ts = u.trust_score || 0;
    const tier = ts < 30 ? 'newcomer' : ts < 60 ? 'trusted' : ts < 85 ? 'top-rated' : 'elite';
    return {
      id: u._id.toString(),
      name: u.name,
      profile_pic: u.profile_pic || null,
      city: u.city || null,
      avg_response_time_seconds: u.avg_response_time_seconds,
      chat_response_rate: u.chat_response_rate || 0.0,
      trust_score: ts,
      trust_score_tier: tier,
    };
  });

  res.json({ city: city || null, items });
}));

router.post('/:user_id/reveal-contact', requireAuth, catchAsync(async (req, res) => {
  const { user_id } = req.params;
  const result = await contactRevealService.revealContact(req.user._id.toString(), user_id);
  res.json(result);
}));

module.exports = router;
