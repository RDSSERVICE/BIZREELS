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
  usage_limit: { type: Number, default: null },
  used_count: { type: Number, default: 0 },
  applicable_to: { type: String, enum: ['all', 'subscription', 'boost', 'order'], default: 'all' },
  valid_from: { type: Date, default: null },
  valid_until: { type: Date, default: null },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  created_by: { type: String, default: null },
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
  billing_cycle: { type: String, enum: ['monthly', 'yearly'], required: true },
  price_inr: { type: Number, required: true },
  features: { type: String, default: '' },
  target_role: { type: String, enum: ['vendor', 'creator', 'all'], default: 'vendor' },
  max_listings: { type: Number, default: null },
  priority_ranking: { type: Boolean, default: false },
  verified_badge: { type: Boolean, default: true },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
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
