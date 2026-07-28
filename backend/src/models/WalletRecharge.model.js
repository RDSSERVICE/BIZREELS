const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Wallet Recharge Model
 * Tracks all wallet recharge/top-up transactions via payment gateways.
 */
const walletRechargeSchema = new mongoose.Schema({
  recharge_id: {
    type: String,
    unique: true,
    default: () => `RCH_${Date.now()}_${uuidv4().slice(0, 6).toUpperCase()}`,
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
  amount_paise: {
    type: Number,
    required: true,
    min: 100,
  },
  payment_gateway: {
    type: String,
    enum: ['razorpay', 'paytm', 'phonepe', 'stripe', 'manual', 'internal'],
    default: 'razorpay',
  },
  gateway_order_id: {
    type: String,
    default: null,
    index: true,
  },
  gateway_payment_id: {
    type: String,
    default: null,
  },
  gateway_signature: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  invoice_number: {
    type: String,
    default: null,
  },
  transaction_id: {
    type: String,
    default: null,
  },
  failure_reason: {
    type: String,
    default: null,
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

walletRechargeSchema.index({ user_id: 1, created_at: -1 });
walletRechargeSchema.index({ status: 1, created_at: -1 });
walletRechargeSchema.index({ created_at: -1 });

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = registerOrReuse('WalletRecharge', walletRechargeSchema, 'wallet_recharges');
