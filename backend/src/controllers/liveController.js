const liveService = require('../services/liveService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * LiveController
 * Manages streaming rooms initialization, active stream lists, likes, views, and comments.
 */
class LiveController {
  create = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const stream = await liveService.createStream({
      hostId: req.user._id,
      title,
      description,
    });
    return ApiResponse.created(res, 'Live stream started.', { stream });
  });

  getActiveStreams = asyncHandler(async (req, res) => {
    const list = await liveService.getActiveStreams();
    return ApiResponse.ok(res, 'Active live streams list loaded.', { streams: list });
  });

  end = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const stream = await liveService.endStream(id, req.user._id);
    return ApiResponse.ok(res, 'Live stream ended successfully.', { stream });
  });

  join = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const stream = await liveService.joinStream(id);
    return ApiResponse.ok(res, 'Joined live stream.', { stream });
  });

  leave = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const stream = await liveService.leaveStream(id);
    return ApiResponse.ok(res, 'Left live stream.', { stream });
  });

  like = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await liveService.incrementLikes(id);
    return ApiResponse.ok(res, 'Likes updated.');
  });

  comment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const result = await liveService.sendStreamComment(id, req.user, text);
    return ApiResponse.ok(res, 'Comment broadcasted.', result);
  });
}

module.exports = new LiveController();
