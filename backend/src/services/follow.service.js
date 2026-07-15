const Follow = require('../models/Follow');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const follow = async (followerId, followingId) => {
  if (followerId === followingId) {
    throw ApiError.badRequest("You can't follow yourself");
  }
  const target = await User.findOne({ _id: followingId, is_deleted: { $ne: true } });
  if (!target) {
    throw ApiError.notFound('User not found');
  }

  await Follow.updateOne(
    { follower_id: followerId, following_id: followingId },
    {
      $setOnInsert: {
        follower_id: followerId,
        following_id: followingId,
        following_type: 'user',
      },
    },
    { upsert: true }
  );

  const count = await Follow.countDocuments({ following_id: followingId });
  return { following: true, followers_count: count };
};

const unfollow = async (followerId, followingId) => {
  await Follow.deleteOne({ follower_id: followerId, following_id: followingId });
  const count = await Follow.countDocuments({ following_id: followingId });
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

const myFollowing = async (followerId) => {
  const follows = await Follow.find({ follower_id: followerId }).limit(500);
  const ids = follows.map(f => f.following_id);
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
};
