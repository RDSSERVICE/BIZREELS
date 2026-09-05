const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Conversation Model
 * Combines multiple users (participants) inside a single messaging thread channel.
 */
const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {}, // Maps userId String -> count integer
    },
    isDeletedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    roleContext: {
      type: String,
      enum: ['vendor', 'creator', 'customer', 'direct'],
      default: 'vendor',
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    contextType: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
conversationSchema.index({ participants: 1, roleContext: 1 });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
