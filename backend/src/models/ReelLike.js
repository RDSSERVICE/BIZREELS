const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ReelLike Model
 * Unique tracking schema representing a single user liking a specific Reel.
 */
const reelLikeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reelId: {
      type: Schema.Types.ObjectId,
      ref: 'Reel',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Likes are immutable
  }
);

// Enforce single like per user per reel
reelLikeSchema.index({ userId: 1, reelId: 1 }, { unique: true });
reelLikeSchema.index({ reelId: 1, createdAt: -1 });

module.exports = mongoose.model('ReelLike', reelLikeSchema);
