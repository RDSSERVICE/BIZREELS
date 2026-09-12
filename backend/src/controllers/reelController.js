const reelService = require('../services/reelService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * ReelController
 * Handles client endpoint requests for Reels publishing, feed playback, comments and likes.
 */
class ReelController {
  // ── Publish Reel ────────────────────────────────────────
  publish = asyncHandler(async (req, res) => {
    const {
      caption, tags, lat, lng, address, title,
      postType, category, subcategory, classification, postPurpose,
      targeting, videoUrl, thumbnailUrl, mediaUrls, mediaType, status, scheduledDate
    } = req.body;

    const files = req.files || (req.file ? [req.file] : []);
    const videoFile = files.find(f => f.fieldname === 'video' || f.fieldname === 'file' || f.mimetype.startsWith('video/'));
    const thumbnailFile = files.find(f => f.fieldname === 'thumbnail' || f.fieldname === 'cover');
    const mediaFiles = files.filter(f => f.fieldname === 'media' || f.fieldname === 'images');

    const fileBuffer = videoFile?.buffer || req.file?.buffer;
    const thumbnailBuffer = thumbnailFile?.buffer;
    const extraMediaBuffers = mediaFiles.map(f => ({ buffer: f.buffer, mimetype: f.mimetype }));

    const reel = await reelService.publishReel({
      userId: req.user._id,
      fileBuffer,
      thumbnailBuffer,
      extraMediaBuffers,
      caption: caption || title,
      tags,
      lat,
      lng,
      address,
      postType,
      category,
      subcategory,
      classification,
      postPurpose,
      targeting,
      videoUrl,
      thumbnailUrl,
      mediaUrls,
      mediaType,
      status,
      scheduledDate,
    }, req);

    return ApiResponse.created(res, 'Reel published successfully.', { reel });
  });

  // ── Get My Reels (Vendor/Creator) ──────────────────────
  getMyReels = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 50, 10)));
    const { reels, total } = await reelService.getVendorReels(req.user._id, page, limit);
    return ApiResponse.paginated(res, 'My reels fetched successfully.', reels, {
      page,
      limit,
      total,
    });
  });

  // ── Get Feed ────────────────────────────────────────────
  getFeed = asyncHandler(async (req, res) => {
    const { creatorId, hashtags, search, q, category, subcategory, lat, lng, distance, page = 1, limit = 10, seed } = req.query;
    
    // Parse comma-separated hashtags if present
    const hashtagsList = hashtags ? hashtags.split(',').map(h => h.trim()) : undefined;
    const query = (q || search || '').trim();

    const viewerId = req.user?._id?.toString() || req.ip || req.headers['x-forwarded-for'] || 'anonymous';

    const result = await reelService.getFeed({
      currentUserId: req.user?._id,
      viewerId,
      creatorId,
      hashtags: hashtagsList,
      query,
      category,
      subcategory,
      lat,
      lng,
      distance: distance ? parseFloat(distance) : undefined,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      seed: seed ? parseInt(seed, 10) : undefined,
    });

    return ApiResponse.paginated(res, 'Feed fetched successfully.', result.reels, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
      seed: result.seed,
    });
  });

  // ── Increment View + Track ──────────────────────────────
  viewReel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { watchDuration } = req.body;
    const viewerId = req.user?._id?.toString() || req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    const reel = await reelService.viewReel(id, viewerId, watchDuration);
    return ApiResponse.ok(res, 'View registered.', { reel });
  });

  // ── Toggle Like ─────────────────────────────────────────
  toggleLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await reelService.toggleLike(id, req.user._id, req);
    return ApiResponse.ok(res, `Reel ${result.message.toLowerCase()} successfully.`, {
      hasLiked: result.hasLiked,
    });
  });

  // ── Add Comment ─────────────────────────────────────────
  addComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const content = (req.body?.content || req.body?.text || req.body?.comment || '').trim();

    const comment = await reelService.addComment(id, req.user._id, content, req);
    return ApiResponse.created(res, 'Comment posted.', { comment });
  });

  // ── Get Comments ────────────────────────────────────────
  getComments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await reelService.getComments(id, parseInt(page, 10), parseInt(limit, 10));
    return ApiResponse.paginated(res, 'Comments fetched.', result.comments, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    });
  });

  // ── Delete Comment ──────────────────────────────────────
  deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const result = await reelService.deleteComment(commentId, req.user._id, req);
    return ApiResponse.ok(res, result.message);
  });

  // ── Delete Reel ─────────────────────────────────────────
  deleteReel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await reelService.deleteReel(id, req.user._id, req);
    return ApiResponse.ok(res, result.message);
  });

  // ── Get Reel Product/Service Details ────────────────────
  getReelProductDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await reelService.getReelProductDetails(id);
    return ApiResponse.ok(res, 'Reel product and service details fetched successfully.', data);
  });

  // ── Save Reel ───────────────────────────────────────────
  saveReel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userModel = require('../models/User');
    const Interaction = require('../models/Interaction');
    const Reel = require('../models/Reel');
    const cache = require('../utils/cache');

    const reel = await Reel.findById(id);
    if (!reel) {
      return ApiResponse.error(res, 'Reel not found', 404);
    }

    const uidStr = req.user._id.toString();

    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { 'customerProfile.savedReels': id } },
      { returnDocument: 'after' }
    ).select('-password -__v');

    const existing = await Interaction.findOne({
      $or: [{ user_id: uidStr }, { user_id: req.user._id }],
      reel_id: id,
      type: 'save_reel',
    });
    if (!existing) {
      await Interaction.create({
        user_id: uidStr,
        reel_id: id,
        type: 'save_reel',
      });
      await Reel.updateOne({ _id: id }, { $inc: { savesCount: 1 } });
    }

    // Invalidate activity counts cache for current user
    cache.deleteCache(`user:activity-counts:${uidStr}`).catch(() => {});

    return ApiResponse.ok(res, 'Reel saved successfully.', { user, active: true });
  });

  // ── Unsave Reel ─────────────────────────────────────────
  unsaveReel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userModel = require('../models/User');
    const Interaction = require('../models/Interaction');
    const Reel = require('../models/Reel');
    const cache = require('../utils/cache');

    const uidStr = req.user._id.toString();

    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { $pull: { 'customerProfile.savedReels': id } },
      { returnDocument: 'after' }
    ).select('-password -__v');

    await Interaction.deleteMany({
      $or: [{ user_id: uidStr }, { user_id: req.user._id }],
      reel_id: id,
      type: 'save_reel',
    });
    await Reel.updateOne({ _id: id }, { $inc: { savesCount: -1 } });

    // Invalidate activity counts cache for current user
    cache.deleteCache(`user:activity-counts:${uidStr}`).catch(() => {});

    return ApiResponse.ok(res, 'Reel removed from saved.', { user, active: false });
  });

  // ── Boost Reel ───────────────────────────────────────────
  boostReel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const durationDays =
      body.durationDays ??
      body.duration_days ??
      body.days ??
      body.duration ??
      body.boostDurationDays ??
      (body.plan ? (String(body.plan).includes('30') ? 30 : String(body.plan).includes('3') ? 3 : 7) : 7);

    const boostService = require('../services/boost.service');

    const result = await boostService.boostReelWithCredits(req.user._id, id, durationDays);
    return ApiResponse.ok(res, 'Reel boosted successfully.', result);
  });

  // ── Get Saved Reels for Current User ──────────────────────
  getSavedReels = asyncHandler(async (req, res) => {
    const Interaction = require('../models/Interaction');
    const Reel = require('../models/Reel');
    const Listing = require('../models/Listing');
    const User = require('../models/User');
    const mongoose = require('mongoose');

    const uidStr = req.user._id.toString();
    const uidObj = req.user._id;

    const userDoc = await User.findById(uidObj)
      .select('customerProfile.savedReels customerProfile.savedListings')
      .lean();

    const profileSavedReels = (userDoc?.customerProfile?.savedReels || []).map((id) => id?.toString()).filter(Boolean);
    const profileSavedListings = (userDoc?.customerProfile?.savedListings || []).map((id) => id?.toString()).filter(Boolean);

    const interactions = await Interaction.find({
      $or: [
        { user_id: uidStr },
        { user_id: uidObj },
      ],
      type: { $in: ['save_reel', 'save', 'save_image'] }
    }).select('reel_id listing_id').lean();

    const interactionIds = interactions
      .flatMap((i) => [i.reel_id?.toString(), i.listing_id?.toString()])
      .filter(Boolean);

    const allCandidateIds = Array.from(new Set([
      ...profileSavedReels,
      ...profileSavedListings,
      ...interactionIds
    ]));

    const candidateObjectIds = allCandidateIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (candidateObjectIds.length === 0) {
      return ApiResponse.ok(res, 'Saved reels retrieved successfully.', { reels: [] });
    }

    const [reelDocs, listingReelDocs] = await Promise.all([
      Reel.find({
        _id: { $in: candidateObjectIds },
        is_deleted: { $ne: true },
        isDeleted: { $ne: true },
      })
        .populate('user_id creator vendor', 'name businessName phone phone_number avatarUrl city category')
        .sort({ createdAt: -1 })
        .lean(),
      Listing.find({
        _id: { $in: candidateObjectIds },
        is_deleted: { $ne: true },
        isDeleted: { $ne: true },
        $or: [
          { type: 'reel' },
          { postType: 'reel' },
          { videoUrl: { $exists: true, $ne: '' } },
          { video_url: { $exists: true, $ne: '' } }
        ]
      })
        .populate('vendor user', 'name businessName phone phone_number avatarUrl city category')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const formattedListingReels = listingReelDocs.map(l => ({
      ...l,
      _id: l._id,
      id: l._id.toString(),
      caption: l.title || l.caption || l.name,
      videoUrl: l.videoUrl || l.video_url || l.videos?.[0] || l.mediaUrls?.[0],
      thumbnailUrl: l.thumbnailUrl || l.thumbnail || l.images?.[0] || l.imageUrl,
      creator: l.vendor || l.user,
      likesCount: l.likes || l.likes_count || 0,
      savesCount: l.saves || l.saves_count || 0,
      viewsCount: l.views || l.views_count || 0,
    }));

    const reelMap = new Map();
    [...reelDocs, ...formattedListingReels].forEach(r => {
      const rid = (r._id || r.id)?.toString();
      if (rid && !reelMap.has(rid)) {
        reelMap.set(rid, r);
      }
    });

    const allReels = Array.from(reelMap.values());

    const interactionService = require('../services/interaction.service');
    const followService = require('../services/follow.service');
    const reelIds = allReels.map(r => r._id?.toString() || r.id).filter(Boolean);
    const [state, followedIdsList] = await Promise.all([
      interactionService.userInteractionState(uidObj, reelIds).catch(() => ({})),
      followService.followingIds(uidObj).catch(() => []),
    ]);
    const followedSet = new Set((followedIdsList || []).map(id => id?.toString()).filter(Boolean));

    const enrichedReels = allReels.map(r => {
      const rid = r._id?.toString() || r.id;
      const s = state[rid] || { liked: false, saved: true };
      const creatorIdStr = (r.creator?._id || r.creator || r.user_id?._id || r.user_id)?.toString();
      const isFollowingCreator = creatorIdStr ? followedSet.has(creatorIdStr) : false;
      return {
        ...r,
        viewer_state: { liked: Boolean(s.liked), saved: true, following: isFollowingCreator },
        isLiked: Boolean(s.liked),
        is_liked: Boolean(s.liked),
        hasLiked: Boolean(s.liked),
        isSaved: true,
        is_saved: true,
        hasSaved: true,
        isFollowing: isFollowingCreator,
        is_following: isFollowingCreator,
      };
    });

    return ApiResponse.ok(res, 'Saved reels retrieved successfully.', { reels: enrichedReels });
  });

  // ── Get Single Reel by ID ─────────────────────────────────
  getReelById = asyncHandler(async (req, res) => {
    const Reel = require('../models/Reel');
    const { id } = req.params;

    const reel = await Reel.findById(id)
      .populate('user_id creator vendor', 'name businessName phone phone_number avatarUrl city category')
      .lean();

    if (!reel || reel.is_deleted || reel.isDeleted) {
      return ApiResponse.notFound(res, 'Reel video not found or has been removed.');
    }

    if (req.user?._id) {
      try {
        const interactionService = require('../services/interaction.service');
        const followService = require('../services/follow.service');
        const [state, followedIdsList] = await Promise.all([
          interactionService.userInteractionState(req.user._id, [reel._id]),
          followService.followingIds(req.user._id).catch(() => []),
        ]);
        const s = state[reel._id.toString()] || { liked: false, saved: false };
        const creatorId = (reel.creator?._id || reel.creator || reel.user_id?._id || reel.user_id)?.toString();
        const isFollowing = creatorId ? (followedIdsList || []).map(id => id?.toString()).includes(creatorId) : false;

        reel.viewer_state = { ...s, following: isFollowing };
        reel.isLiked = Boolean(s.liked);
        reel.is_liked = Boolean(s.liked);
        reel.hasLiked = Boolean(s.liked);
        reel.isSaved = Boolean(s.saved);
        reel.is_saved = Boolean(s.saved);
        reel.hasSaved = Boolean(s.saved);
        reel.isFollowing = isFollowing;
        reel.is_following = isFollowing;
      } catch (err) {
        console.error('Error enriching single reel interaction state:', err);
      }
    }

    return ApiResponse.ok(res, 'Single reel fetched successfully.', { reel });
  });
}

module.exports = new ReelController();
