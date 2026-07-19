const mongoose = require('mongoose');

// Review
const reviewSchema = new mongoose.Schema({
  reviewer_id: { type: String, required: true, index: true },
  target_type: { type: String, enum: ['vendor', 'listing', 'service'], required: true },
  target_id: { type: String, required: true },
  listing_id: { type: String, default: null },
  deal_id: { type: String, default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: null },
  images: { type: [mongoose.Schema.Types.Mixed], default: [] },
  videos: { type: [mongoose.Schema.Types.Mixed], default: [] },
  is_verified_purchase: { type: Boolean, default: false },
  helpful_count: { type: Number, default: 0 },
  reply: { type: mongoose.Schema.Types.Mixed, default: null },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

reviewSchema.index({ target_type: 1, target_id: 1, _id: -1 });
reviewSchema.index({ reviewer_id: 1, target_type: 1, target_id: 1 });

// Notification
const notificationSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, default: null },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  action_url: { type: String, default: null },
  is_read: { type: Boolean, default: false },
  read_at: { type: String, default: null },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

notificationSchema.index({ user_id: 1, _id: -1 });
notificationSchema.index({ user_id: 1, is_read: 1 });

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

// Wallet Transaction
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
  doc_type: { type: String, enum: ['aadhaar', 'pan', 'driving_license', 'passport'], required: true },
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

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = {
  Review: registerOrReuse('Review', reviewSchema, 'reviews'),
  Notification: registerOrReuse('Notification', notificationSchema, 'notifications'),
  Wallet: registerOrReuse('Wallet', walletSchema, 'wallets'),
  WalletTransaction: registerOrReuse('WalletTransaction', walletTxnSchema, 'wallet_transactions'),
  Payment: registerOrReuse('Payment', paymentSchema, 'payments'),
  PaymentTransaction: registerOrReuse('Payment', paymentSchema, 'payments'),
  Subscription: registerOrReuse('Subscription', subscriptionSchema, 'subscriptions'),
  KycDocument: registerOrReuse('KycDocument', kycDocSchema, 'kyc_documents'),
};
