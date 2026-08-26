const mongoose = require('mongoose');

/**
 * UserSubscription Model
 * Tracks active/expired/cancelled subscriptions for each user.
 */
const userSubscriptionSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  user_name: { type: String, default: null },
  user_role: { type: String, enum: ['vendor', 'creator'], default: 'vendor' },
  plan_id: { type: String, required: true },
  plan_name: { type: String, required: true },
  plan_type: { type: String, default: 'basic' },
  billing_cycle: { type: String, enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'], default: 'monthly' },
  start_date: { type: Date, required: true },
  expiry_date: { type: Date, required: true },
  auto_renewal: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'upgraded', 'downgraded', 'suspended'],
    default: 'active',
    index: true,
  },
  // Payment details
  payment_id: { type: String, default: null },
  payment_method: { type: String, default: 'razorpay' },
  coupon_code: { type: String, default: null },
  base_plan_price: { type: Number, default: 0 },
  addons_total: { type: Number, default: 0 },
  selected_addons: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    price_inr: { type: Number, required: true },
    quota_type: { type: String },
    quota_value: { type: Number },
  }],
  original_amount: { type: Number, required: true },
  discount_amount: { type: Number, default: 0 },
  gst_percentage: { type: Number, default: 18 },
  gst_amount: { type: Number, default: 0 },
  paid_amount: { type: Number, required: true },
  // History
  previous_plan_id: { type: String, default: null },
  upgraded_from: { type: String, default: null },
  downgraded_from: { type: String, default: null },
  cancelled_at: { type: Date, default: null },
  cancelled_reason: { type: String, default: null },
  renewed_count: { type: Number, default: 0 },
  invoice_id: { type: String, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

userSubscriptionSchema.index({ user_id: 1, status: 1 });
userSubscriptionSchema.index({ user_id: 1, user_role: 1, status: 1 });
userSubscriptionSchema.index({ expiry_date: 1, status: 1 });
userSubscriptionSchema.index({ plan_id: 1 });
userSubscriptionSchema.index({ created_at: -1 });

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = registerOrReuse('UserSubscription', userSubscriptionSchema, 'user_subscriptions');
