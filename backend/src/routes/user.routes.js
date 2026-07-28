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
  const page = Math.max(1, parseInt(req.query.page || 1, 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 12, 10)));
  const skip = (page - 1) * limit;

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

  const [users, total] = await Promise.all([
    User.find(query)
      .select('name profile_pic avatarUrl city rating_avg rating_count creatorProfile created_at kyc_status is_subscribed_verified occupation roles current_role')
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

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
    data: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
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

  const { search, type, category, status, minPrice, maxPrice, sortBy, page = 1, limit = 10 } = req.query;

  const baseQuery = {
    _id: { $in: savedIds },
    isDeleted: { $ne: true }
  };

  if (type) {
    baseQuery.type = type;
  }

  if (category) {
    baseQuery.category = category;
  }

  if (status) {
    baseQuery.status = status;
  }

  if (minPrice || maxPrice) {
    baseQuery.price = {};
    if (minPrice) baseQuery.price.$gte = parseFloat(minPrice);
    if (maxPrice) baseQuery.price.$lte = parseFloat(maxPrice);
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const User = require('../models/User');
    const matchedUsers = await User.find({
      $or: [
        { name: searchRegex },
        { 'vendorProfile.shopName': searchRegex },
        { 'vendorProfile.businessName': searchRegex }
      ]
    }).select('_id');
    const userIds = matchedUsers.map(u => u._id);

    baseQuery.$or = [
      { title: searchRegex },
      { category: searchRegex },
      { vendor: { $in: userIds } }
    ];
  }

  // Sort mapping
  let sort = { updatedAt: -1 };
  if (sortBy) {
    if (sortBy === 'latest') sort = { createdAt: -1 };
    else if (sortBy === 'oldest') sort = { createdAt: 1 };
    else if (sortBy === 'price_low_high') sort = { price: 1 };
    else if (sortBy === 'price_high_low') sort = { price: -1 };
    else if (sortBy === 'highest_rated') sort = { rating: -1 };
    else if (sortBy === 'most_popular') sort = { totalReviews: -1 };
  }

  const total = await Listing.countDocuments(baseQuery);
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const skip = (parsedPage - 1) * parsedLimit;

  const listings = await Listing.find(baseQuery)
    .populate('vendor', 'name avatarUrl profile_pic roles vendorProfile rating_avg rating_count')
    .sort(sort)
    .skip(skip)
    .limit(parsedLimit)
    .lean();

  const formatted = listings.map(l => ({
    ...l,
    id: l._id.toString(),
    _id: l._id.toString()
  }));

  res.json({
    success: true,
    saved: formatted,
    data: formatted,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total
    }
  });
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
  const page = Math.max(1, parseInt(req.query.page || 1, 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 12, 10)));
  const skip = (page - 1) * limit;

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

  const [creators, total] = await Promise.all([
    User.find(query)
      .select('name profile_pic avatarUrl city rating_avg rating_count creatorProfile created_at kyc_status is_subscribed_verified occupation')
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

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
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// ── Interest Selection (Post-Login) ────────────────────────────────────
router.get('/me/interests', requireAuth, catchAsync(async (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    interests: user.customerProfile?.interests || [],
    interestsSelectedAt: user.customerProfile?.interestsSelectedAt || null,
  });
}));

router.patch('/me/interests', requireAuth, catchAsync(async (req, res) => {
  const { interests } = req.body;
  if (!Array.isArray(interests) || interests.length < 5) {
    throw ApiError.badRequest('Please select at least 5 interests');
  }
  if (interests.length > 15) {
    throw ApiError.badRequest('Maximum 15 interests allowed');
  }
  const cleanedInterests = interests.map(i => ({
    category: String(i.category || '').trim(),
    subcategory: i.subcategory ? String(i.subcategory).trim() : null,
  })).filter(i => i.category);

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        'customerProfile.interests': cleanedInterests,
        'customerProfile.interestsSelectedAt': new Date(),
      }
    },
    { returnDocument: 'after' }
  );
  res.json({
    success: true,
    interests: updated.customerProfile?.interests || [],
    interestsSelectedAt: updated.customerProfile?.interestsSelectedAt,
  });
}));

