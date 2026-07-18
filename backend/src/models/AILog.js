const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * AILog Model
 * Records AI text copywriting request outputs for billing, audits, and performance tracking.
 */
const aiLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['listing_description', 'reel_caption', 'chat_assistant'],
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      required: true,
      trim: true,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
      index: true,
    },
    errorMessage: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable log files
  }
);

// Indexes
aiLogSchema.index({ userId: 1, type: 1 });
aiLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AILog', aiLogSchema);
