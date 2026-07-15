const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  listing_id: { type: String, required: true, index: true },
  type: { type: String, enum: ['like', 'save'], required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

interactionSchema.index({ user_id: 1, listing_id: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Interaction', interactionSchema, 'interactions');
