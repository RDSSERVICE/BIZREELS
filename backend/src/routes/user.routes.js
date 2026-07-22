const express = require('express');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const userService = require('../services/user.service');
const subscriptionService = require('../services/subscription.service');
const fcmService = require('../services/fcm.service');
const followService = require('../services/follow.service');
const trustService = require('../services/trust.service');
const { ChatThread, ChatMessage } = require('../models/Chat');
const Deal = require('../models/Deal');
const Requirement = require('../models/Requirement');
const User = require('../models/User');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', optionalAuth, catchAsync(async (req, res) => {
  const { role, city, category, search, excludeUserId } = req.query;
  const viewerId = req.userId || (req.user?._id ? req.user._id.toString() : null) || excludeUserId;

  const query = { is_deleted: { $ne: true } };

  if (role) {
    query.$or = [
      { roles: role },
      { current_role: role },
      { [`${role}Profile`]: { $ne: null } }
    ];
  }

  if (viewerId && mongoose.Types.ObjectId.isValid(viewerId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(viewerId) };
  }

  if (city && city !== 'all' && city !== 'All Cities') {
    const escaped = String(city).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.city = new RegExp(`^${escaped}$`, 'i');
  }

  if (category && category !== 'all' && category !== 'All Categories') {
    const catRegex = new RegExp(category, 'i');
    query.$or = [
      { 'creatorProfile.category': catRegex },
      { occupation: catRegex }
    ];
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { name: searchRegex },
      { 'creatorProfile.name': searchRegex },
      { 'creatorProfile.bio': searchRegex },
      { 'creatorProfile.category': searchRegex }
    ];
  }

  const users = await User.find(query)
    .select('name profile_pic avatarUrl city rating_avg rating_count creatorProfile created_at kyc_status is_subscribed_verified occupation roles current_role')
    .lean();

  const formatted = users.map(u => ({
    _id: u._id.toString(),
    id: u._id.toString(),
    name: u.creatorProfile?.name || u.name || 'Verified Creator',
    profile_pic: u.profile_pic || u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    avatarUrl: u.profile_pic || u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    city: u.city || 'Mumbai',
    category: u.creatorProfile?.category || u.occupation || 'Visual Creator',
    bio: u.creatorProfile?.bio || 'Verified content creator on BizReels.',
    rating_avg: u.rating_avg || 4.9,
    rating_count: u.rating_count || 12,
    creatorProfile: u.creatorProfile || {
      name: u.name,
      category: u.occupation || 'Creator',
      bio: 'Verified content creator on BizReels.',
      pricing: { reel1: 800, reel3: 2000 }
    },
    pricing: u.creatorProfile?.pricing || { reel1: 800, reel3: 2000 },
    isVerified: u.kyc_status === 'approved' || u.is_subscribed_verified
  }));

  res.json({
    success: true,
    count: formatted.length,
    users: formatted,
    data: formatted
  });
}));

router.get('/me', requireAuth, catchAsync(async (req, res) => {
  const user = req.user;
  // Lazy-reconcile is_subscribed_verified against actual sub expiry.
  try {
    const current = !!user.is_subscribed_verified;
    const active = await subscriptionService.hasActiveVerifiedSub(user._id.toString());
    if (current !== active) {
      await User.updateOne(
        { _id: user._id },
        { $set: { is_subscribed_verified: active } }
      );
      user.is_subscribed_verified = active;
    }
  } catch (err) {
    // Non-fatal fallback
  }

  res.json({ user: userService.serialize(user) });
}));

router.patch('/me', requireAuth, catchAsync(async (req, res) => {
  const updated = await userService.updateProfile(req.user._id.toString(), req.body);
  res.json({ user: userService.serialize(updated) });
}));

router.get('/me/saved', requireAuth, catchAsync(async (req, res) => {
  const Listing = require('../models/Listing');
  const savedIds = req.user.customerProfile?.savedListings || [];
  const listings = await Listing.find({ _id: { $in: savedIds }, is_deleted: { $ne: true } }).lean();
  res.json({ saved: listings.map(l => ({ id: l._id.toString(), title: l.title, price: l.price, image: l.images?.[0] || '' })) });
}));

router.post('/me/switch-role', requireAuth, catchAsync(async (req, res) => {
  const { role } = req.body;
  if (!role) {
    throw ApiError.badRequest('role is required');
  }
  const updated = await userService.switchRole(req.user._id.toString(), role);
  res.json({ user: userService.serialize(updated) });
}));

router.post('/me/add-role', requireAuth, catchAsync(async (req, res) => {
  const { role } = req.body;
  if (!role) {
    throw ApiError.badRequest('role is required');
  }
  const updated = await userService.addRole(req.user._id.toString(), role);
  res.json({ user: userService.serialize(updated) });
}));

router.post('/me/fcm-token', requireAuth, catchAsync(async (req, res) => {
  const { token, platform = 'web' } = req.body;
  if (!token || token.length < 10) {
    throw ApiError.badRequest('Invalid token');
  }
  const result = await fcmService.registerToken(req.user._id.toString(), token, platform);
  res.json(result);
}));

