const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: { type: String, sparse: true, unique: true, default: undefined },
  name: { type: String, default: null },
  email: { type: String, sparse: true, unique: true, default: undefined },
  auth_providers: { type: [mongoose.Schema.Types.Mixed], default: [] },
  roles: { type: [String], enum: ['customer', 'vendor', 'creator', 'admin'], default: ['customer'] },
  current_role: { type: String, enum: ['customer', 'vendor', 'creator', 'admin'], default: 'customer' },
  activeRole: { type: String, enum: ['customer', 'vendor', 'creator', 'admin'], default: 'customer' },
  kyc_status: { type: String, enum: ['unverified', 'pending', 'approved', 'rejected'], default: 'unverified' },
  profile_pic: { type: String, default: null },
  avatarUrl: { type: String, default: null },
  gender: { type: String, default: null },
  dob: { type: String, default: null },
  occupation: { type: String, default: null },
  language: { type: String, default: 'English' },
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
  referral_code: { type: String, sparse: true, unique: true, default: undefined },
  avg_response_time_seconds: { type: Number, default: null },
  chat_response_rate: { type: Number, default: 0 },
  total_conversations_responded: { type: Number, default: 0 },
  has_received_profile_complete_bonus: { type: Boolean, default: false },
  // Email + Password & Reset password OTP
  password: { type: String, default: null },
  resetPasswordOtpHash: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  // Lockout / Login attempts
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  // Social count / arrays
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Profiles
  customerProfile: {
    savedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }]
  },
  vendorProfile: { type: mongoose.Schema.Types.Mixed, default: null },
  creatorProfile: { type: mongoose.Schema.Types.Mixed, default: null },
  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    address: { type: String, default: null },
    city: { type: String, default: null },
    district: { type: String, default: null },
    state: { type: String, default: null },
    pincode: { type: String, default: null }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.index({ is_deleted: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });

// Pre-validate hook to clean up empty/falsy sparse unique fields
userSchema.pre('validate', function(next) {
  if (!this.phone) this.phone = undefined;
  if (!this.email) this.email = undefined;
  if (!this.referral_code) this.referral_code = undefined;
  if (typeof next === 'function') next();
});

// Pre-save hook to hash password if modified
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to check if user is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema, 'users');
