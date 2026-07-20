const mongoose = require('mongoose');
const Reel = require('../models/Reel');
const ReelLike = require('../models/ReelLike');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');

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
    const skip = (page - 1) * limit;
    const match = { isDeleted: false, isDraft: false };

    if (creatorId) {
      match.creator = new mongoose.Types.ObjectId(creatorId);
    }

    if (hashtags && hashtags.length > 0) {
      match.hashtags = { $in: hashtags.map(h => h.toLowerCase()) };
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
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Paginate before expensive lookups
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit, 10) });

    // Lookup creator details
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'creator',
        foreignField: '_id',
        as: 'creatorDetails',
      },
    });

    pipeline.push({ $unwind: '$creatorDetails' });

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
      },
    });

    // If request has logged-in user, check if they liked this reel
    if (currentUserId) {
      pipeline.push({
        $lookup: {
          from: 'reeelikes', // collection name in mongodb
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
    const total = await Reel.countDocuments(match);

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
