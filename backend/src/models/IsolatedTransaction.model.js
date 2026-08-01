const mongoose = require('mongoose');

/**
 * Isolated Transaction Ledger Model
 * Every transaction is tagged with userId + role + walletId for full audit trail.
 * Always filter by (userId, role) to ensure Vendor and Creator ledgers never mix.
 */
const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, enum: ['vendor', 'creator'], required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'IsolatedWallet', required: true },
  type: {
    type: String,
    enum: ['credit', 'debit', 'refund', 'subscription_purchase', 'recharge', 'payout', 'referral_bonus', 'commission'],
    required: true,
  },
  amount: { type: Number, required: true, min: 0 },
  previous_balance: { type: Number, default: 0 },
  updated_balance: { type: Number, default: 0 },
  paymentId: { type: String, default: null },
  gateway: { type: String, default: 'razorpay' },
  description: { type: String, default: null },
  reference_id: { type: String, default: null },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Compound index for role-isolated queries sorted by time
transactionSchema.index({ userId: 1, role: 1, created_at: -1 });
// Idempotency guard
transactionSchema.index({ reference_id: 1 }, { sparse: true });

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = registerOrReuse('IsolatedTransaction', transactionSchema, 'transactions_isolated');
