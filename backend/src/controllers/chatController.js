const chatService = require('../services/chatService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * ChatController
 * Manages request endpoints for conversations, messaging history, and direct messages.
 */
class ChatController {
  // ── Get User Conversations ──────────────────────────────
  getConversations = asyncHandler(async (req, res) => {
    const list = await chatService.getConversations(req.user._id);
    return ApiResponse.ok(res, 'Conversations list retrieved.', { conversations: list });
  });

  // ── Get Messages History ────────────────────────────────
  getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const result = await chatService.getMessages(conversationId, req.user._id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return ApiResponse.paginated(res, 'Chat history loaded.', result.messages, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    });
  });

  // ── Send Message ────────────────────────────────────────
  sendMessage = asyncHandler(async (req, res) => {
    const { recipientId, text, media } = req.body;

    const message = await chatService.sendMessage({
      senderId: req.user._id,
      recipientId,
      text,
      media,
    }, req);

    return ApiResponse.created(res, 'Message delivered.', { message });
  });
}

module.exports = new ChatController();
