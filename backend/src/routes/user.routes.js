const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
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

const router = express.Router();

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
