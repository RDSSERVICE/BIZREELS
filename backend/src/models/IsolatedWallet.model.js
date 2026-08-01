const mongoose = require('mongoose');

/**
 * Isolated Wallet Model
 * Each wallet is unique to a (userId, role) pair.
 * A user can have one Vendor Wallet and one Creator Wallet — they never mix.
 */
const walletSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, enum: ['vendor', 'creator'], required: true },
  balance: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'INR' },
  lifetime_earned: { type: Number, default: 0 },
  lifetime_spent: { type: Number, default: 0 },
  is_frozen: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Unique compound index — one wallet per (userId, role)
walletSchema.index({ userId: 1, role: 1 }, { unique: true });

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = registerOrReuse('IsolatedWallet', walletSchema, 'wallets_isolated');
