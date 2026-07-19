const chatRepository = require('../repositories/chatRepository');
const Notification = require('../models/Notification');
const { emitToUser, emitToConversation } = require('../sockets');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * ChatService
 * Orchestrates conversation groups, real-time message routing, and unread badges.
 */
class ChatService {
  async getConversations(userId) {
    return chatRepository.getConversationsForUser(userId);
  }

  async getMessages(conversationId, userId, { page = 1, limit = 30 }) {
    const conversation = await chatRepository.findConversationById(conversationId);
    if (!conversation) {
      throw ApiError.notFound('Conversation thread not found.');
    }

    // Verify participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId.toString()
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation.');
    }

    // Retrieve messages and clear unreads for this user
    const result = await chatRepository.getMessages(conversationId, { page, limit });
    await chatRepository.markMessagesAsSeen(conversationId, userId);

    // Notify other participant(s) that messages are read in real-time
    const recipient = conversation.participants.find(p => p._id.toString() !== userId.toString());
    if (recipient) {
      emitToConversation(conversationId, 'messages_seen', {
        conversationId,
        seenBy: userId,
      });
    }

    return result;
  }

  async sendMessage({ senderId, recipientId, text, media }, req) {
    if (!text && !media) {
      throw ApiError.badRequest('Cannot send an empty message.');
    }

    // Initialize or retrieve conversation
    const conversation = await chatRepository.findOrCreateConversation(senderId, recipientId);
    
    // Add message
    const message = await chatRepository.addMessage(conversation._id, senderId, text, media);

    // Update conversation record update timestamp
    conversation.updatedAt = new Date();
    await conversation.save();

    // Broadcast messages in real-time via sockets
    emitToConversation(conversation._id.toString(), 'message', message);
    
    // Also emit target alert to recipient in case they aren't listening on conversation channel
    emitToUser(recipientId.toString(), 'message_alert', {
      conversationId: conversation._id,
      message,
    });

    // Create Push-like notification if needed
    try {
      const sender = await UserQuery(senderId);
      const notifyRecord = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'message',
        title: `Message from ${sender.name}`,
        message: text || 'Sent an attachment.',
        data: { conversationId: conversation._id },
      });
      emitToUser(recipientId.toString(), 'notification', notifyRecord);
    } catch (err) {
      // safe bypass
    }

    return message;
  }

  async listMyThreads(userId) {
    return this.getConversations(userId);
  }

  async getThreadMessages(threadId, userId, options = {}) {
    return this.getMessages(threadId, userId, options);
  }

  async markRead(threadId, userId) {
    await chatRepository.markMessagesAsSeen(threadId, userId);
    return { ok: true };
  }

  async unreadTotal(userId) {
    return 0;
  }
}

// Inline helper to resolve model queries dynamically
async function UserQuery(id) {
  const User = require('../models/User');
  return User.findById(id).select('name avatarUrl').lean();
}

module.exports = new ChatService();
