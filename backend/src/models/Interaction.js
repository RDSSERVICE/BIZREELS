const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  listing_id: { type: String, default: null, index: true },
  reel_id: { type: String, default: null, index: true },
  target_user_id: { type: String, default: null, index: true },
  type: {
    type: String,
    enum: ['like', 'save', 'save_reel', 'save_image', 'click_to_call', 'whatsapp_contact', 'chat_inquiry'],
    required: true
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

interactionSchema.index({ user_id: 1, listing_id: 1, type: 1 }, { unique: true, sparse: true });
interactionSchema.index({ user_id: 1, reel_id: 1, type: 1 }, { sparse: true });
interactionSchema.index({ user_id: 1, type: 1 });

module.exports = mongoose.models.Interaction || mongoose.model('Interaction', interactionSchema, 'interactions');