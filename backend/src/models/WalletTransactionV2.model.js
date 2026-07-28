const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced Wallet Transaction Model
 * Production-grade transaction ledger with full audit trail.
 */
const walletTransactionSchemaV2 = new mongoose.Schema({
  transaction_id: {
    type: String,
    unique: true,
    default: () => `TXN_${Date.now()}_${uuidv4().slice(0, 8).toUpperCase()}`,
    index: true,
  },
  reference_id: {
    type: String,
    default: null,
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
    index: true,
  },
  transaction_type: {
    type: String,
    enum: [
      'manual_credit',
      'manual_debit',
      'recharge',
      'refund',
      'refund_reversal',
      'subscription_purchase',
      'subscription_renewal',
      'commission_payout',
      'order_payment',
      'order_refund',
      'campaign_payment',
      'lead_purchase',
      'boost_purchase',
      'referral_bonus',
      'promotional_credit',
      'penalty_debit',
      'withdrawal',
      'deposit',
      'adjustment',
    ],
    required: true,
    index: true,
  },
  credit_debit: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  previous_balance: {
    type: Number,
    required: true,
    default: 0,
  },
  updated_balance: {
    type: Number,
    required: true,
    default: 0,
  },
  payment_method: {
    type: String,
    enum: ['wallet', 'razorpay', 'upi', 'card', 'netbanking', 'internal', 'manual', null],
    default: 'internal',
  },
  source: {
    type: String,
    default: 'system',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed', 'processing'],
    default: 'completed',
    index: true,
  },
  admin_id: {
    type: String,
    default: null,
  },
  admin_remarks: {
    type: String,
    default: null,
    maxlength: 500,
  },
  category: {
    type: String,
    default: null,
  },
  notes: {
    type: String,
    default: null,
    maxlength: 1000,
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

// Compound indexes for efficient queries
walletTransactionSchemaV2.index({ user_id: 1, created_at: -1 });
walletTransactionSchemaV2.index({ transaction_type: 1, created_at: -1 });
walletTransactionSchemaV2.index({ status: 1, created_at: -1 });
walletTransactionSchemaV2.index({ credit_debit: 1, created_at: -1 });
walletTransactionSchemaV2.index({ created_at: -1 });

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = registerOrReuse('WalletTransactionV2', walletTransactionSchemaV2, 'wallet_transactions_v2');
