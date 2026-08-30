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
    const { creatorId, hashtags, search, q, category, subcategory, lat, lng, distance, page = 1, limit = 10 } = req.query;
    
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

  // ── Get Saved Reels for Current User ──────────────────────
  getSavedReels = asyncHandler(async (req, res) => {
    const Interaction = require('../models/Interaction');
    const Reel = require('../models/Reel');

    const interactions = await Interaction.find({
      user_id: req.user._id.toString(),
      type: 'save_reel',
    }).select('reel_id');

    const reelIds = interactions.map((i) => i.reel_id).filter(Boolean);

    const reels = await Reel.find({
      _id: { $in: reelIds },
      is_deleted: { $ne: true },
      isDeleted: { $ne: true },
    })
      .populate('user_id creator vendor', 'name businessName phone phone_number avatarUrl city')
      .sort({ createdAt: -1 });

    return ApiResponse.ok(res, 'Saved reels retrieved successfully.', { reels });
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

    return ApiResponse.ok(res, 'Single reel fetched successfully.', { reel });
  });
}

module.exports = new ReelController();
