const mongoose = require('mongoose');

// ══════════════════════════════════════════════════════════════
// Admin Role — manages permission-based admin access
// ══════════════════════════════════════════════════════════════
const adminRoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  permissions: { type: [String], default: [] },
  is_active: { type: Boolean, default: true },
  description: { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// ══════════════════════════════════════════════════════════════
// Admin Login Log — tracks admin sign-in activity
// ══════════════════════════════════════════════════════════════
const adminLoginLogSchema = new mongoose.Schema({
  admin_id: { type: String, required: true, index: true },
  ip: { type: String, default: null },
  user_agent: { type: String, default: null },
  status: { type: String, enum: ['success', 'failed'], required: true },
  failure_reason: { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

adminLoginLogSchema.index({ admin_id: 1, created_at: -1 });

// ══════════════════════════════════════════════════════════════
// Boost Plan — advertisement/reel boost pricing
// ══════════════════════════════════════════════════════════════
const boostPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: null },
  duration_days: { type: Number, required: true },
  price_inr: { type: Number, required: true },
  credits_cost: { type: Number, default: 0 },
  reach_multiplier: { type: Number, default: 1.5 },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// ══════════════════════════════════════════════════════════════
// CMS Page — content management system pages
// ══════════════════════════════════════════════════════════════
const cmsPageSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  is_published: { type: Boolean, default: false },
  last_edited_by: { type: String, default: null },
  meta_description: { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// ══════════════════════════════════════════════════════════════
// Coupon — offers, discounts, referral bonuses
// ══════════════════════════════════════════════════════════════
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage', 'flat', 'cashback', 'referral'], required: true },
  value: { type: Number, required: true },
  max_discount_inr: { type: Number, default: null },
  min_order_inr: { type: Number, default: 0 },
  min_purchase_amount: { type: Number, default: 0 },
  max_discount_amount: { type: Number, default: null },
  usage_limit: { type: Number, default: null },
  used_count: { type: Number, default: 0 },
  applicable_to: { type: String, enum: ['all', 'subscription', 'boost', 'order'], default: 'all' },
  user_type_restriction: { type: String, enum: ['all', 'vendor', 'creator', 'customer', null], default: 'all' },
  plan_restriction: { type: String, default: null },
  valid_from: { type: Date, default: null },
  valid_until: { type: Date, default: null },
  start_date: { type: Date, default: null },
  end_date: { type: Date, default: null },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  created_by: { type: String, default: null },
  description: { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// ══════════════════════════════════════════════════════════════
// Location — hierarchical location data
// ══════════════════════════════════════════════════════════════
const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['country', 'state', 'district', 'city', 'area', 'pincode'], required: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null, index: true },
  is_popular: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

locationSchema.index({ type: 1, parent_id: 1 });
locationSchema.index({ name: 1, type: 1 });

// ══════════════════════════════════════════════════════════════
// Subscription Plan — admin-managed subscription tiers
// ══════════════════════════════════════════════════════════════
const subscriptionPlanSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: null },
  plan_type: { type: String, enum: ['basic', 'standard', 'premium', 'enterprise', 'custom'], default: 'basic' },
  user_type: { type: String, enum: ['vendor', 'creator', 'all'], default: 'vendor' },
  billing_cycle: { type: String, enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'], required: true },
  price_inr: { type: Number, required: true },
  monthly_price: { type: Number, default: 0 },
  quarterly_price: { type: Number, default: 0 },
  half_yearly_price: { type: Number, default: 0 },
  yearly_price: { type: Number, default: 0 },
  discount_percentage: { type: Number, default: 0, min: 0, max: 100 },
  duration_days: { type: Number, default: 30 },
  features: { type: String, default: '' },
  features_list: { type: [String], default: [] },
  target_role: { type: String, enum: ['vendor', 'creator', 'all'], default: 'vendor' },
  // Limits
  product_limit: { type: Number, default: null },
  service_limit: { type: Number, default: null },
  reels_limit: { type: Number, default: null },
  leads_limit: { type: Number, default: null },
  ai_credits: { type: Number, default: 0 },
  offer_creation_limit: { type: Number, default: null },
  max_listings: { type: Number, default: null },
  // Feature Flags
  verification_badge: { type: Boolean, default: false },
  verified_badge: { type: Boolean, default: true },
  priority_support: { type: Boolean, default: false },
  analytics_access: { type: Boolean, default: false },
  priority_ranking: { type: Boolean, default: false },
  // Status
  is_active: { type: Boolean, default: true },
  is_archived: { type: Boolean, default: false },
  is_deleted: { type: Boolean, default: false },
  sort_order: { type: Number, default: 0 },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});


// ══════════════════════════════════════════════════════════════
// App Settings — global application configuration
// ══════════════════════════════════════════════════════════════
const appSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
  category: { type: String, enum: ['general', 'theme', 'otp', 'maintenance', 'version', 'commission', 'notifications'], default: 'general' },
  description: { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// ══════════════════════════════════════════════════════════════
// Register models — safe re-registration
// ══════════════════════════════════════════════════════════════
const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = {
  AdminRole: registerOrReuse('AdminRole', adminRoleSchema, 'admin_roles'),
  AdminLoginLog: registerOrReuse('AdminLoginLog', adminLoginLogSchema, 'admin_login_logs'),
  BoostPlan: registerOrReuse('BoostPlan', boostPlanSchema, 'boost_plans'),
  CmsPage: registerOrReuse('CmsPage', cmsPageSchema, 'cms_pages'),
  Coupon: registerOrReuse('Coupon', couponSchema, 'coupons'),
  Location: registerOrReuse('Location', locationSchema, 'locations'),
  AppSettings: registerOrReuse('AppSettings', appSettingsSchema, 'app_settings'),
  SubscriptionPlan: registerOrReuse('SubscriptionPlan', subscriptionPlanSchema, 'subscription_plans'),
};
