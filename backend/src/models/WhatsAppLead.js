const mongoose = require('mongoose');

/**
 * WhatsApp Lead Model (Meta WhatsApp Business Platform v2)
 * Represents a customer lead initiated or converted via WhatsApp.
 */
const whatsAppLeadSchema = new mongoose.Schema({
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
    required: true,
    index: true,
  },
  customer_name: {
    type: String,
    default: 'WhatsApp Buyer',
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
  first_message_id: {
    type: String,
    default: null,
  },
  first_message_time: {
    type: Date,
    default: Date.now,
  },
  last_message_time: {
    type: Date,
    default: Date.now,
  },
  charge_window_expires_at: {
    type: Date,
    default: null,
    index: true,
  },
  is_charged: {
    type: Boolean,
    default: false,
    index: true,
  },
  amount_charged: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['billed', 'unbilled_insufficient_balance', 'duplicate_window', 'pending'],
    default: 'pending',
    index: true,
  },
  message_count: {
    type: Number,
    default: 1,
  },
  tracking_context_token: {
    type: String,
    default: null,
    index: true,
  },
  wallet_transaction_id: {
    type: String,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

whatsAppLeadSchema.index({ vendor_id: 1, customer_phone: 1, listing_id: 1 });
whatsAppLeadSchema.index({ vendor_id: 1, created_at: -1 });

module.exports = mongoose.models.WhatsAppLead || mongoose.model('WhatsAppLead', whatsAppLeadSchema);
