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
      targeting, videoUrl, mediaUrls, mediaType, status, scheduledDate
    } = req.body;
    const fileBuffer = req.file?.buffer;

    const reel = await reelService.publishReel({
      userId: req.user._id,
      fileBuffer,
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
    const { creatorId, hashtags, lat, lng, distance, page = 1, limit = 10 } = req.query;
    
    // Parse comma-separated hashtags if present
    const hashtagsList = hashtags ? hashtags.split(',').map(h => h.trim()) : undefined;

    const viewerId = req.user?._id?.toString() || req.ip || req.headers['x-forwarded-for'] || 'anonymous';

    const result = await reelService.getFeed({
      currentUserId: req.user?._id,
      viewerId,
      creatorId,
      hashtags: hashtagsList,
      lat,
      lng,
      distance: distance ? parseFloat(distance) : undefined,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return ApiResponse.paginated(res, 'Feed fetched successfully.', result.reels, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
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
    const { content } = req.body;

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

  // ── Save Reel ───────────────────────────────────────────
  saveReel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userModel = require('../models/User');
    const Interaction = require('../models/Interaction');
    const Reel = require('../models/Reel');

    const reel = await Reel.findById(id);
    if (!reel) {
      return ApiResponse.error(res, 'Reel not found', 404);
    }

    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { 'customerProfile.savedListings': id } },
      { returnDocument: 'after' }
    ).select('-password -__v');

    const existing = await Interaction.findOne({ user_id: req.user._id.toString(), reel_id: id, type: 'save_reel' });
    if (!existing) {
      await Interaction.create({
        user_id: req.user._id.toString(),
        reel_id: id,
        type: 'save_reel',
      });
    }

    return ApiResponse.ok(res, 'Reel saved successfully.', { user, active: true });
  });

  // ── Unsave Reel ─────────────────────────────────────────
  unsaveReel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userModel = require('../models/User');
    const Interaction = require('../models/Interaction');

    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { $pull: { 'customerProfile.savedListings': id } },
      { returnDocument: 'after' }
    ).select('-password -__v');

    await Interaction.deleteOne({ user_id: req.user._id.toString(), reel_id: id, type: 'save_reel' });

    return ApiResponse.ok(res, 'Reel unsaved successfully.', { user, active: false });
  });

  // ── Boost Reel ───────────────────────────────────────────
  boostReel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { durationDays } = req.body;
    const boostService = require('../services/boost.service');

    const result = await boostService.boostReelWithCredits(req.user._id, id, durationDays);
    return ApiResponse.ok(res, 'Reel boosted successfully.', result);
  });
}

module.exports = new ReelController();
