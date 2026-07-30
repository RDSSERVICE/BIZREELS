const mongoose = require('mongoose');

/**
 * ReelView Model
 * Tracks which reels each user has viewed, with watch duration for engagement scoring.
 * TTL index auto-expires entries after 7 days to keep the collection lean.
 */
const reelViewSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  reel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel', required: true },
  viewed_at: { type: Date, default: Date.now },
  watch_duration_seconds: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
}, {
  timestamps: false,
});

// Compound unique: one view record per user+reel (upsert on repeated views)
reelViewSchema.index({ user_id: 1, reel_id: 1 }, { unique: true });

// TTL: auto-delete views older than 7 days so recently-viewed exclusion stays fresh
reelViewSchema.index({ viewed_at: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// For fast lookup of recent views by user
reelViewSchema.index({ user_id: 1, viewed_at: -1 });

module.exports = mongoose.models.ReelView || mongoose.model('ReelView', reelViewSchema, 'reel_views');