router.delete('/me/fcm-token/:token', requireAuth, catchAsync(async (req, res) => {
  const result = await fcmService.removeToken(req.user._id.toString(), req.params.token);
  res.json(result);
}));

router.get('/me/role-activity', requireAuth, catchAsync(async (req, res) => {
  const user = req.user;
  const uid = user._id.toString();
  const out = { current_role: user.current_role, roles: user.roles || [] };

  if (out.roles.includes('vendor')) {
    const threads = await ChatThread.find({ vendor_id: uid, is_deleted: { $ne: true } }).select('_id');
    const threadIds = threads.map(t => t._id.toString());
    const chatUnread = await ChatMessage.countDocuments({
      thread_id: { $in: threadIds },
      sender_id: { $ne: uid },
      read_by: { $ne: uid },
    });
    const pendingDeals = await Deal.countDocuments({
      seller_id: uid,
      status: 'negotiating',
      is_deleted: { $ne: true },
    });
    out.vendor = { chat_unread: chatUnread, pending_deals: pendingDeals };
  }

  if (out.roles.includes('customer')) {
    const threads = await ChatThread.find({ customer_id: uid, is_deleted: { $ne: true } }).select('_id');
    const threadIds = threads.map(t => t._id.toString());
    const chatUnread = await ChatMessage.countDocuments({
      thread_id: { $in: threadIds },
      sender_id: { $ne: uid },
      read_by: { $ne: uid },
    });
    out.customer = { chat_unread: chatUnread };
  }

  if (out.roles.includes('creator')) {
    const openRequirements = await Requirement.countDocuments({
      status: 'open',
      is_deleted: { $ne: true },
      $or: [
        { interested_creator_ids: uid },
        { 'proposals.creator_id': uid },
        { assigned_to_user_id: uid },
      ],
    });
    out.creator = { open_requirements: openRequirements };
  }

  res.json(out);
}));

router.get('/creators/public', optionalAuth, catchAsync(async (req, res) => {
  const { city, category, search, excludeUserId } = req.query;
  const viewerId = req.userId || (req.user?._id ? req.user._id.toString() : null) || excludeUserId;

  const query = {
    $or: [{ roles: 'creator' }, { current_role: 'creator' }, { creatorProfile: { $ne: null } }],
    is_deleted: { $ne: true }
  };

  if (viewerId && mongoose.Types.ObjectId.isValid(viewerId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(viewerId) };
  }

  if (city && city !== 'All Cities' && city !== 'all') {
    query.city = new RegExp(city, 'i');
  }

  if (category && category !== 'All Categories' && category !== 'all') {
    query.$or = [
      { 'creatorProfile.category': new RegExp(category, 'i') },
      { occupation: new RegExp(category, 'i') }
    ];
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { name: searchRegex },
      { 'creatorProfile.name': searchRegex },
      { 'creatorProfile.bio': searchRegex },
      { 'creatorProfile.category': searchRegex }
    ];
  }

  const creators = await User.find(query)
    .select('name profile_pic avatarUrl city rating_avg rating_count creatorProfile created_at kyc_status is_subscribed_verified occupation')
    .lean();

  res.json({
    success: true,
    count: creators.length,
    creators: creators.map(c => ({
      _id: c._id.toString(),
      name: c.creatorProfile?.name || c.name || 'Verified Creator',
      avatarUrl: c.profile_pic || c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      city: c.city || 'India',
      category: c.creatorProfile?.category || c.occupation || 'Visual Creator',
      bio: c.creatorProfile?.bio || 'Professional short-form video creator & brand ambassador on BizReels.',
      rating: c.rating_avg || 4.9,
      reviewsCount: c.rating_count || 12,
      pricing: c.creatorProfile?.pricing || { reel1: 800, reel3: 2000 },
      isVerified: c.kyc_status === 'approved' || c.is_subscribed_verified
    }))
  });
}));

router.get('/:userId', catchAsync(async (req, res) => {
  const { userId } = req.params;
  const u = await User.findOne({ _id: userId, is_deleted: { $ne: true } });
  if (!u) {
    throw ApiError.notFound('User not found');
  }

  const isSub = !!u.is_subscribed_verified;
  const kyc = u.kyc_status || 'unverified';
  let followers = 0;
  try {
    followers = await followService.followersCount(userId);
  } catch (err) {}

  let tier = null;
  try {
    const ts = await trustService.getTrustScore(userId);
    tier = ts.tier;
  } catch (err) {}

  res.json({
    id: u._id.toString(),
    name: u.name,
    roles: u.roles || [],
    profile_pic: u.profile_pic,
    city: u.city,
    kyc_status: kyc,
    is_subscribed_verified: isSub,
    verified_badge: isSub && kyc === 'approved',
    rating_avg: u.rating_avg || 0.0,
    rating_count: u.rating_count || 0,
    followers_count: followers,
    trust_score_tier: tier,
    created_at: u.created_at,
  });
}));

module.exports = router;
