const mongoose = require('mongoose');

/**
 * WhatsApp Tracking Context Model (Meta WhatsApp Business Platform v2)
 * Load-bearing short-lived tracking context created when a customer clicks WhatsApp.
 * Enables matching inbound WhatsApp webhook messages to the original listing/post.
 */
const whatsAppTrackingContextSchema = new mongoose.Schema({
  context_token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  customer_phone: {
    type: String,
    default: null,
    index: true,
  },
  listing_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    default: null,
    index: true,
  },
  reel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel',
    default: null,
  },
  vendor_phone: {
    type: String,
    default: null,
  },
  expires_at: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index automatically deletes expired tokens
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

whatsAppTrackingContextSchema.index({ vendor_id: 1, customer_phone: 1, created_at: -1 });

module.exports = mongoose.models.WhatsAppTrackingContext || mongoose.model('WhatsAppTrackingContext', whatsAppTrackingContextSchema);
