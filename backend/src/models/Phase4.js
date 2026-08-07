const mongoose = require('mongoose');

// ══════════════════════════════════════════════════════════════
// Import canonical models (defined in their own files)
// ══════════════════════════════════════════════════════════════
const Review = require('./Review');
const Notification = require('./Notification');
const WalletTransaction = require('./WalletTransaction');

// ══════════════════════════════════════════════════════════════
// Phase4-only models (not defined elsewhere)
// ══════════════════════════════════════════════════════════════

// Wallet
const walletSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  credits: { type: Number, default: 0 },
  balance_inr_paise: { type: Number, default: 0 },
  lifetime_earned_credits: { type: Number, default: 0 },
  lifetime_spent_credits: { type: Number, default: 0 },
  lifetime_deposited_paise: { type: Number, default: 0 },
  lifetime_spent_paise: { type: Number, default: 0 },
  is_frozen: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Wallet Transaction (Phase4 variant)
const walletTxnSchema = new mongoose.Schema({
  wallet_id: { type: String, required: true },
  user_id: { type: String, required: true },
  type: { type: String, required: true },
  bucket: { type: String, enum: ['credits', 'balance_inr'], required: true },
  amount: { type: Number, required: true },
  balance_after: { type: Number, required: true },
  reason: { type: String, default: null },
  ref_type: { type: String, default: null },
  ref_id: { type: String, default: null },
  razorpay_order_id: { type: String, default: null },
  razorpay_payment_id: { type: String, default: null },
  status: { type: String, default: 'success' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

walletTxnSchema.index({ user_id: 1, _id: -1 });

// Payment
const paymentSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  purpose: { type: String, required: true },
  ref_id: { type: String, default: null },
  amount_paise: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpay_order_id: { type: String, required: true, unique: true },
  razorpay_payment_id: { type: String, default: null },
  razorpay_signature: { type: String, default: null },
  status: { type: String, default: 'created' },
  receipt: { type: String, required: true },
  notes: { type: mongoose.Schema.Types.Mixed, default: {} },
  attempts: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Subscription
const subscriptionSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  plan: { type: String, enum: ['verified_monthly', 'verified_yearly'], required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  started_at: { type: String, required: true },
  expires_at: { type: String, required: true },
  auto_renew: { type: Boolean, default: false },
  payment_id: { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// KYC Document
const kycDocSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  doc_type: { type: String, required: true },
  doc_number: { type: String, required: true },
  doc_url: { type: String, required: true },
  selfie_url: { type: String, default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  rejection_reason: { type: String, default: null },
  reviewed_by: { type: String, default: null },
  reviewed_at: { type: String, default: null },
  submitted_at: { type: String, default: () => new Date().toISOString() },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: false,
});

// Helper to recursively check for base64 data strings safely
const hasBase64 = (obj) => {
  if (!obj) return false;
  try {
    const str = typeof obj === 'object' ? JSON.stringify(obj) : String(obj);
    return /data:[^;]+;base64,/.test(str);
  } catch (err) {
    return false;
  }
};

// Pre-validate hook to block base64 strings in KYC Documents
kycDocSchema.pre('validate', function () {
  if (hasBase64(this.doc_url) || hasBase64(this.selfie_url)) {
    throw new Error('Uploading base64 files directly to MongoDB is not permitted. Please upload files via /api/v1/upload/image first.');
  }
});

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = {
  Review,
  Notification,
  WalletTransaction,
  Wallet: registerOrReuse('Wallet', walletSchema, 'wallets'),
  Payment: registerOrReuse('Payment', paymentSchema, 'payments'),
  PaymentTransaction: registerOrReuse('Payment', paymentSchema, 'payments'),
  Subscription: registerOrReuse('Subscription', subscriptionSchema, 'subscriptions'),
  KycDocument: registerOrReuse('KycDocument', kycDocSchema, 'kyc_documents'),
};
