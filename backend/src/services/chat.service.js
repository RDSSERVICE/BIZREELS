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
  async findOrCreateConversation(participantA, participantB) {
    return chatRepository.findOrCreateConversation(participantA, participantB);
  }

  async getConversations(userId) {
    return chatRepository.getConversationsForUser(userId);
  }

  async getMessages(conversationId, userId, { page = 1, limit = 30 }) {
    const uid = userId.toString();
    const conversation = await chatRepository.findConversationById(conversationId);
    if (!conversation) {
      throw ApiError.notFound('Conversation thread not found.');
    }

    const isParticipant = (conversation.participants || []).some(
      (p) => (p._id || p).toString() === uid
    );
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this conversation.');
    }

    const result = await chatRepository.getMessages(conversationId, uid, { page, limit });

    // Mark seen in background only if reader actually has unread messages
    const rawUnread = conversation.unreadCount instanceof Map
      ? conversation.unreadCount.get(uid)
      : conversation.unreadCount?.[uid];
    const unread = Number(rawUnread || 0);

    if (unread > 0) {
      chatRepository.markMessagesAsSeen(conversationId, uid).catch(() => {});
      const recipient = (conversation.participants || []).find(p => (p._id || p).toString() !== uid);
      if (recipient) {
        emitToConversation(conversationId, 'messages_seen', {
          conversationId,
          seenBy: uid,
        });
      }
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
      const sender = await User.findById(senderId).select('name activeRole avatarUrl').lean();
      let actionUrl = '/vendor/chat';
      if (sender && sender.activeRole === 'vendor') {
        actionUrl = '/customer/chat';
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

  async clearChat(conversationId, userId) {
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
    await chatRepository.clearChatMessages(conversationId);
    return { ok: true };
  }

  async deleteConversation(conversationId, userId) {
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
    await chatRepository.deleteConversation(conversationId, userId);
    return { ok: true };
  }

  async deleteMessageForMe(messageId, userId) {
    await chatRepository.deleteMessageForMe(messageId, userId);
    return { ok: true };
  }

  async deleteMessageForEveryone(messageId, userId) {
    const Message = require('../models/Message');
    const message = await Message.findById(messageId);
    if (!message) {
      throw ApiError.notFound('Message not found.');
    }
    if (message.sender.toString() !== userId.toString()) {
      throw ApiError.forbidden('You can only delete your own messages for everyone.');
    }
    const updated = await chatRepository.deleteMessageForEveryone(messageId);
    
    emitToConversation(updated.conversation.toString(), 'message_deleted', {
      messageId: updated._id,
      conversationId: updated.conversation,
      text: updated.text,
      isDeleted: true
    });

    return updated;
  }

  async unreadTotal(userId) {
    return 0;
  }
}

module.exports = new ChatService();
