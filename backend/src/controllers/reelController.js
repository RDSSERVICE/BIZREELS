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
    const { caption, tags, lat, lng, address } = req.body;
    const fileBuffer = req.file?.buffer;

    const reel = await reelService.publishReel({
      userId: req.user._id,
      fileBuffer,
      caption,
      tags,
      lat,
      lng,
      address,
    }, req);

    return ApiResponse.created(res, 'Reel published successfully.', { reel });
  });

  // ── Get Feed ────────────────────────────────────────────
  getFeed = asyncHandler(async (req, res) => {
    const { creatorId, hashtags, lat, lng, distance, page = 1, limit = 10 } = req.query;
    
    // Parse comma-separated hashtags if present
    const hashtagsList = hashtags ? hashtags.split(',').map(h => h.trim()) : undefined;

    const result = await reelService.getFeed({
      currentUserId: req.user?._id, // nullable in case of guest views, but protected by auth generally
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

  // ── Increment View ──────────────────────────────────────
  viewReel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reel = await reelService.viewReel(id);
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
}

module.exports = new ReelController();
