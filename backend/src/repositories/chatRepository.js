const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

/**
 * ChatRepository
 * Manages chat room initialization, message storage, and seen receipt flags.
 */
class ChatRepository {
  /**
   * Finds existing conversations between two participants, or creates one if missing.
   */
  async findOrCreateConversation(participantA, participantB) {
    let conversation = await Conversation.findOne({
      participants: { $all: [participantA, participantB] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [participantA, participantB],
        unreadCount: {
          [participantA.toString()]: 0,
          [participantB.toString()]: 0,
        },
      });
    }

    return conversation;
  }

  async findConversationById(id) {
    return Conversation.findById(id).populate('participants', 'name avatarUrl activeRole');
  }

  /**
   * Retrieves active conversations list for a user.
   */
  async getConversationsForUser(userId) {
    const list = await Conversation.find({
      participants: userId,
      isDeletedBy: { $ne: userId },
    })
      .populate('participants', 'name avatarUrl activeRole')
      .populate({
        path: 'lastMessage',
        select: 'text media sender isSeen createdAt',
      })
      .sort({ updatedAt: -1 })
      .lean();

    return list;
  }

  /**
   * Inserts message and links it as the last message in conversation.
   */
  async addMessage(conversationId, senderId, text, media) {
    const session = await mongoose.startSession();
    try {
      let message;
      await session.withTransaction(async () => {
        message = await Message.create(
          [
            {
              conversation: conversationId,
              sender: senderId,
              text,
              media,
            },
          ],
          { session }
        );

        message = message[0];

        // Increment unread for recipient(s)
        const conversation = await Conversation.findById(conversationId).session(session);
        if (conversation) {
          const recipientId = conversation.participants.find(
            (p) => p.toString() !== senderId.toString()
          );

          if (recipientId) {
            const path = `unreadCount.${recipientId}`;
            await Conversation.findByIdAndUpdate(
              conversationId,
              {
                lastMessage: message._id,
                $inc: { [path]: 1 },
              },
              { session }
            );
          } else {
            await Conversation.findByIdAndUpdate(
              conversationId,
              { lastMessage: message._id },
              { session }
            );
          }
        }
      });

      return Message.findById(message._id).populate('sender', 'name avatarUrl activeRole');
    } finally {
      await session.endSession();
    }
  }

  /**
   * Fetch chat history messages.
   */
  async getMessages(conversationId, { page = 1, limit = 30 }) {
    const skip = (page - 1) * limit;
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatarUrl activeRole')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await Message.countDocuments({ conversation: conversationId });

    return { messages: messages.reverse(), total };
  }

  /**
   * Mark all unread messages as seen in a conversation for a reader.
   */
  async markMessagesAsSeen(conversationId, userId) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Mark reader's incoming messages as seen
        await Message.updateMany(
          { conversation: conversationId, sender: { $ne: userId }, isSeen: false },
          { $set: { isSeen: true } }
        ).session(session);

        // Reset unread count for reader
        const path = `unreadCount.${userId}`;
        await Conversation.findByIdAndUpdate(
          conversationId,
          { $set: { [path]: 0 } }
        ).session(session);
      });

      return true;
    } finally {
      await session.endSession();
    }
  }
}

module.exports = new ChatRepository();
