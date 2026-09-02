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
  async getReelsFeed({ currentUserId, creatorId, hashtags, query, category, subcategory, coordinates, distanceKm = 10, page = 1, limit = 10 }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const match = { isDeleted: false, isDraft: false, status: 'published' };

    if (creatorId && mongoose.Types.ObjectId.isValid(creatorId)) {
      match.creator = new mongoose.Types.ObjectId(creatorId);
    }

    if (hashtags && hashtags.length > 0) {
      match.hashtags = { $in: hashtags.map(h => h.toLowerCase()) };
    }

    if (query) {
      const qRegex = new RegExp(query, 'i');
      match.$or = [
        { caption: qRegex },
        { title: qRegex },
        { hashtags: qRegex },
        { category: qRegex },
        { subcategory: qRegex },
      ];
    }

    if (category) {
      match.category = new RegExp(category, 'i');
    }

    if (subcategory) {
      match.subcategory = new RegExp(subcategory, 'i');
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
      pipeline.push({ $sort: { isBoosted: -1, followedCreator: -1, interestMatch: -1, createdAt: -1 } });
    } else if (coordinates && coordinates.length === 2) {
      pipeline.push({ $sort: { isBoosted: -1, distance: 1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { isBoosted: -1, createdAt: -1 } });
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
        distance: 1,
        distanceKm: { $cond: [{ $ifNull: ['$distance', false] }, { $divide: ['$distance', 1000] }, null] },
        creator: {
          _id: '$creatorDetails._id',
          name: '$creatorDetails.name',
          avatarUrl: '$creatorDetails.avatarUrl',
          activeRole: '$creatorDetails.activeRole',
          role: '$creatorDetails.role',
          location: '$creatorDetails.location',
          city: '$creatorDetails.location.city',
          state: '$creatorDetails.location.state',
          address: '$creatorDetails.location.address',
        },
        targetListing: {
          _id: '$targetListingDetails._id',
          title: '$targetListingDetails.title',
          images: '$targetListingDetails.images',
          price: { $ifNull: ['$targetListingDetails.price', { $ifNull: ['$targetListingDetails.sellingPrice', '$targetListingDetails.salePrice'] }] },
          salePrice: '$targetListingDetails.salePrice',
          sellingPrice: '$targetListingDetails.sellingPrice',
          offer_price: '$targetListingDetails.offer_price',
          actualPrice: '$targetListingDetails.actualPrice',
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
    const uId = new mongoose.Types.ObjectId(userId);
    const rId = new mongoose.Types.ObjectId(reelId);

    // Attempt to find existing like
    const existingLike = await ReelLike.findOne({ userId: uId, reelId: rId });

    let message = 'Liked';
    let hasLiked = true;

    if (existingLike) {
      // Unlike
      await ReelLike.deleteOne({ _id: existingLike._id });
      await Reel.findByIdAndUpdate(rId, { $inc: { likesCount: -1 } });
      await Reel.updateOne({ _id: rId, likesCount: { $lt: 0 } }, { $set: { likesCount: 0 } });
      message = 'Unliked';
      hasLiked = false;
    } else {
      // Like
      await ReelLike.create({ userId: uId, reelId: rId });
      await Reel.findByIdAndUpdate(rId, { $inc: { likesCount: 1 } });
    }

    return { success: true, message, hasLiked };
  }

  // ── Comments thread ─────────────────────────────────────
  async addComment(reelId, userId, content) {
    const rId = new mongoose.Types.ObjectId(reelId);
    const uId = new mongoose.Types.ObjectId(userId);

    // Create comment entry
    const created = await Comment.create({ reelId: rId, userId: uId, content });
    // Increment counter on Reel
    await Reel.findByIdAndUpdate(rId, { $inc: { commentsCount: 1 } });

    // Populate user info for immediate response update
    return Comment.findById(created._id).populate('userId', 'name avatarUrl activeRole');
  }

  async getComments(reelId, { page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    const rId = new mongoose.Types.ObjectId(reelId);
    const comments = await Comment.find({ reelId: rId, isDeleted: { $ne: true } })
      .populate('userId', 'name avatarUrl activeRole')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await Comment.countDocuments({ reelId: rId, isDeleted: { $ne: true } });
    return { comments, total };
  }

  async deleteComment(commentId, userId) {
    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) return null;

    comment.isDeleted = true;
    await comment.save();
    await Reel.findByIdAndUpdate(comment.reelId, { $inc: { commentsCount: -1 } });
    await Reel.updateOne({ _id: comment.reelId, commentsCount: { $lt: 0 } }, { $set: { commentsCount: 0 } });
    return comment;
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
