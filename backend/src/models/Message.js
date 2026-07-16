const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Message Model
 * Stores individual chat messages linked to a Conversation.
 */
const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    media: {
      url: String,
      type: {
        type: String,
        enum: ['image', 'video', 'file', 'audio'],
      },
    },
    isSeen: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ conversation: 1, createdAt: 1 });

// Query middleware to exclude soft deleted entries
messageSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Message', messageSchema);
