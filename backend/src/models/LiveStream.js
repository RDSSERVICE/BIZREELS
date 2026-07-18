const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * LiveStream Model
 * Tracks active video broadcasts by Vendors or Creators.
 */
const liveStreamSchema = new Schema(
  {
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Live stream title is required.'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['live', 'ended'],
      default: 'live',
      index: true,
    },
    viewersCount: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

liveStreamSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('LiveStream', liveStreamSchema);
