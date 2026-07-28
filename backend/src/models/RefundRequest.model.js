const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Refund Request Model
 * Tracks all refund requests with admin approval/rejection workflow.
 */
const refundRequestSchema = new mongoose.Schema({
  refund_id: {
    type: String,
    unique: true,
    default: () => `RFD_${Date.now()}_${uuidv4().slice(0, 6).toUpperCase()}`,
    index: true,
  },
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  user_name: {
    type: String,
    default: null,
  },
  user_role: {
    type: String,
    enum: ['vendor', 'creator', 'customer', 'admin'],
    default: 'customer',
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500,
  },
  description: {
    type: String,
    default: null,
    maxlength: 1000,
  },
  original_transaction_id: {
    type: String,
    default: null,
  },
  original_order_id: {
    type: String,
    default: null,
  },
  refund_type: {
    type: String,
    enum: ['order_refund', 'subscription_refund', 'wallet_refund', 'overcharge', 'service_issue', 'other'],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true,
  },
  admin_remarks: {
    type: String,
    default: null,
    maxlength: 500,
  },
  approved_by: {
    type: String,
    default: null,
  },
  approved_at: {
    type: Date,
    default: null,
  },
  rejected_by: {
    type: String,
    default: null,
  },
  rejected_at: {
    type: Date,
    default: null,
  },
  refund_transaction_id: {
    type: String,
    default: null,
  },
  payment_method: {
    type: String,
    enum: ['wallet', 'original_source', 'bank_transfer', null],
    default: 'wallet',
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

refundRequestSchema.index({ status: 1, created_at: -1 });
refundRequestSchema.index({ user_id: 1, created_at: -1 });
refundRequestSchema.index({ created_at: -1 });

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = registerOrReuse('RefundRequest', refundRequestSchema, 'refund_requests');
