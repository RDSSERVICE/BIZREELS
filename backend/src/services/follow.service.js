const Follow = require('../models/Follow');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

const follow = async (followerId, followingId) => {
  if (followerId === followingId) {
    throw ApiError.badRequest("You can't follow yourself");
  }

  const follower = await User.findOne({ _id: followerId, is_deleted: { $ne: true } });
  const target = await User.findOne({ _id: followingId, is_deleted: { $ne: true } });
  if (!target || !follower) {
    throw ApiError.notFound('User not found');
  }

  // Save follow relationship in database
  const followDoc = await Follow.findOneAndUpdate(
    { follower_id: followerId, following_id: followingId },
    {
      $setOnInsert: {
        follower_id: followerId,
        following_id: followingId,
        following_type: 'user',
      },
    },
    { upsert: true, new: true }
  );

  // Update customer (follower) following array & followingCount
  await User.updateOne(
    { _id: followerId },
    {
      $addToSet: { following: new mongoose.Types.ObjectId(followingId) },
      $set: { followingCount: await Follow.countDocuments({ follower_id: followerId }) }
    }
  );

  // Update vendor (followingId) followers array & followersCount
  const count = await Follow.countDocuments({ following_id: followingId });
  await User.updateOne(
    { _id: followingId },
    {
      $addToSet: { followers: new mongoose.Types.ObjectId(followerId) },
      $set: { followersCount: count }
    }
  );

  // Send real-time notification to the vendor
  try {
    const notificationService = require('./notification.service');
    const senderName = follower.name || 'Someone';
    await notificationService.create(
      followingId,
      'follow',
      'New Follower',
      `${senderName} started following your business.`,
      {
        followerId: followerId,
        action: 'view_profile',
      },
      `/customer/vendor/${followerId}`
    );
  } catch (err) {
    console.error('Error creating follow notification:', err.message);
  }

  // Real-time socket updates
  try {
    const sockets = require('../sockets');
    // Notify customer on other sessions
    sockets.emitToUser(followerId, 'following_update', { vendorId: followingId, following: true });
    // Broadcast vendor count update globally so any connected client looking at vendor statistics updates
    if (sockets.broadcast) {
      sockets.broadcast('vendor_stats_update', { vendorId: followingId, followersCount: count });
    }
    if (sockets.emitToRoom) {
      sockets.emitToRoom(`vendor:${followingId}`, 'vendor_stats_update', { vendorId: followingId, followersCount: count });
    }
  } catch (err) {
    console.error('Error broadcasting follow sockets:', err.message);
  }

  return { following: true, followers_count: count };
};

const unfollow = async (followerId, followingId) => {
  await Follow.deleteOne({ follower_id: followerId, following_id: followingId });

  // Update customer (follower) following array & followingCount
  const followingCount = await Follow.countDocuments({ follower_id: followerId });
  await User.updateOne(
    { _id: followerId },
    {
      $pull: { following: new mongoose.Types.ObjectId(followingId) },
      $set: { followingCount: Math.max(0, followingCount) }
    }
  );

  // Update vendor (followingId) followers array & followersCount
  const count = await Follow.countDocuments({ following_id: followingId });
  await User.updateOne(
    { _id: followingId },
    {
      $pull: { followers: new mongoose.Types.ObjectId(followerId) },
      $set: { followersCount: Math.max(0, count) }
    }
  );

  // Real-time socket updates
  try {
    const sockets = require('../sockets');
    sockets.emitToUser(followerId, 'following_update', { vendorId: followingId, following: false });
    if (sockets.broadcast) {
      sockets.broadcast('vendor_stats_update', { vendorId: followingId, followersCount: count });
    }
    if (sockets.emitToRoom) {
      sockets.emitToRoom(`vendor:${followingId}`, 'vendor_stats_update', { vendorId: followingId, followersCount: count });
    }
  } catch (err) {
    console.error('Error broadcasting unfollow sockets:', err.message);
  }

  return { following: false, followers_count: count };
};

const isFollowing = async (followerId, followingId) => {
  const doc = await Follow.findOne({ follower_id: followerId, following_id: followingId });
  return !!doc;
};

const followingIds = async (followerId) => {
  const docs = await Follow.find({ follower_id: followerId }).select('following_id');
  return docs.map(f => f.following_id);
};

const followersCount = async (userId) => {
  return await Follow.countDocuments({ following_id: userId });
};

const myFollowing = async (followerId, queryOptions = {}) => {
  const { search, role, page = 1, limit = 10, sortBy } = queryOptions;

  const follows = await Follow.find({ follower_id: followerId });
  const ids = follows.map(f => f.following_id);
  if (ids.length === 0) {
    return { items: [], total: 0 };
  }

  const baseQuery = {
    _id: { $in: ids },
    is_deleted: { $ne: true }
  };

  if (role) {
    baseQuery.roles = role;
  }

  if (queryOptions.businessType) {
    baseQuery['vendorProfile.businessType'] = queryOptions.businessType;
  } else if (queryOptions.excludeBusinessType) {
    baseQuery['vendorProfile.businessType'] = { $ne: queryOptions.excludeBusinessType };
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    baseQuery.$or = [
      { name: searchRegex },
      { 'vendorProfile.shopName': searchRegex },
      { 'vendorProfile.businessName': searchRegex },
      { 'creatorProfile.name': searchRegex }
    ];
  }

  let sort = { name: 1 };
  if (sortBy) {
    if (sortBy === 'latest') sort = { created_at: -1 };
    else if (sortBy === 'oldest') sort = { created_at: 1 };
    else if (sortBy === 'highest_rated') sort = { rating_avg: -1 };
    else if (sortBy === 'most_popular') sort = { followersCount: -1 };
  }

  const total = await User.countDocuments(baseQuery);
  const parsedPage = parseInt(page || 1, 10);
  const parsedLimit = parseInt(limit || 10, 10);
  const skip = (parsedPage - 1) * parsedLimit;

  const users = await User.find(baseQuery)
    .sort(sort)
    .skip(skip)
    .limit(parsedLimit)
    .lean();

  const items = users.map(u => ({
    id: u._id.toString(),
    _id: u._id.toString(),
    name: u.vendorProfile?.shopName || u.vendorProfile?.businessName || u.name || 'Verified Vendor',
    profile_pic: u.profile_pic || u.avatarUrl,
    avatarUrl: u.avatarUrl || u.profile_pic,
    roles: u.roles || [],
    vendorProfile: u.vendorProfile,
    creatorProfile: u.creatorProfile,
    rating_avg: u.rating_avg || 0,
    rating_count: u.rating_count || 0,
    city: u.city,
    followersCount: u.followersCount || 0,
    is_subscribed_verified: u.is_subscribed_verified || false,
    kyc_status: u.kyc_status || 'unverified',
    is_active: u.is_active || false,
  }));

  return { items, total };
};

const myFollowers = async (userId) => {
  const follows = await Follow.find({ following_id: userId }).limit(500);
  const ids = follows.map(f => f.follower_id);
  if (ids.length === 0) {
    return [];
  }
  const users = await User.find({ _id: { $in: ids }, is_deleted: { $ne: true } }).limit(500);
  return users.map(u => ({
    id: u._id.toString(),
    name: u.name,
    profile_pic: u.profile_pic,
    roles: u.roles || [],
  }));
};

module.exports = {
  follow,
  unfollow,
  isFollowing,
  followingIds,
  followersCount,
  myFollowing,
  myFollowers,
};
