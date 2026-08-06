const mongoose = require('mongoose');
const Reel = require('../models/Reel');
const ReelLike = require('../models/ReelLike');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');

let reelsSeededChecked = false;

/**
 * ReelRepository
 * Encapsulates database aggregation pipelines and query operations for the Reels module.
 */
class ReelRepository {
  // ── Create ──────────────────────────────────────────────
  async createReel(reelData) {
    return Reel.create(reelData);
  }

  // ── Find Single ─────────────────────────────────────────
  async findReelById(id) {
    return Reel.findById(id).populate('creator', 'name avatarUrl activeRole');
  }

  // ── Fetch Feed with Likes State (Aggregation Pipeline) ──
  /**
   * Retrieves paginated reels.
   * Dynamically checks if the current user has liked each reel using an lookup stage.
   */
  async getReelsFeed({ currentUserId, creatorId, hashtags, coordinates, distanceKm = 10, page = 1, limit = 10 }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const match = { isDeleted: false, isDraft: false };

    if (creatorId && mongoose.Types.ObjectId.isValid(creatorId)) {
      match.creator = new mongoose.Types.ObjectId(creatorId);
    }

    if (hashtags && hashtags.length > 0) {
      match.hashtags = { $in: hashtags.map(h => h.toLowerCase()) };
    }

    // Auto-seed default reels if database contains 0 reels to ensure home feed is loaded correctly
    if (!reelsSeededChecked && !creatorId && (!hashtags || hashtags.length === 0)) {
      try {
        const totalCount = await Reel.countDocuments(match);
        reelsSeededChecked = true;
        if (totalCount === 0) {
          const User = mongoose.model('User');
          const firstUser = await User.findOne({ roles: 'vendor' }) || await User.findOne({});
          if (firstUser) {
            const seedReels = [
              {
                creator: firstUser._id,
                videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
                thumbnailUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=500',
                caption: 'Premium Organic Herbs straight from our farm! 🌿 #organic #herbs #gardening',
                category: 'Grocery & Daily Essentials',
                subcategory: 'Organic Food',
                likesCount: 15,
                commentsCount: 2,
                views: 0,
                isBoosted: true
              },
              {
                creator: firstUser._id,
                videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-tailor-working-with-cloth-41618-large.mp4',
                thumbnailUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500',
                caption: 'Handcrafted premium clothing tailor-made just for you. 👔 Custom fabrics & fits. #fashion #tailoring #menstyle',
                category: 'Fashion & Apparel',
                subcategory: 'Men\'s Wear',
                likesCount: 38,
                commentsCount: 5,
                views: 0,
                isBoosted: false
              },
              {
                creator: firstUser._id,
                videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-fresh-vegetable-salad-40034-large.mp4',
                thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
                caption: 'Fresh and healthy farm salads prepared daily in our kitchen! 🥗 Try today. #healthyfood #restaurant #salad',
                category: 'Restaurant & Food',
                subcategory: 'Organic Food',
                likesCount: 22,
                commentsCount: 1,
                views: 0,
                isBoosted: true
              },
              {
                creator: firstUser._id,
                videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-mechanic-repairing-a-car-engine-40436-large.mp4',
                thumbnailUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500',
                caption: 'Expert AC repair and auto services at your doorstep. Fast turnaround. 🔧🚗 #automobile #repair #carcare',
                category: 'Services & Repairs',
                subcategory: 'Appliance Repair',
                likesCount: 9,
                commentsCount: 0,
                views: 0,
                isBoosted: false
              }
            ];
            await Reel.create(seedReels);
          }
        }
      } catch (err) {
        console.error('Failed to auto-seed reels:', err.message);
      }
    }

    const pipeline = [];

    // Optional geospatial matching
    if (coordinates && coordinates.length === 2) {
      pipeline.push({
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])] },
          distanceField: 'distance',
          maxDistance: distanceKm * 1000, // convert km to meters
          query: match,
          spherical: true,
        },
      });
    } else {
      pipeline.push({ $match: match });
    }

    // Personalization sorting: followedCreator desc, user interests match
    let followedIds = [];
    let interestCond = 0;
    if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
      try {
        const followService = require('../services/follow.service');
        const ids = await followService.followingIds(currentUserId);
        followedIds = ids.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null).filter(Boolean);
      } catch (err) {
        console.error('Error fetching followed IDs for reels feed:', err);
      }
      try {
        const User = require('../models/User');
        const user = await User.findById(currentUserId).select('customerProfile.interests').lean();
        if (user && user.customerProfile && Array.isArray(user.customerProfile.interests) && user.customerProfile.interests.length > 0) {
          const orConditions = user.customerProfile.interests.map(i => {
            if (!i.subcategory) {
              // Only category selected: match any subcategory under this category
              return { $eq: ['$category', i.category] };
            } else {
              // Both category and subcategory must match
              return {
                $and: [
                  { $eq: ['$category', i.category] },
                  { $eq: ['$subcategory', i.subcategory] }
                ]
              };
            }
          });
          interestCond = {
            $cond: [{ $or: orConditions }, 1, 0]
          };
        }
      } catch (err) {
        console.error('Error fetching user interests for reels feed:', err);
      }
    }

    if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
      pipeline.push({
        $addFields: {
          followedCreator: {
            $cond: [{ $in: ['$creator', followedIds] }, 1, 0]
          },
          interestMatch: interestCond
        }
      });
      pipeline.push({ $sort: { followedCreator: -1, interestMatch: -1, createdAt: -1 } });
    } else if (!coordinates) {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Paginate before expensive lookups
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    // Lookup creator details
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'creator',
        foreignField: '_id',
        as: 'creatorDetails',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$creatorDetails',
        preserveNullAndEmptyArrays: true
      }
    });

    // Lookup targetListing details
    pipeline.push({
      $lookup: {
        from: 'listings',
        localField: 'targetListing',
        foreignField: '_id',
        as: 'targetListingDetails',
      },
    });
    pipeline.push({
      $unwind: {
        path: '$targetListingDetails',
        preserveNullAndEmptyArrays: true
      }
    });

    // Project fields including basic creator profile
    pipeline.push({
      $project: {
        videoUrl: 1,
        thumbnailUrl: 1,
        caption: 1,
        hashtags: 1,
        location: 1,
        views: 1,
        likesCount: 1,
        commentsCount: 1,
        isBoosted: 1,
        createdAt: 1,
        creator: {
          _id: '$creatorDetails._id',
          name: '$creatorDetails.name',
          avatarUrl: '$creatorDetails.avatarUrl',
          activeRole: '$creatorDetails.activeRole',
        },
        targetListing: {
          _id: '$targetListingDetails._id',
          title: '$targetListingDetails.title',
          images: '$targetListingDetails.images',
          price: '$targetListingDetails.price',
        },
      },
    });

    // If request has logged-in user, check if they liked this reel
    if (currentUserId) {
      pipeline.push({
        $lookup: {
          from: 'reellikes', // collection name in mongodb
          let: { reelId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$reelId', '$$reelId'] },
                    { $eq: ['$userId', new mongoose.Types.ObjectId(currentUserId)] },
                  ],
                },
              },
            },
          ],
          as: 'userLike',
        },
      });

      pipeline.push({
        $addFields: {
          hasLiked: { $gt: [{ $size: '$userLike' }, 0] },
        },
      });

      // Cleanup temp array
      pipeline.push({ $project: { userLike: 0 } });
    } else {
      pipeline.push({
        $addFields: {
          hasLiked: false,
        },
      });
    }

    const reels = await Reel.aggregate(pipeline);
    
    let total;
    if (pageNum === 1 && reels.length < limitNum) {
      total = reels.length;
    } else {
      total = await Reel.countDocuments(match);
    }

    return { reels, total };
  }

  // ── Increment Views Count ───────────────────────────────
  async incrementViews(id) {
    return Reel.findByIdAndUpdate(id, { $inc: { views: 1 } }, { returnDocument: 'after' });
  }

  // ── Like / Toggle Like ──────────────────────────────────
  async likeReel(reelId, userId) {
    const session = await mongoose.startSession();
    try {
      let message = 'Liked';
      let hasLiked = true;

      await session.withTransaction(async () => {
        // Attempt to create like
        const existingLike = await ReelLike.findOne({ userId, reelId }).session(session);

        if (existingLike) {
          // Unlike
          await ReelLike.deleteOne({ _id: existingLike._id }).session(session);
          await Reel.findByIdAndUpdate(reelId, { $inc: { likesCount: -1 } }).session(session);
          message = 'Unliked';
          hasLiked = false;
        } else {
          // Like
          await ReelLike.create([{ userId, reelId }], { session });
          await Reel.findByIdAndUpdate(reelId, { $inc: { likesCount: 1 } }).session(session);
        }
      });

      return { success: true, message, hasLiked };
    } finally {
      await session.endSession();
    }
  }

  // ── Comments thread ─────────────────────────────────────
  async addComment(reelId, userId, content) {
    const session = await mongoose.startSession();
    try {
      let comment;

      await session.withTransaction(async () => {
        // Create comment entry
        const created = await Comment.create([{ reelId, userId, content }], { session });
        comment = created[0];
        // Increment counter
        await Reel.findByIdAndUpdate(reelId, { $inc: { commentsCount: 1 } }).session(session);
      });

      // Populate user info for immediate response update
      return Comment.findById(comment._id).populate('userId', 'name avatarUrl activeRole');
    } finally {
      await session.endSession();
    }
  }

  async getComments(reelId, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const comments = await Comment.find({ reelId })
      .populate('userId', 'name avatarUrl activeRole')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await Comment.countDocuments({ reelId });
    return { comments, total };
  }

  async deleteComment(commentId, userId) {
    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) return null;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        comment.isDeleted = true;
        await comment.save({ session });
        await Reel.findByIdAndUpdate(comment.reelId, { $inc: { commentsCount: -1 } }).session(session);
      });
      return comment;
    } finally {
      await session.endSession();
    }
  }

  // ── Soft Delete ─────────────────────────────────────────
  async softDeleteReel(id, creatorId) {
    return Reel.findOneAndUpdate(
      { _id: id, creator: creatorId },
      { isDeleted: true, deletedAt: new Date() },
      { returnDocument: 'after' }
    );
  }

  // ── Audit Log ───────────────────────────────────────────
  async logReelAction({ userId, action, entityId, description, ip, agent }) {
    try {
      await AuditLog.create({
        userId,
        action,
        entity: 'Reel',
        entityId,
        description,
        ipAddress: ip,
        userAgent: agent,
      });
    } catch (err) {
      // Don't throw to prevent interrupting main request loop
    }
  }
}

module.exports = new ReelRepository();
