const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Notification Model
 * Manages push and in-app notifications for likes, comments, quotes, leads, hires, and chat messages.
 */
const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      enum: ['like', 'comment', 'message', 'quote', 'lead', 'hire', 'payment', 'wallet', 'admin_message', 'vendor_reply', 'price_drop', 'offer'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed, // Stores specific payload (e.g. { reelId, conversationId, requirementId })
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
