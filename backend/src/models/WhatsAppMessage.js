const mongoose = require('mongoose');

/**
 * WhatsApp Message Model (Meta WhatsApp Business Platform v2)
 * Stores incoming and outgoing messages with provider message ID idempotency.
 */
const whatsAppMessageSchema = new mongoose.Schema({
  lead_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WhatsAppLead',
    default: null,
    index: true,
  },
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  provider_message_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  from_phone: {
    type: String,
    required: true,
    index: true,
  },
  to_phone: {
    type: String,
    default: null,
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    default: 'inbound',
  },
  message_type: {
    type: String,
    default: 'text',
  },
  message_body: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  raw_payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

whatsAppMessageSchema.index({ vendor_id: 1, created_at: -1 });

module.exports = mongoose.models.WhatsAppMessage || mongoose.model('WhatsAppMessage', whatsAppMessageSchema);
