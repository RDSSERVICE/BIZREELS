const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const OTP = require('../models/OTP');
const AuditLog = require('../models/AuditLog');

/**
 * AuthRepository
 * Data access layer for all authentication-related database operations.
 * Separates DB queries from business logic (Service layer).
 */
class AuthRepository {
  // ══════════════════════════════════════════════════════════
  // USER QUERIES
  // ══════════════════════════════════════════════════════════

  async findUserByEmail(email) {
    if (!email || typeof email !== 'string' || !email.trim()) return null;
    return User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  }

  async findUserByPhone(phone) {
    if (!phone || typeof phone !== 'string' || !phone.trim()) return null;
    return User.findOne({ phone: phone.trim() }).select('+password');
  }

  async findUserByGoogleId(googleId) {
    return User.findOne({ googleId });
  }

  async findUserById(id) {
    return User.findById(id)
      .populate({
        path: 'customerProfile.savedListings',
        populate: { path: 'vendor', select: 'name businessName activeRole avatarUrl' }
      })
      .populate('following', 'name avatarUrl activeRole roles vendorProfile creatorProfile')
      .select('-password -__v');
  }

  async createUser(userData) {
    return User.create(userData);
  }

  async updateUser(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password -__v');
  }

  async updateUserPassword(id, hashedPassword) {
    return User.findByIdAndUpdate(id, {
      password: hashedPassword,
      passwordChangedAt: Date.now(),
    });
  }

  // ══════════════════════════════════════════════════════════
  // REFRESH TOKEN QUERIES
  // ══════════════════════════════════════════════════════════

  async createRefreshToken(tokenData) {
    return RefreshToken.create(tokenData);
  }

  async findRefreshToken(token) {
    return RefreshToken.findOne({ token, isRevoked: false });
  }

  async revokeRefreshToken(token, replacedByToken = null) {
    return RefreshToken.findOneAndUpdate(
      { token },
      {
        isRevoked: true,
        revokedAt: new Date(),
        ...(replacedByToken && { replacedByToken }),
      }
    );
  }

  async revokeTokenFamily(family) {
    return RefreshToken.revokeFamily(family);
  }

  async revokeAllUserTokens(userId) {
    return RefreshToken.revokeAllForUser(userId);
  }

  // ══════════════════════════════════════════════════════════
  // OTP QUERIES
  // ══════════════════════════════════════════════════════════

  async createOtp(otpData) {
    // Invalidate any existing unused OTPs for same identifier + purpose
    await OTP.updateMany(
      {
        identifier: otpData.identifier,
        purpose: otpData.purpose,
        isUsed: false,
      },
      { $set: { isUsed: true } }
    );
    return OTP.create(otpData);
  }

  async findLatestOtp(identifier, purpose) {
    return OTP.findOne({
      identifier,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
  }

  // ══════════════════════════════════════════════════════════
  // AUDIT LOG QUERIES
  // ══════════════════════════════════════════════════════════

  async createAuditLog(logData) {
    return AuditLog.create(logData);
  }
}

module.exports = new AuthRepository();