// ── Activity Counts (Analytics for Activities Dashboard) ───────────────
router.get('/me/activity-counts', requireAuth, catchAsync(async (req, res) => {
  const Interaction = require('../models/Interaction');
  const Notification = require('../models/Notification');
  const { ChatMessage } = require('../models/Chat');
  const uid = req.user._id.toString();

  // Run consolidated Mongoose queries in parallel (reducing database hits and avoiding connection storms)
  const [
    interactionCounts,
    unreadNotifications,
    unreadChat
  ] = await Promise.all([
    Interaction.aggregate([
      { $match: { user_id: uid } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          listingIds: { $push: '$listing_id' }
        }
      }
    ]),
    Notification.countDocuments({ recipient: uid, isRead: false }).catch(() => 0),
    ChatMessage.countDocuments({ receiver_id: uid, read_at: null, is_deleted: { $ne: true } }).catch(() => 0)
  ]);

  const counts = {
    save: 0,
    save_reel: 0,
    save_image: 0,
    click_to_call: 0,
    whatsapp_contact: 0,
    chat_inquiry: 0
  };

  let savedSaves = [];

  interactionCounts.forEach(item => {
    if (item._id in counts) {
      counts[item._id] = item.count;
    }
    if (item._id === 'save') {
      savedSaves = (item.listingIds || []).filter(Boolean).map(id => ({ listing_id: id }));
    }
  });

  const savedReels = counts.save_reel;
  const savedImages = counts.save_image;
  const clickToCalled = counts.click_to_call;
  const whatsappContacted = counts.whatsapp_contact;
  const chatInquiries = counts.chat_inquiry;

  let savedServices = 0;
  let actualSavedProducts = 0;

  if (savedSaves.length > 0) {
    const listingIds = savedSaves.map(s => s.listing_id).filter(Boolean);
    if (listingIds.length > 0) {
      const Listing = require('../models/Listing');
      savedServices = await Listing.countDocuments({
        _id: { $in: listingIds },
        type: 'service',
        isDeleted: { $ne: true }
      }).catch(() => 0);
    }
    actualSavedProducts = savedSaves.length - savedServices;
  }

  const total = actualSavedProducts + savedServices + savedReels + savedImages + clickToCalled + whatsappContacted + chatInquiries;

  res.json({
    success: true,
    savedProducts: Math.max(0, actualSavedProducts),
    savedServices,
    savedReels,
    savedImages,
    clickToCalled,
    whatsappContacted,
    chatInquiries,
    total,
    unreadNotifications,
    unreadChat,
  });
}));

