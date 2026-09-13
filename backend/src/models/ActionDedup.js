const mongoose = require('mongoose');

/**
 * ActionDedup Model
 * Implements the 24-hour duplicate billing prevention window
 * for customer actions (views, WhatsApp, inquiries, etc.).
 * Uses MongoDB TTL index for automatic expiration.
 */
const actionDedupSchema = new mongoose.Schema(
  {
    dedup_key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer_id: {
      type: String,
      required: true,
      index: true,
    },
    vendor_id: {
      type: String,
      required: true,
      index: true,
    },
    target_id: {
      type: String,
      default: 'general',
      index: true,
    },
    action_type: {
      type: String,
      required: true,
      enum: ['view', 'whatsapp', 'chat', 'inquiry', 'order', 'call'],
    },
    credits_charged: {
      type: Number,
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: document deletes when current time >= expires_at
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.ActionDedup ||
  mongoose.model('ActionDedup', actionDedupSchema, 'action_dedups');
