const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower_id: { type: String, required: true },
  following_id: { type: String, required: true, index: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

followSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema, 'follows');
