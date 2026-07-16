const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * OTP Model
 * Handles email/phone OTP storage with expiry, attempt limiting, and auto-cleanup.
 */
const otpSchema = new Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true, // email or phone
    },
    identifierType: {
      type: String,
      enum: ['email', 'phone'],
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['login', 'register', 'forgot-password', 'verify-email', 'verify-phone'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL: auto-delete expired OTPs
    },
  },
  { timestamps: true }
);

// Compound index for fast lookups
otpSchema.index({ identifier: 1, purpose: 1, isUsed: 1 });

/**
 * Check if OTP has exceeded max attempts.
 */
otpSchema.methods.isMaxAttemptsReached = function () {
  return this.attempts >= this.maxAttempts;
};

/**
 * Mark OTP as used.
 */
otpSchema.methods.markUsed = function () {
  this.isUsed = true;
  return this.save();
};

/**
 * Increment attempt counter.
 */
otpSchema.methods.incrementAttempts = function () {
  this.attempts += 1;
  return this.save();
};

module.exports = mongoose.model('OTP', otpSchema);
