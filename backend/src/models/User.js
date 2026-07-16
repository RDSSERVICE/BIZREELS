const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

// ── Customer Profile Sub-Schema ────────────────────────────
const customerProfileSchema = new Schema(
  {
    savedListings: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
    interests: [{ type: String, trim: true }],
    requirementCount: { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Vendor Profile Sub-Schema ──────────────────────────────
const vendorProfileSchema = new Schema(
  {
    businessName: { type: String, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 1000 },
    category: { type: String, index: true },
    subcategory: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    operatingHours: {
      open: String,
      close: String,
      days: [String],
    },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    totalServices: { type: Number, default: 0 },
    documents: [{ name: String, url: String, verified: Boolean }],
  },
  { _id: false }
);

// ── Creator Profile Sub-Schema ─────────────────────────────
const creatorProfileSchema = new Schema(
  {
    portfolioUrl: String,
    bio: { type: String, maxlength: 500 },
    skills: [{ type: String, trim: true }],
    pricingTiers: [
      {
        label: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        deliverables: String,
        deliveryDays: Number,
      },
    ],
    experience: { type: Number, default: 0 }, // years
    availability: { type: String, enum: ['available', 'busy', 'unavailable'], default: 'available' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalProjects: { type: Number, default: 0 },
    sampleReels: [{ type: Schema.Types.ObjectId, ref: 'Reel' }],
    sampleImages: [String],
  },
  { _id: false }
);

// ── Subscription Sub-Schema ────────────────────────────────
const subscriptionSchema = new Schema(
  {
    plan: {
      type: String,
      enum: ['free', 'premium', 'business', 'creator'],
      default: 'free',
    },
    startedAt: Date,
    expiresAt: Date,
    boostCredits: { type: Number, default: 0 },
    autoRenew: { type: Boolean, default: false },
  },
  { _id: false }
);

// ══════════════════════════════════════════════════════════════
// ██  USER MODEL
// ══════════════════════════════════════════════════════════════
const userSchema = new Schema(
  {
    // ── Identity ────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^\+?[1-9]\d{6,14}$/, 'Please provide a valid phone number'],
    },
    password: {
      type: String,
      minlength: 8,
      select: false, // Never returned in queries by default
    },
    avatarUrl: { type: String, default: '' },

    // ── OAuth ───────────────────────────────────────────────
    googleId: { type: String, unique: true, sparse: true },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'otp'],
      default: 'local',
    },

    // ── Multi-Role System ───────────────────────────────────
    roles: {
      type: [{ type: String, enum: ['customer', 'vendor', 'creator', 'admin'] }],
      default: ['customer'],
      validate: {
        validator: (v) => v.length > 0,
        message: 'User must have at least one role',
      },
    },
    activeRole: {
      type: String,
      enum: ['customer', 'vendor', 'creator', 'admin'],
      default: 'customer',
    },

    // ── Embedded Profiles ───────────────────────────────────
    customerProfile: { type: customerProfileSchema, default: () => ({}) },
    vendorProfile: { type: vendorProfileSchema, default: undefined },
    creatorProfile: { type: creatorProfileSchema, default: undefined },

    // ── Financials ──────────────────────────────────────────
    walletBalance: { type: Number, default: 0, min: 0 },
    subscription: { type: subscriptionSchema, default: () => ({}) },

    // ── Social ──────────────────────────────────────────────
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },

    // ── Status ──────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,

    // ── Security ────────────────────────────────────────────
    passwordChangedAt: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    lastLoginAt: Date,
    lastLoginIp: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'vendorProfile.location': '2dsphere' });
userSchema.index({ roles: 1, isDeleted: 1 });
userSchema.index({ createdAt: -1 });

// ── Pre-save: Hash password ───────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = Date.now() - 1000; // Ensure token issued after password change
  next();
});

// ── Instance Methods ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasRole = function (role) {
  return this.roles.includes(role);
};

userSchema.methods.addRole = function (role) {
  if (!this.roles.includes(role)) {
    this.roles.push(role);
  }
  return this;
};

userSchema.methods.switchRole = function (role) {
  if (!this.roles.includes(role)) {
    throw new Error(`User does not have the "${role}" role.`);
  }
  this.activeRole = role;
  return this;
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// ── Soft delete helper ────────────────────────────────────
userSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

// ── Query middleware: exclude soft-deleted by default ──────
userSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('User', userSchema);
