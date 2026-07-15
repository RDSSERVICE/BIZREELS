const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  thread_id: { type: String, required: true, index: true },
  listing_id: { type: String, default: null },
  requirement_id: { type: String, default: null },
  buyer_id: { type: String, required: true, index: true },
  seller_id: { type: String, required: true, index: true },
  initial_offer: { type: Number, required: true },
  current_offer: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  offers_history: { type: [mongoose.Schema.Types.Mixed], default: [] },
  status: {
    type: String,
    enum: ['negotiating', 'accepted', 'rejected', 'expired', 'completed', 'cancelled'],
    default: 'negotiating',
    index: true,
  },
  expires_at: { type: String, default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
  completion_pending_from: { type: String, default: null },
  followup_sent: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Deal', dealSchema);
