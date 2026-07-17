const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * RefreshToken Model
 * Stores hashed refresh tokens linked to users and devices.
 * Supports token rotation and family-based revocation for security.
 */
const refreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    family: {
      type: String,
      required: true,
      index: true, // Groups tokens for rotation-based revocation
    },
    userAgent: String,
    ipAddress: String,
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index: auto-delete expired docs
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: Date,
    replacedByToken: String, // For rotation chain tracking
  },
  { timestamps: true }
);

// Compound index for efficient lookups
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

/**
 * Revoke all tokens in a family (used when token reuse detected).
 */
refreshTokenSchema.statics.revokeFamily = async function (family) {
  return this.updateMany(
    { family, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );
};

/**
 * Revoke all tokens for a user (logout from all devices).
 */
refreshTokenSchema.statics.revokeAllForUser = async function (userId) {
  return this.updateMany(
    { userId, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
