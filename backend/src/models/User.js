const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, sparse: true, unique: true, default: null },
  name: { type: String, default: null },
  email: { type: String, sparse: true, unique: true, default: null },
  auth_providers: { type: [mongoose.Schema.Types.Mixed], default: [] },
  roles: { type: [String], enum: ['customer', 'vendor', 'creator', 'admin'], default: ['customer'] },
  current_role: { type: String, enum: ['customer', 'vendor', 'creator', 'admin'], default: 'customer' },
  kyc_status: { type: String, enum: ['unverified', 'pending', 'approved', 'rejected'], default: 'unverified' },
  profile_pic: { type: String, default: null },
  gender: { type: String, default: null },
  dob: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  is_test_data: { type: Boolean, default: false },
  // Phase 4a
  is_subscribed_verified: { type: Boolean, default: false },
  rating_avg: { type: Number, default: 0 },
  rating_count: { type: Number, default: 0 },
  trust_score: { type: Number, default: null },
  city: { type: String, default: null },
  // Phase 4b
  is_banned: { type: Boolean, default: false },
  has_received_first_topup_bonus: { type: Boolean, default: false },
  fcm_tokens: { type: [mongoose.Schema.Types.Mixed], default: [] },
  // Phase 5
  referral_code: { type: String, sparse: true, unique: true, default: null },
  avg_response_time_seconds: { type: Number, default: null },
  chat_response_rate: { type: Number, default: 0 },
  total_conversations_responded: { type: Number, default: 0 },
  has_received_profile_complete_bonus: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.index({ is_deleted: 1 });

module.exports = mongoose.model('User', userSchema, 'users');
