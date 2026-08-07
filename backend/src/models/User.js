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
  subscription: {
    plan: { type: String, default: 'Free Member' },
    plan_id: { type: String, default: null },
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    boostCredits: { type: Number, default: 0 },
    autoRenew: { type: Boolean, default: false },
    status: { type: String, default: 'inactive' }
  },
  rating_avg: { type: Number, default: 0 },
  rating_count: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
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
  lastLoginAt: { type: Date, default: null },
  lastLoginIp: { type: String, default: null },
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
    savedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
    interests: [{
      category: { type: String },
      subcategory: { type: String, default: null }
    }],
    interestsSelectedAt: { type: Date, default: null }
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
userSchema.index({ roles: 1 });
userSchema.index({ city: 1 });
userSchema.index({ activeRole: 1 });

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

// Pre-validate hook to clean up empty/falsy sparse unique fields and block base64 strings
userSchema.pre('validate', function () {
  if (!this.phone) this.phone = undefined;
  if (!this.email) this.email = undefined;
  if (!this.referral_code) this.referral_code = undefined;

  // Prevent storing base64 files in profile fields
  if (hasBase64(this.creatorProfile) || hasBase64(this.vendorProfile) || hasBase64(this.customerProfile)) {
    throw new Error('Uploading base64 files directly to MongoDB is not permitted. Please upload files via /api/v1/upload/image first.');
  }
});

// Pre-save hook to hash password if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to check if user is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema, 'users');