const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Notification Model
 * Manages push and in-app notifications for likes, comments, quotes, leads, hires, and chat messages.
 */
const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.Mixed,
      index: true,
    },
    type: {
      type: String,
      default: 'system',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    body: {
      type: String,
      default: '',
      trim: true,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
