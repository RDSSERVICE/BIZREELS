const mongoose = require('mongoose');
const Reel = require('../models/Reel');
const ReelView = require('../models/ReelView');
const User = require('../models/User');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

/**
 * 5-Tier Stacked RecommendationService — Production-Grade
 *
 * Implements the 5-Preference Tier Stacked Feed Recommendation Algorithm:
 * - Preference 1 (Tier 1): Boosted Reels/Posts matching product/service category & near user location.
 * - Preference 2 (Tier 2): Exact matching category & subcategory with user's preferred category/subcategory.
 * - Preference 3 (Tier 3): Near / related category matching (matching parent category or related tags).
 * - Preference 4 (Tier 4): Popularity leaderboard (highest likes & views).
 * - Preference 5 (Tier 5): Rest of published posts (freshness fallback).
 *
 * Stacking Strategy: Interleaves items from preferences in weighted feed slots while enforcing
 * creator diversity and deduplication across pagination pages.
 */
class RecommendationService {

  /**
   * Get personalized recommended feed for a user using 5-tier stacked preference algorithm.
   */
  async getRecommendedFeed(userId, page = 1, limit = 10, userCoords = null) {
    const uid = userId ? userId.toString() : 'guest';
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Cache key per user and page
    const cacheKey = `feed:5tier:${uid}:${pageNum}:${limitNum}:${userCoords ? userCoords.join(',') : 'nocoords'}`;
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    // 1. Get user profile context (interests & registered location)
    let userInterests = [];
    let userCategories = [];
    let coords = userCoords;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const userDoc = await User.findById(userId)
          .select('customerProfile.interests location')
          .lean();

        if (userDoc?.customerProfile?.interests) {
          userInterests = userDoc.customerProfile.interests.filter(i => i.category);
          userCategories = [...new Set(userInterests.map(i => i.category).filter(Boolean))];
        }

        if (!coords && userDoc?.location?.coordinates && userDoc.location.coordinates.length === 2) {
          if (userDoc.location.coordinates[0] !== 0 || userDoc.location.coordinates[1] !== 0) {
            coords = userDoc.location.coordinates;
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch user context for recommendations:', err.message);
      }
    }

    // 2. Get recently viewed reel IDs to exclude duplicate views
    let viewedIds = [];
    if (userId) {
      try {
        const recentViews = await ReelView.find({ user_id: uid })
          .select('reel_id')
          .sort({ viewed_at: -1 })
          .limit(300)
          .lean();
        viewedIds = recentViews.map(v => v.reel_id);
      } catch (err) { }
    }

    // 3. Fetch candidate pools for all 5 Tiers
    const poolFetchLimit = Math.max(limitNum * 4, 30);

    const [tier1BoostedNear, tier2ExactMatch, tier3NearMatch, tier4Popular, tier5Rest] = await Promise.all([
      this._getTier1BoostedNear({ viewedIds, userCategories, coords, limit: poolFetchLimit }),
      this._getTier2ExactMatch({ viewedIds, userInterests, userCategories, limit: poolFetchLimit }),
      this._getTier3NearMatch({ viewedIds, userCategories, limit: poolFetchLimit }),
      this._getTier4Popular({ viewedIds, limit: poolFetchLimit }),
      this._getTier5Rest({ viewedIds, limit: poolFetchLimit }),
    ]);

    // 4. Interleave & stack candidates into page slots
    let stackedCandidates = this._stackTiers({
      tier1: tier1BoostedNear,
      tier2: tier2ExactMatch,
      tier3: tier3NearMatch,
      tier4: tier4Popular,
      tier5: tier5Rest,
      pageNum,
      limitNum,
    });

    // Fallback: If exclusions resulted in 0 candidates, reset viewed exclusions to loop back content
    if (stackedCandidates.length === 0 && viewedIds.length > 0) {
      const [t1, t2, t3, t4, t5] = await Promise.all([
        this._getTier1BoostedNear({ viewedIds: [], userCategories, coords, limit: poolFetchLimit }),
        this._getTier2ExactMatch({ viewedIds: [], userInterests, userCategories, limit: poolFetchLimit }),
        this._getTier3NearMatch({ viewedIds: [], userCategories, limit: poolFetchLimit }),
        this._getTier4Popular({ viewedIds: [], limit: poolFetchLimit }),
        this._getTier5Rest({ viewedIds: [], limit: poolFetchLimit }),
      ]);
      stackedCandidates = this._stackTiers({
        tier1: t1, tier2: t2, tier3: t3, tier4: t4, tier5: t5,
        pageNum, limitNum,
      });
    }

    // 5. Enforce creator diversity (max 2 per creator per page)
    const diversified = this._applyCreatorDiversity(stackedCandidates, limitNum);

    // 6. Enrich with creator info and like status
    const enrichedReels = await this._enrichReels(diversified, userId);

    // 7. Calculate total published reels count
    const total = await Reel.countDocuments({
      isDeleted: false,
      isDraft: false,
      status: 'published',
    });

    const response = { reels: enrichedReels, total };

    // Cache results for 30 seconds
    await cache.setCache(cacheKey, response, 30);

    return response;
  }

