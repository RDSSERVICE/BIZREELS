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
    const clean = email.trim();
    return User.findOne({
      $or: [
        { email: clean.toLowerCase() },
        { email: clean },
        { email: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    }).select('+password');
  }

  async findUserByPhone(phone) {
    if (!phone || typeof phone !== 'string' || !phone.trim()) return null;
    const clean = phone.trim().replace(/[^\d+]/g, '');
    const digitsOnly = clean.replace(/[^\d]/g, '');
    const last10 = digitsOnly.slice(-10);
    if (!last10) return null;

    return User.findOne({
      $or: [
        { phone: clean },
        { phone: digitsOnly },
        { phone: last10 },
        { phone: `+91${last10}` },
        { phone: { $regex: `${last10}$` } },
      ],
    }).select('+password');
  }

  async findUserByGoogleId(googleId) {
    return User.findOne({ googleId });
  }

  async findUserById(id) {
    return User.findById(id)
      .select('-password -__v -followers -following');
  }

  async createUser(userData) {
    return User.create(userData);
  }

  async updateUser(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    }).select('-password -__v -followers -following');
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
