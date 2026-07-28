const mongoose = require('mongoose');

/**
 * CommissionHistory Model
 * Append-only audit trail tracking every change made to commission or GST rates by admins.
 */
const commissionHistorySchema = new mongoose.Schema({
  config_type: {
    type: String,
    required: true,
    index: true,
  },
  category_id: {
    type: String,
    default: null,
  },
  category_name: {
    type: String,
    default: null,
  },
  old_rate: {
    type: Number,
    required: true,
  },
  new_rate: {
    type: Number,
    required: true,
  },
  admin_id: {
    type: String,
    required: true,
    index: true,
  },
  admin_name: {
    type: String,
    default: null,
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500,
  },
  ip_address: {
    type: String,
    default: null,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

commissionHistorySchema.index({ created_at: -1 });

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = registerOrReuse('CommissionHistory', commissionHistorySchema, 'commission_history_logs');