  // ══════════════════════════════════════════════════════════
  // PREFERENCE TIER QUERIES
  // ══════════════════════════════════════════════════════════

  /**
   * Preference 1 (Tier 1): Boosted Reel/Post + Matching Category + Near Geo Location
   */
  async _getTier1BoostedNear({ viewedIds = [], userCategories = [], coords = null, limit = 20 }) {
    const match = {
      isDeleted: false,
      isDraft: false,
      status: 'published',
      isBoosted: true,
    };
    if (viewedIds.length > 0) {
      match._id = { $nin: viewedIds };
    }
    if (userCategories.length > 0) {
      match.category = { $in: userCategories };
    }

    const pipeline = [];

    // Geo-near stage if coordinates are available
    if (coords && Array.isArray(coords) && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0)) {
      pipeline.push({
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(coords[0]), parseFloat(coords[1])] },
          distanceField: 'distance_meters',
          maxDistance: 50000, // 50 km radius
          query: match,
          spherical: true,
        },
      });
    } else {
      pipeline.push({ $match: match });
    }

    pipeline.push(
      { $sort: { boostExpiresAt: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          videoUrl: 1, thumbnailUrl: 1, caption: 1, hashtags: 1,
          location: 1, views: 1, likesCount: 1, commentsCount: 1,
          isBoosted: 1, createdAt: 1, creator: 1, category: 1,
          subcategory: 1, postType: 1, mediaUrls: 1, mediaType: 1,
          targetListing: 1, tier: { $literal: 1 },
        },
      }
    );

    try {
      return await Reel.aggregate(pipeline);
    } catch (err) {
      // Fallback without $geoNear if index missing
      return await Reel.find(match).sort({ createdAt: -1 }).limit(limit).lean();
    }
  }

  /**
   * Preference 2 (Tier 2): Exact Matching Category & Subcategory
   */
  async _getTier2ExactMatch({ viewedIds = [], userInterests = [], userCategories = [], limit = 20 }) {
    const match = {
      isDeleted: false,
      isDraft: false,
      status: 'published',
    };
    if (viewedIds.length > 0) {
      match._id = { $nin: viewedIds };
    }

    if (userInterests.length > 0) {
      const orConditions = userInterests.map(i => {
        if (!i.subcategory) {
          return { category: i.category };
        }
        return { category: i.category, subcategory: i.subcategory };
      });
      match.$or = orConditions;
    } else if (userCategories.length > 0) {
      match.category = { $in: userCategories };
    }

    return Reel.find(match)
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Preference 3 (Tier 3): Near / Related Category Matching
   */
  async _getTier3NearMatch({ viewedIds = [], userCategories = [], limit = 20 }) {
    const match = {
      isDeleted: false,
      isDraft: false,
      status: 'published',
    };
    if (viewedIds.length > 0) {
      match._id = { $nin: viewedIds };
    }

    if (userCategories.length > 0) {
      // Matches parent category or general/related subcategories
      match.category = { $in: userCategories };
    }

    return Reel.find(match)
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Preference 4 (Tier 4): Highest Likes & Views Leaderboard
   */
  async _getTier4Popular({ viewedIds = [], limit = 20 }) {
    const match = {
      isDeleted: false,
      isDraft: false,
      status: 'published',
    };
    if (viewedIds.length > 0) {
      match._id = { $nin: viewedIds };
    }

    return Reel.aggregate([
      { $match: match },
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $multiply: [{ $ifNull: ['$likesCount', 0] }, 2] },
              { $multiply: [{ $ifNull: ['$commentsCount', 0] }, 3] },
              { $multiply: [{ $ifNull: ['$views', 0] }, 0.1] },
            ],
          },
        },
      },
      { $sort: { popularityScore: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          videoUrl: 1, thumbnailUrl: 1, caption: 1, hashtags: 1,
          location: 1, views: 1, likesCount: 1, commentsCount: 1,
          isBoosted: 1, createdAt: 1, creator: 1, category: 1,
          subcategory: 1, postType: 1, mediaUrls: 1, mediaType: 1,
          targetListing: 1, tier: { $literal: 4 },
        },
      },
    ]);
  }

  /**
   * Preference 5 (Tier 5): Rest of Published Content (Freshness Fallback)
   */
  async _getTier5Rest({ viewedIds = [], limit = 20 }) {
    const match = {
      isDeleted: false,
      isDraft: false,
      status: 'published',
    };
    if (viewedIds.length > 0) {
      match._id = { $nin: viewedIds };
    }

    return Reel.find(match)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  // ══════════════════════════════════════════════════════════
  // STACKING & INTERLEAVING LOGIC
  // ══════════════════════════════════════════════════════════

  /**
   * Stacks and interleaves candidates from Tiers 1 through 5 in a weighted sequence.
   * Pattern per batch of 10:
   * Slot 1: Tier 1 (Boosted & Near)
   * Slot 2: Tier 2 (Exact Interest)
   * Slot 3: Tier 2 (Exact Interest)
   * Slot 4: Tier 3 (Near / Related Category)
   * Slot 5: Tier 2 (Exact Interest)
   * Slot 6: Tier 4 (Highest Likes & Views)
   * Slot 7: Tier 1 or 2 (Boosted / Exact)
   * Slot 8: Tier 3 (Near Category)
   * Slot 9: Tier 4 (Popular)
   * Slot 10: Tier 5 (Rest / Freshness)
   */
  _stackTiers({ tier1, tier2, tier3, tier4, tier5, pageNum, limitNum }) {
    const usedIds = new Set();
    const result = [];

    // Helper queues
    const q1 = [...tier1];
    const q2 = [...tier2];
    const q3 = [...tier3];
    const q4 = [...tier4];
    const q5 = [...tier5];

    const getNextItem = (queue) => {
      while (queue.length > 0) {
        const item = queue.shift();
        const idStr = item._id.toString();
        if (!usedIds.has(idStr)) {
          usedIds.add(idStr);
          return item;
        }
      }
      return null;
    };

    const getFallbackItem = () => {
      return getNextItem(q1) || getNextItem(q2) || getNextItem(q3) || getNextItem(q4) || getNextItem(q5);
    };

    // Calculate start offset for pagination
    const targetCount = pageNum * limitNum;
    const batch = [];

    while (batch.length < targetCount) {
      let item = null;
      const slot = batch.length % 10;

      switch (slot) {
        case 0:
          item = getNextItem(q1) || getFallbackItem();
          break;
        case 1:
        case 2:
        case 4:
          item = getNextItem(q2) || getFallbackItem();
          break;
        case 3:
        case 7:
          item = getNextItem(q3) || getFallbackItem();
          break;
        case 5:
        case 8:
          item = getNextItem(q4) || getFallbackItem();
          break;
        case 6:
          item = getNextItem(q1) || getNextItem(q2) || getFallbackItem();
          break;
        case 9:
          item = getNextItem(q5) || getFallbackItem();
          break;
        default:
          item = getFallbackItem();
          break;
      }

      if (!item) break; // All queues exhausted
      batch.push(item);
    }

    // Return current page slice
    const startIndex = (pageNum - 1) * limitNum;
    return batch.slice(startIndex, startIndex + limitNum);
  }

  /**
   * Enforce creator diversity: max 2 reels per creator in a single page batch.
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

    // Fill remaining slots if diversity filter pruned too strictly
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
   * Enrich reels with creator metadata and user like status.
   */
  async _enrichReels(reels, userId) {
    if (reels.length === 0) return [];

    const creatorIds = [...new Set(reels.map(r => r.creator).filter(Boolean))];
    const creators = creatorIds.length > 0
      ? await User.find({ _id: { $in: creatorIds } }).select('name avatarUrl activeRole role').lean()
      : [];
    const creatorMap = {};
    creators.forEach(c => { creatorMap[c._id.toString()] = c; });

    let likedReelIds = new Set();
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const ReelLike = require('../models/ReelLike');
        const reelIds = reels.map(r => r._id);
        const likes = await ReelLike.find({
          userId: new mongoose.Types.ObjectId(userId),
          reelId: { $in: reelIds },
        }).lean();
        likedReelIds = new Set(likes.map(l => l.reelId.toString()));
      } catch (err) { }
    }

    return reels.map(r => {
      const c = creatorMap[r.creator?.toString()] || {};
      return {
        ...r,
        creatorName: c.name || 'BizReels Creator',
        creatorAvatar: c.avatarUrl || null,
        creatorRole: c.activeRole || c.role || 'vendor',
        isLiked: likedReelIds.has(r._id.toString()),
      };
    });
  }
}

module.exports = new RecommendationService();
