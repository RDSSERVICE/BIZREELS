const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Reel Model
 * Stores video references, metadata, geolocated coordinates, and counter tallies.
 */
const reelSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required.'],
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    caption: {
      type: String,
      maxlength: 2200, // Instagram caption length limit
      trim: true,
    },
    hashtags: [{
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    }],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: String,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isBoosted: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDraft: {
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

// ── Indexes ───────────────────────────────────────────────
reelSchema.index({ 'location.coordinates': '2dsphere' });
reelSchema.index({ creator: 1, createdAt: -1 });
reelSchema.index({ hashtags: 1, createdAt: -1 });
reelSchema.index({ isDeleted: 1, isDraft: 1, createdAt: -1 });

// Query middleware to exclude soft-deleted reels by default
reelSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Reel', reelSchema);