// ── GET Activities List ────────────────────────────────────────────────
router.get('/me/activities', requireAuth, catchAsync(async (req, res) => {
  const { type, search, sortBy, page = 1, limit = 6 } = req.query;
  const uid = req.user._id.toString();
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const Interaction = require('../models/Interaction');
  const Listing = require('../models/Listing');
  const Reel = require('../models/Reel');
  const User = require('../models/User');

  let results = [];
  let total = 0;

  if (type === 'saved-products' || type === 'saved-services') {
    const listingType = type === 'saved-products' ? 'product' : 'service';
    const inters = await Interaction.find({ user_id: uid, type: 'save', listing_id: { $ne: null } }).select('listing_id');
    const listingIds = inters.map(i => i.listing_id);

    const query = { _id: { $in: listingIds }, type: listingType, isDeleted: { $ne: true } };
    if (search) {
      query.title = { $regex: new RegExp(search, 'i') };
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'price_low_high') sort = { price: 1 };
    else if (sortBy === 'price_high_low') sort = { price: -1 };

    total = await Listing.countDocuments(query);
    const listings = await Listing.find(query)
      .populate('vendor', 'name avatarUrl profile_pic roles vendorProfile rating_avg rating_count')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    results = listings.map(l => ({ ...l, id: l._id.toString() }));
  } 
  else if (type === 'saved-reels') {
    const inters = await Interaction.find({ user_id: uid, type: 'save_reel', reel_id: { $ne: null } }).select('reel_id');
    const reelIds = inters.map(i => i.reel_id);

    const query = { _id: { $in: reelIds }, isDeleted: { $ne: true } };
    if (search) {
      query.caption = { $regex: new RegExp(search, 'i') };
    }

    total = await Reel.countDocuments(query);
    const reels = await Reel.find(query)
      .populate('creator', 'name avatarUrl profile_pic roles vendorProfile rating_avg rating_count')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    results = reels.map(r => ({ ...r, id: r._id.toString() }));
  }
  else if (type === 'saved-images') {
    const inters = await Interaction.find({ user_id: uid, type: 'save_image', listing_id: { $ne: null } }).select('listing_id');
    const listingIds = inters.map(i => i.listing_id);

    const query = { _id: { $in: listingIds }, isDeleted: { $ne: true } };
    if (search) {
      query.title = { $regex: new RegExp(search, 'i') };
    }

    total = await Listing.countDocuments(query);
    const listings = await Listing.find(query)
      .populate('vendor', 'name avatarUrl profile_pic roles vendorProfile rating_avg rating_count')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    results = listings.map(l => ({ ...l, id: l._id.toString() }));
  }
  else if (['click-to-called', 'whatsapp-contacted', 'chat-inquiries'].includes(type)) {
    const interactionType = type === 'click-to-called' ? 'click_to_call' : 
                            type === 'whatsapp-contacted' ? 'whatsapp_contact' : 'chat_inquiry';
    
    const query = { user_id: uid, type: interactionType };
    total = await Interaction.countDocuments(query);
    const inters = await Interaction.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const targetUserIds = inters.map(i => i.target_user_id).filter(Boolean);
    const targetUsers = await User.find({ _id: { $in: targetUserIds } })
      .select('name avatarUrl profile_pic roles vendorProfile rating_avg rating_count phone')
      .lean();
    
    const userMap = {};
    targetUsers.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    results = inters.map(i => {
      const vendor = userMap[i.target_user_id] || {};
      return {
        _id: i._id.toString(),
        id: i._id.toString(),
        createdAt: i.created_at,
        type: i.type,
        metadata: i.metadata,
        vendor: {
          id: vendor._id?.toString(),
          _id: vendor._id?.toString(),
          name: vendor.name || 'Verified Vendor',
          avatarUrl: vendor.avatarUrl || vendor.profile_pic,
          vendorProfile: vendor.vendorProfile,
          phone: vendor.phone,
        }
      };
    });
  }

  res.json({
    success: true,
    data: results,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total
    }
  });
}));

// ── Track Interaction (Click-to-Call, WhatsApp, etc.) ──────────────────
router.post('/me/track-interaction', requireAuth, catchAsync(async (req, res) => {
  const Interaction = require('../models/Interaction');
  const { type, listingId, reelId, targetUserId, metadata } = req.body;
  const uid = req.user._id.toString();

  const allowedTypes = ['click_to_call', 'whatsapp_contact', 'chat_inquiry', 'save_reel', 'save_image'];
  if (!allowedTypes.includes(type)) {
    throw ApiError.badRequest('Invalid interaction type');
  }

  const interactionData = {
    user_id: uid,
    type,
    listing_id: listingId || null,
    reel_id: reelId || null,
    target_user_id: targetUserId || null,
    metadata: metadata || null,
  };

  await Interaction.create(interactionData);

  res.json({ success: true, message: 'Interaction tracked' });
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
  } catch (err) { }

  let tier = null;
  try {
    const ts = await trustService.getTrustScore(userId);
    tier = ts.tier;
  } catch (err) { }

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