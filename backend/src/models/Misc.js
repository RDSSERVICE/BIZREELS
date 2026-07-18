const mongoose = require('mongoose');

// Report
const reportSchema = new mongoose.Schema({
  reporter_id: { type: String, required: true, index: true },
  target_type: { type: String, enum: ['listing', 'user', 'review', 'requirement'], required: true },
  target_id: { type: String, required: true, index: true },
  reason: { type: String, required: true },
  description: { type: String, default: null },
  evidence: { type: [mongoose.Schema.Types.Mixed], default: [] },
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  resolved_by: { type: String, default: null },
  resolution_action: { type: String, default: null },
  resolution_note: { type: String, default: null },
  resolved_at: { type: String, default: null },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

reportSchema.index({ status: 1, _id: -1 });

// Audit Log
const auditLogSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  action: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

auditLogSchema.index({ created_at: 1 });

// Search History
const searchHistorySchema = new mongoose.Schema({
  user_id: { type: String, default: null, index: true },
  query: { type: String, required: true },
  filters: { type: mongoose.Schema.Types.Mixed, default: {} },
  results_count: { type: Number, default: 0 },
  ip: { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

// Referral
const referralSchema = new mongoose.Schema({
  referrer_id: { type: String, required: true, index: true },
  referred_user_id: { type: String, required: true, unique: true },
  status: { type: String, default: 'pending' },
  reward_given: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Listing Event (analytics)
const listingEventSchema = new mongoose.Schema({
  listing_id: { type: String, required: true },
  vendor_id: { type: String, default: null },
  event_type: { type: String, required: true },
  user_id: { type: String, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

listingEventSchema.index({ vendor_id: 1, created_at: -1 });
listingEventSchema.index({ listing_id: 1, event_type: 1, created_at: -1 });

// Response Event (chat response time tracking)
const responseEventSchema = new mongoose.Schema({
  sender_id: { type: String, required: true, index: true },
  for_message_id: { type: String, required: true },
  response_time_seconds: { type: Number, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

responseEventSchema.index({ sender_id: 1, for_message_id: 1 }, { unique: true });

// Watcher Notification
const watcherNotificationSchema = new mongoose.Schema({
  listing_id: { type: String, required: true },
  phone: { type: String, required: true },
  event: { type: String, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

watcherNotificationSchema.index({ listing_id: 1, phone: 1, created_at: -1 });

// Platform Settings
const platformSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = {
  Report: registerOrReuse('Report', reportSchema, 'reports'),
  AuditLog: registerOrReuse('AuditLog', auditLogSchema, 'audit_logs'),
  SearchHistory: registerOrReuse('SearchHistory', searchHistorySchema, 'search_history'),
  Referral: registerOrReuse('Referral', referralSchema, 'referrals'),
  ListingEvent: registerOrReuse('ListingEvent', listingEventSchema, 'listing_events'),
  ResponseEvent: registerOrReuse('ResponseEvent', responseEventSchema, 'response_events'),
  WatcherNotification: registerOrReuse('WatcherNotification', watcherNotificationSchema, 'watcher_notifications'),
  PlatformSettings: registerOrReuse('PlatformSettings', platformSettingsSchema, 'platform_settings'),
};
