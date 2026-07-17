const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Comment Model
 * Stores text comments posted on Reels.
 */
const commentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reelId: {
      type: Schema.Types.ObjectId,
      ref: 'Reel',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content cannot be empty.'],
      maxlength: 1000,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for retrieval order sorting
commentSchema.index({ reelId: 1, isDeleted: 1, createdAt: -1 });

// Query middleware to exclude soft-deleted comments
commentSchema.pre(/^find/, function () {
  if (this.getOptions()?.includeSoftDeleted) return;
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('Comment', commentSchema);
