const mongoose = require('mongoose');
const Reel = require('../models/Reel');
const ReelView = require('../models/ReelView');
const User = require('../models/User');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

/**
 * RecommendationService — Production-Grade
 * 
 * Replaces the basic createdAt sort with a scoring-based recommendation engine.
 * Features:
 * - Recently-viewed exclusion (7-day window via ReelView TTL)
 * - Engagement-weighted scoring (likes, comments, views, watch time)
 * - Creator diversity enforcement (max 2 per creator per batch)
 * - 20% exploration content from unengaged categories
 * - Interest matching and followed-creator boosting
 * - Trending content boost (high engagement in last 24h)
 * - Caching per user+page (60s TTL)
 */
class RecommendationService {

  /**
   * Get personalized recommended feed for a logged-in user.
   */
  async getRecommendedFeed(userId, page = 1, limit = 10) {
    const uid = userId.toString();
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Try cache first
    const cacheKey = `feed:${uid}:${pageNum}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    // 1. Get recently viewed reel IDs (exclude from results)
    const recentViews = await ReelView.find({ user_id: uid })
      .select('reel_id')
      .sort({ viewed_at: -1 })
      .limit(200)
      .lean();
    const viewedIds = recentViews.map(v => v.reel_id);

    // 2. Get user interests
    let interests = [];
    let interestCategories = [];
    try {
      const user = await User.findById(userId).select('customerProfile.interests').lean();
      if (user?.customerProfile?.interests) {
        interests = user.customerProfile.interests;
        interestCategories = interests.map(i => i.category).filter(Boolean);
      }
    } catch (err) {}

    // 3. Get followed creator IDs
    let followedIds = [];
    try {
      const followService = require('./follow.service');
      const ids = await followService.followingIds(userId);
      followedIds = ids.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null).filter(Boolean);
    } catch (err) {}

    // 4. Calculate pool size — fetch more than needed for diversity filtering
    const poolSize = limitNum * 5;
    const mainPoolSize = Math.ceil(poolSize * 0.8);
    const explorationPoolSize = Math.ceil(poolSize * 0.2);

    // 5. Calculate user top watched categories to boost related content
    const topCategories = await this._getTopEngagedCategories(userId);

    // 6. Build main recommendation pipeline
    let mainReels = await this._getMainReels({
      excludeIds: viewedIds,
      interests,
      topCategories,
      followedIds,
      limit: mainPoolSize,
      skip: (pageNum - 1) * limitNum,
    });

    // 7. Get exploration content (categories user hasn't engaged with)
    let explorationReels = await this._getExplorationReels({
      excludeIds: [...viewedIds, ...mainReels.map(r => r._id)],
      excludeCategories: interestCategories,
      limit: explorationPoolSize,
    });

    let allCandidates = [...mainReels, ...explorationReels];

    // Fallback: if all candidate reels have already been viewed, reset exclusions to loop back content
    if (allCandidates.length === 0 && viewedIds.length > 0) {
      mainReels = await this._getMainReels({
        excludeIds: [],
        interests,
        topCategories,
        followedIds,
        limit: mainPoolSize,
        skip: (pageNum - 1) * limitNum,
      });
      explorationReels = await this._getExplorationReels({
        excludeIds: mainReels.map(r => r._id),
        excludeCategories: interestCategories,
        limit: explorationPoolSize,
      });
      allCandidates = [...mainReels, ...explorationReels];
    }

    // 8. Merge and apply diversity filter
    const diversified = this._applyCreatorDiversity(allCandidates, limitNum);

    // 9. Lookup creator details and like state
    const result = await this._enrichReels(diversified, userId);

    // 10. Get total count for pagination
    const total = await Reel.countDocuments({
      isDeleted: false,
      isDraft: false,
      status: 'published',
    });

    const response = { reels: result, total };

    // Cache for 60 seconds
    await cache.setCache(cacheKey, response, 60);

    return response;
  }

  /**
   * Main recommendations — scored by engagement, interest match, trending, freshness.
   */
  async _getMainReels({ excludeIds, interests, topCategories, followedIds, limit, skip }) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const matchStage = {
      isDeleted: false,
      isDraft: false,
      status: 'published',
    };

    if (excludeIds.length > 0) {
      matchStage._id = { $nin: excludeIds };
    }

    let interestCond = 0;
    if (Array.isArray(interests) && interests.length > 0) {
      const orConditions = interests.map(i => {
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
        $cond: [{ $or: orConditions }, 20, 0]
      };
    }

    let categoryEngagementBoost = 0;
    if (topCategories && topCategories.length > 0) {
      categoryEngagementBoost = {
        $cond: [{ $in: ['$category', topCategories] }, 15, 0]
      };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          // Engagement score: weighted combination of likes, comments, views
          engagementScore: {
            $add: [
              { $multiply: [{ $ifNull: ['$likesCount', 0] }, 2] },
              { $multiply: [{ $ifNull: ['$commentsCount', 0] }, 3] },
              { $multiply: [{ $ifNull: ['$views', 0] }, 0.1] },
            ],
          },
          // Hours since creation
          ageHours: {
            $max: [
              1,
              {
                $divide: [
                  { $subtract: [now, '$createdAt'] },
                  1000 * 60 * 60,
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          // Time-decayed engagement (higher = better engagement relative to age)
          decayedEngagement: {
            $divide: ['$engagementScore', { $sqrt: '$ageHours' }],
          },
          // Interest match bonus
          interestMatch: interestCond,
          // Followed creator boost
          followedCreator: followedIds.length > 0
            ? { $cond: [{ $in: ['$creator', followedIds] }, 15, 0] }
            : { $literal: 0 },
          // Freshness boost
          freshnessBoost: {
            $switch: {
              branches: [
                { case: { $gte: ['$createdAt', oneDayAgo] }, then: 30 },
                { case: { $gte: ['$createdAt', threeDaysAgo] }, then: 15 },
              ],
              default: 0,
            },
          },
          // Boost bonus
          boostBonus: { $cond: [{ $eq: ['$isBoosted', true] }, 1000, 0] },
          // Category history boost
          categoryHistoryBoost: categoryEngagementBoost,
        },
      },
      {
        $addFields: {
          // Final recommendation score
          recommendationScore: {
            $add: [
              '$decayedEngagement',
              '$interestMatch',
              '$followedCreator',
              '$freshnessBoost',
              '$boostBonus',
              '$categoryHistoryBoost',
              // Small random factor for variety (0-5)
              { $multiply: [{ $rand: {} }, 5] },
            ],
          },
        },
      },
      { $sort: { isBoosted: -1, recommendationScore: -1 } },
      { $skip: skip > 0 ? skip : 0 },
      { $limit: limit },
      {
        $project: {
          videoUrl: 1, thumbnailUrl: 1, caption: 1, hashtags: 1,
          location: 1, views: 1, likesCount: 1, commentsCount: 1,
          isBoosted: 1, createdAt: 1, creator: 1, category: 1,
          subcategory: 1, postType: 1, mediaUrls: 1, mediaType: 1,
          targetListing: 1, recommendationScore: 1,
        },
      },
    ];

    return Reel.aggregate(pipeline);
  }

  /**
   * Exploration content — random reels from categories user hasn't engaged with.
   */
  async _getExplorationReels({ excludeIds, excludeCategories, limit }) {
    const matchStage = {
      isDeleted: false,
      isDraft: false,
      status: 'published',
    };

    if (excludeIds.length > 0) {
      matchStage._id = { $nin: excludeIds };
    }
    if (excludeCategories.length > 0) {
      matchStage.category = { $nin: excludeCategories };
    }

    return Reel.aggregate([
      { $match: matchStage },
      { $sample: { size: limit } },
      {
        $project: {
          videoUrl: 1, thumbnailUrl: 1, caption: 1, hashtags: 1,
          location: 1, views: 1, likesCount: 1, commentsCount: 1,
          isBoosted: 1, createdAt: 1, creator: 1, category: 1,
          subcategory: 1, postType: 1, mediaUrls: 1, mediaType: 1,
          targetListing: 1,
        },
      },
    ]);
  }

  /**
   * Enforce creator diversity: max 2 reels per creator in a batch.
   */
  _applyCreatorDiversity(reels, limit) {
    const creatorCount = {};
    const MAX_PER_CREATOR = 2;
    const result = [];

    for (const reel of reels) {
      if (result.length >= limit) break;

      const creatorId = reel.creator?.toString() || 'unknown';
      const count = creatorCount[creatorId] || 0;

      if (count < MAX_PER_CREATOR) {
        result.push(reel);
        creatorCount[creatorId] = count + 1;
      }
    }

    // If we don't have enough, add remaining reels regardless of diversity
    if (result.length < limit) {
      const resultIds = new Set(result.map(r => r._id.toString()));
      for (const reel of reels) {
        if (result.length >= limit) break;
        if (!resultIds.has(reel._id.toString())) {
          result.push(reel);
        }
      }
    }

    return result;
  }

  /**
   * Enrich reels with creator details and user like state.
   */
  async _enrichReels(reels, userId) {
    if (reels.length === 0) return [];

    // Lookup creators
    const creatorIds = [...new Set(reels.map(r => r.creator).filter(Boolean))];
    const creators = creatorIds.length > 0
      ? await User.find({ _id: { $in: creatorIds } }).select('name avatarUrl activeRole').lean()
      : [];
    const creatorMap = {};
    creators.forEach(c => { creatorMap[c._id.toString()] = c; });

    // Lookup like state
    let likedReelIds = new Set();
    if (userId) {
      const ReelLike = require('../models/ReelLike');
      const reelIds = reels.map(r => r._id);
      const likes = await ReelLike.find({
        userId: new mongoose.Types.ObjectId(userId),
        reelId: { $in: reelIds },
      }).select('reelId').lean();
      likedReelIds = new Set(likes.map(l => l.reelId.toString()));
    }

    // Lookup target listings
    const listingIds = reels.map(r => r.targetListing).filter(Boolean);
    let listingMap = {};
    if (listingIds.length > 0) {
      const Listing = require('../models/Listing');
      const listings = await Listing.find({ _id: { $in: listingIds } }).select('title images price').lean();
      listings.forEach(l => { listingMap[l._id.toString()] = l; });
    }

    return reels.map(reel => {
      const creatorId = reel.creator?.toString();
      const c = creatorMap[creatorId];
      const listing = reel.targetListing ? listingMap[reel.targetListing.toString()] : null;

      return {
        _id: reel._id,
        videoUrl: reel.videoUrl,
        thumbnailUrl: reel.thumbnailUrl,
        caption: reel.caption,
        hashtags: reel.hashtags,
        location: reel.location,
        views: reel.views || 0,
        likesCount: reel.likesCount || 0,
        commentsCount: reel.commentsCount || 0,
        isBoosted: reel.isBoosted || false,
        createdAt: reel.createdAt,
        hasLiked: likedReelIds.has(reel._id.toString()),
        creator: c ? {
          _id: c._id,
          name: c.name,
          avatarUrl: c.avatarUrl,
          activeRole: c.activeRole,
        } : { _id: creatorId, name: 'Unknown' },
        targetListing: listing ? {
          _id: listing._id,
          title: listing.title,
          images: listing.images,
          price: listing.price,
        } : null,
      };
    });
  }

  /**
   * Track a reel view for recommendation filtering.
   */
  async trackView(userId, reelId, watchDurationSeconds = 0) {
    if (!userId || !reelId) return;

    const uid = userId.toString();

    try {
      await ReelView.updateOne(
        { user_id: uid, reel_id: reelId },
        {
          $set: {
            viewed_at: new Date(),
            watch_duration_seconds: watchDurationSeconds || 0,
            completed: watchDurationSeconds >= 10, // Consider 10+ seconds as "completed"
          },
        },
        { upsert: true }
      );

      // Invalidate feed cache for this user (they'll get fresh content next request)
      const pageKeys = Array.from({ length: 5 }, (_, i) => `feed:${uid}:${i + 1}`);
      for (const key of pageKeys) {
        await cache.deleteCache(key);
      }
    } catch (err) {
      // Silently handle — view tracking shouldn't break the main flow
      if (err.code !== 11000) { // Ignore duplicate key errors
        logger.warn('ReelView tracking error', { error: err.message, userId: uid, reelId });
      }
    }
  }

  /**
   * Get generic (unauthenticated) feed — trending + recent.
   */
  async getGenericFeed(viewerId, page = 1, limit = 10) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Use viewerId in generic feed cache key so guest refreshes fetch fresh content
    const cacheKey = `feed:generic:${viewerId || 'guest'}:${pageNum}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    // Get viewed exclusions and top categories for guest dynamic filtering
    let viewedIds = [];
    let topCategories = [];
    if (viewerId) {
      try {
        const recentViews = await ReelView.find({ user_id: viewerId.toString() })
          .select('reel_id')
          .sort({ viewed_at: -1 })
          .limit(200)
          .lean();
        viewedIds = recentViews.map(v => v.reel_id);

        topCategories = await this._getTopEngagedCategories(viewerId);
      } catch (err) {}
    }

    const matchStage = {
      isDeleted: false,
      isDraft: false,
      status: 'published',
    };

    if (viewedIds.length > 0) {
      matchStage._id = { $nin: viewedIds };
    }

    let categoryEngagementBoost = 0;
    if (topCategories && topCategories.length > 0) {
      categoryEngagementBoost = {
        $cond: [{ $in: ['$category', topCategories] }, 15, 0]
      };
    }

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    let reels = await Reel.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $ifNull: ['$likesCount', 0] }, 2] },
              { $multiply: [{ $ifNull: ['$commentsCount', 0] }, 3] },
              { $multiply: [{ $ifNull: ['$views', 0] }, 0.1] },
              { $cond: [{ $gte: ['$createdAt', threeDaysAgo] }, 20, 0] },
              { $cond: [{ $eq: ['$isBoosted', true] }, 15, 0] },
              categoryEngagementBoost,
              { $multiply: [{ $rand: {} }, 5] },
            ],
          },
        },
      },
      { $sort: { score: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creatorDetails',
        },
      },
      { $unwind: { path: '$creatorDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          videoUrl: 1, thumbnailUrl: 1, caption: 1, hashtags: 1,
          location: 1, views: 1, likesCount: 1, commentsCount: 1,
          isBoosted: 1, createdAt: 1,
          hasLiked: { $literal: false },
          creator: {
            _id: '$creatorDetails._id',
            name: '$creatorDetails.name',
            avatarUrl: '$creatorDetails.avatarUrl',
            activeRole: '$creatorDetails.activeRole',
          },
        },
      },
    ]);

    // Fallback: If no candidate reels left (all viewed), loop back
    if (reels.length === 0 && viewedIds.length > 0) {
      delete matchStage._id;
      reels = await Reel.aggregate([
        { $match: matchStage },
        {
          $addFields: {
            score: {
              $add: [
                { $multiply: [{ $ifNull: ['$likesCount', 0] }, 2] },
                { $multiply: [{ $ifNull: ['$commentsCount', 0] }, 3] },
                { $multiply: [{ $ifNull: ['$views', 0] }, 0.1] },
                { $cond: [{ $gte: ['$createdAt', threeDaysAgo] }, 20, 0] },
                { $cond: [{ $eq: ['$isBoosted', true] }, 15, 0] },
                categoryEngagementBoost,
                { $multiply: [{ $rand: {} }, 5] },
              ],
            },
          },
        },
        { $sort: { score: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: 'creator',
            foreignField: '_id',
            as: 'creatorDetails',
          },
        },
        { $unwind: { path: '$creatorDetails', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            videoUrl: 1, thumbnailUrl: 1, caption: 1, hashtags: 1,
            location: 1, views: 1, likesCount: 1, commentsCount: 1,
            isBoosted: 1, createdAt: 1,
            hasLiked: { $literal: false },
            creator: {
              _id: '$creatorDetails._id',
              name: '$creatorDetails.name',
              avatarUrl: '$creatorDetails.avatarUrl',
              activeRole: '$creatorDetails.activeRole',
            },
          },
        },
      ]);
    }

    // Apply creator diversity
    const diversified = this._applyCreatorDiversity(reels, limitNum);

    const total = await Reel.countDocuments({ isDeleted: false, isDraft: false, status: 'published' });
    const response = { reels: diversified, total };

    await cache.setCache(cacheKey, response, 30); // 30 sec cache for generic
    return response;
  }

  /**
   * Helper to aggregate user watch history and extract top 3 engaged categories.
   */
  async _getTopEngagedCategories(userId) {
    if (!userId) return [];
    try {
      const ReelView = require('../models/ReelView');
      const mongoose = require('mongoose');
      
      const aggregation = await ReelView.aggregate([
        { $match: { user_id: userId.toString() } },
        {
          $lookup: {
            from: 'reels',
            localField: 'reel_id',
            foreignField: '_id',
            as: 'reelDetails',
          },
        },
        { $unwind: '$reelDetails' },
        {
          $group: {
            _id: '$reelDetails.category',
            totalWatchTime: { $sum: '$watch_duration_seconds' },
            viewCount: { $sum: 1 },
          },
        },
        { $sort: { totalWatchTime: -1, viewCount: -1 } },
        { $limit: 3 },
      ]);
      return aggregation.map((item) => item._id).filter(Boolean);
    } catch (err) {
      logger.error('Failed to calculate top engaged categories:', err);
      return [];
    }
  }
}

module.exports = new RecommendationService();
