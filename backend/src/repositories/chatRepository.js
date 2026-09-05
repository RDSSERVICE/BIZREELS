const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

/**
 * ChatRepository
 * Manages chat room initialization, message storage, and seen receipt flags.
 */
class ChatRepository {
  /**
   * Finds existing conversations between two participants for a specific role context, or creates one if missing.
   */
  async findOrCreateConversation(participantA, participantB, options = {}) {
    let roleContext = options.roleContext;
    if (!roleContext) {
      if (options.creatorId) roleContext = 'creator';
      else if (options.vendorId) roleContext = 'vendor';
      else if (options.customerId) roleContext = 'customer';
      else roleContext = 'vendor';
    }

    const query = {
      participants: { $all: [participantA, participantB] },
    };

    if (roleContext) {
      query.roleContext = roleContext;
    }

    let conversation = await Conversation.findOne(query);

    if (!conversation && roleContext === 'vendor') {
      // Fallback check for legacy threads without roleContext
      conversation = await Conversation.findOne({
        participants: { $all: [participantA, participantB] },
        roleContext: { $exists: false }
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [participantA, participantB],
        roleContext: roleContext || 'vendor',
        vendorId: options.vendorId || null,
        creatorId: options.creatorId || null,
        customerId: options.customerId || null,
        contextType: options.contextType || null,
        unreadCount: {
          [participantA.toString()]: 0,
          [participantB.toString()]: 0,
        },
      });
    }

    return conversation;
  }

  async findConversationById(id) {
    return Conversation.findById(id).select('participants unreadCount roleContext').lean();
  }

  /**
   * Retrieves active conversations list for a user, filtered strictly by roleContext.
   */
  async getConversationsForUser(userId, roleFilter = null) {
    const query = {
      participants: userId,
      isDeletedBy: { $ne: userId },
    };

    if (roleFilter === 'vendor') {
      query.$or = [
        { roleContext: 'vendor' },
        { vendorId: userId },
        { roleContext: { $exists: false } }
      ];
    } else if (roleFilter === 'creator') {
      query.$or = [
        { roleContext: 'creator' },
        { creatorId: userId }
      ];
    } else if (roleFilter === 'customer') {
      query.$or = [
        { roleContext: 'customer' },
        { customerId: userId }
      ];
    }

    const list = await Conversation.find(query)
      .populate('participants', 'name avatarUrl activeRole roles')
      .populate({
        path: 'lastMessage',
        select: 'text media sender isSeen createdAt deletedFor',
      })
      .sort({ updatedAt: -1 })
      .lean();

    return list.map((c) => {
      if (c.lastMessage && c.lastMessage.deletedFor) {
        const isDeletedForMe = c.lastMessage.deletedFor.some(
          (id) => id.toString() === userId.toString()
        );
        if (isDeletedForMe) {
          return {
            ...c,
            lastMessage: {
              ...c.lastMessage,
              text: 'Chat cleared',
              media: null,
            },
          };
        }
      }
      return c;
    });
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
                $pull: { isDeletedBy: { $in: [senderId, recipientId] } },
              },
              { session }
            );
          } else {
            await Conversation.findByIdAndUpdate(
              conversationId,
              {
                lastMessage: message._id,
                $pull: { isDeletedBy: senderId },
              },
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
  async getMessages(conversationId, userId, { page = 1, limit = 30 }) {
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 30));
    const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * limitNum;

    const [messages, total] = await Promise.all([
      Message.find({
        conversation: conversationId,
        deletedFor: { $ne: userId },
      })
        .setOptions({ includeSoftDeleted: true })
        .select('conversation sender text media isSeen isDeleted createdAt')
        .populate('sender', 'name avatarUrl activeRole')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Message.countDocuments({
        conversation: conversationId,
        deletedFor: { $ne: userId },
      }),
    ]);

    return { messages: messages.reverse(), total };
  }

  /**
   * Mark all unread messages as seen in a conversation for a reader.
   */
  async markMessagesAsSeen(conversationId, userId) {
    const uid = userId.toString();
    const path = `unreadCount.${uid}`;
    await Promise.all([
      Message.updateMany(
        { conversation: conversationId, sender: { $ne: uid }, isSeen: false },
        { $set: { isSeen: true } }
      ),
      Conversation.findByIdAndUpdate(
        conversationId,
        { $set: { [path]: 0 } }
      ),
    ]).catch(() => {});
    return true;
  }

  async clearChatMessages(conversationId) {
    await Message.deleteMany({ conversation: conversationId });
    await Conversation.findByIdAndUpdate(conversationId, {
      $unset: { lastMessage: 1 },
    });
    return true;
  }

  async deleteConversation(conversationId, userId) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Conversation.findByIdAndUpdate(
          conversationId,
          { $addToSet: { isDeletedBy: userId } },
          { session }
        );

        await Message.updateMany(
          { conversation: conversationId },
          { $addToSet: { deletedFor: userId } },
          { session }
        );
      });
      return true;
    } finally {
      await session.endSession();
    }
  }

  async deleteMessageForMe(messageId, userId) {
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: userId }
    });
    return true;
  }

  async deleteMessageForEveryone(messageId) {
    return Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          text: 'This message was deleted',
          media: null,
        }
      },
      { returnDocument: 'after' }
    ).populate('sender', 'name avatarUrl activeRole');
  }
}

module.exports = new ChatRepository();
