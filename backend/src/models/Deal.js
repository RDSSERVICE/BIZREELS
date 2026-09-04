const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  thread_id: { type: String, default: '', index: true },
  listing_id: { type: String, default: null },
  requirement_id: { type: String, default: null },
  buyer_id: { type: String, required: true, index: true },
  seller_id: { type: String, required: true, index: true },
  vendor_id: { type: String, default: null },
  items: { type: [mongoose.Schema.Types.Mixed], default: [] },
  amount_paise: { type: Number, default: 0 },
  item_total: { type: Number, default: 0 },
  coupon_code: { type: String, default: null },
  coupon_discount: { type: Number, default: 0 },
  shipping_charges: { type: Number, default: 0 },
  delivery_address: { type: String, default: null },
  pincode: { type: String, default: null },
  source: { type: String, default: 'chat' },
  initial_offer: { type: Number, default: 0 },
  current_offer: { type: Number, default: 0 },
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
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.models.Deal || mongoose.model('Deal', dealSchema);

