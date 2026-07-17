const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Analytics Model
 * Stores tracking logs for platform-wide metrics (views, clicks, searches, conversions).
 */
const analyticsSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['reel_view', 'listing_click', 'profile_view', 'search_query', 'conversion'],
      index: true,
    },
    // The user who performed the action (optional for guest traffic)
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Target entity ID (e.g. Reel ID, Listing ID, User Profile ID)
    targetId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    // Raw search query text (if type is 'search_query')
    queryText: {
      type: String,
      trim: true,
      index: true,
    },
    // Additional structured tracking parameters
    metadata: {
      category: String,
      device: String,
      ipAddress: String,
      location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number], // [lng, lat]
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable log files: only createdAt
  }
);

// Indexes
analyticsSchema.index({ type: 1, createdAt: -1 });
analyticsSchema.index({ targetId: 1, type: 1, createdAt: -1 });
analyticsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
