const chatRepository = require('../repositories/chatRepository');
const Notification = require('../models/Notification');
const User = require('../models/User');
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

    const isParticipant = conversation.participants.some(
      (p) => (p._id || p).toString() === userId.toString()
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation.');
    }

    const result = await chatRepository.getMessages(conversationId, { page, limit });
    await chatRepository.markMessagesAsSeen(conversationId, userId);

    const recipient = conversation.participants.find(p => (p._id || p).toString() !== userId.toString());
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

    const conversation = await chatRepository.findOrCreateConversation(senderId, recipientId);
    
    const message = await chatRepository.addMessage(conversation._id, senderId, text, media);

    conversation.updatedAt = new Date();
    await conversation.save();

    emitToConversation(conversation._id.toString(), 'message', message);
    
    emitToUser(recipientId.toString(), 'message_alert', {
      conversationId: conversation._id,
      message,
    });

    try {
      const sender = await User.findById(senderId).select('name avatarUrl').lean();
      const recipientUser = await User.findById(recipientId).select('roles').lean();
      let actionUrl = '/customer/chat';
      if (recipientUser && recipientUser.roles && recipientUser.roles.includes('vendor')) {
        actionUrl = '/vendor/chat';
      }

      const notifyRecord = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'message',
        title: `Message from ${sender?.name || 'User'}`,
        message: text || 'Sent an attachment.',
        data: { conversationId: conversation._id },
        actionUrl,
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

module.exports = new ChatService();
