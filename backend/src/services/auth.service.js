const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const authRepository = require('../repositories/authRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * AuthService
 * Business logic layer for authentication, token management, and role operations.
 */
class AuthService {
  // ══════════════════════════════════════════════════════════
  // TOKEN GENERATION
  // ══════════════════════════════════════════════════════════

  /**
   * Generate a JWT access token.
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        activeRole: user.activeRole,
        roles: user.roles,
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );
  }

  /**
   * Generate a refresh token string (opaque, not JWT).
   */
  generateRefreshTokenString() {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * Create and persist a refresh token with family tracking.
   */
  async createRefreshToken(user, req, family = null) {
    const tokenString = this.generateRefreshTokenString();
    const tokenFamily = family || uuidv4();

    await authRepository.createRefreshToken({
      userId: user._id,
      token: tokenString,
      family: tokenFamily,
      userAgent: req?.headers?.['user-agent'] || 'unknown',
      ipAddress: req?.ip || '127.0.0.1',
      expiresAt: new Date(Date.now() + this._parseExpiry(config.jwt.refreshExpiry)),
    });

    return { token: tokenString, family: tokenFamily };
  }

  /**
   * Generate both access and refresh tokens.
   */
  async generateTokenPair(user, req, family = null) {
    const accessToken = this.generateAccessToken(user);
    const refreshTokenData = await this.createRefreshToken(user, req, family);

    return {
      accessToken,
      refreshToken: refreshTokenData.token,
      family: refreshTokenData.family,
    };
  }

  // ══════════════════════════════════════════════════════════
  // REGISTRATION
  // ══════════════════════════════════════════════════════════

  async registerWithEmail({ name, email, phone, password, role }, req) {
    const cleanEmail = (typeof email === 'string' && email.trim()) ? email.trim().toLowerCase() : undefined;
    const cleanPhone = (typeof phone === 'string' && phone.trim()) ? phone.trim() : undefined;

    if (cleanEmail) {
      const existingUser = await authRepository.findUserByEmail(cleanEmail);
      if (existingUser) {
        throw ApiError.conflict('An account with this email address already exists. Please log in instead.');
      }
    }

    if (cleanPhone) {
      const existingPhone = await authRepository.findUserByPhone(cleanPhone);
      if (existingPhone) {
        throw ApiError.conflict('An account with this phone number already exists. Please log in instead.');
      }
    }

    const targetRole = role || 'customer';
    const roles = ['customer'];
    if (targetRole !== 'customer' && ['vendor', 'creator'].includes(targetRole)) {
      roles.push(targetRole);
    }

    const user = await authRepository.createUser({
      name,
      ...(cleanEmail && { email: cleanEmail }),
      ...(cleanPhone && { phone: cleanPhone }),
      password,
      authProvider: 'local',
      roles,
      activeRole: targetRole,
      current_role: targetRole,
    });

    const tokens = await this.generateTokenPair(user, req);

    await this._logAction(user._id, 'USER_REGISTER', 'User', user._id, 'Email registration', req);

    logger.info(`New user registered: ${email}`, { service: 'auth', userId: user._id });

    return {
      user: this._sanitizeUser(user),
      ...tokens,
    };
  }

  // ══════════════════════════════════════════════════════════
  // EMAIL LOGIN
  // ══════════════════════════════════════════════════════════

  async loginWithEmail({ email, password, role }, req) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (user.isLocked()) {
      const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw ApiError.tooMany(`Account locked. Try again in ${lockMinutes} minutes.`);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        user.loginAttempts = 0;
      }
      await user.save();
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (role && ['customer', 'vendor', 'creator', 'admin'].includes(role)) {
      if (user.roles.includes(role)) {
        user.activeRole = role;
        user.current_role = role;
      } else {
        throw ApiError.badRequest(`You do not have the "${role}" role on this account.`);
      }
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    user.lastLoginIp = req?.ip || '127.0.0.1';
    await user.save();

    const tokens = await this.generateTokenPair(user, req);

    await this._logAction(user._id, 'USER_LOGIN', 'User', user._id, 'Email login', req);

    return {
      user: this._sanitizeUser(user),
      ...tokens,
    };
  }

  // ══════════════════════════════════════════════════════════
  // OTP LOGIN / VERIFICATION (Redis + MSG91 / Exotel)
  // ══════════════════════════════════════════════════════════

  async requestOtp(identifier, identifierType = 'phone', purpose = 'login') {
    const redisOtpService = require('./redis-otp.service');
    const smsService = require('./sms.service');

    if (identifierType === 'phone') {
      const phone = this.validatePhone(identifier);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store in Redis with 5-minute expiry (300s TTL)
      await redisOtpService.saveOtp(phone, otp);

      // Send SMS via MSG91 / Exotel / Mock logger
      await smsService.sendOtpSms(phone, otp);

      const response = {
        message: `OTP sent successfully to +91${phone}`,
        expiresInMinutes: config.otp.expiryMinutes || 5,
      };

      if (config.env === 'development' || (config.sms?.provider || 'mock') === 'mock') {
        response.otp = otp;
      }
      return response;
    }

    // Fallback for email OTP if requested
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await authRepository.createOtp({
      identifier,
      identifierType,
      otp,
      purpose,
      expiresAt: new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000),
      maxAttempts: config.otp.maxAttempts,
    });

    const result = { message: `OTP sent to ${identifier}`, expiresInMinutes: config.otp.expiryMinutes };
    if (process.env.NODE_ENV !== 'production') {
      result.otp = otp;
    }
    return result;
  }

  async verifyOtpAndLogin(identifier, identifierType = 'phone', otp, req) {
    const redisOtpService = require('./redis-otp.service');

    if (identifierType === 'phone') {
      const phone = this.validatePhone(identifier);

      // Verify OTP against Redis with 5-attempt rate limit & instant deletion
      await redisOtpService.verifyOtp(phone, otp);

      // Find user by phone or auto-register on first mobile OTP login
      let user = await authRepository.findUserByPhone(phone);

      if (!user) {
        user = await authRepository.createUser({
          name: `User_${phone.slice(-4)}`,
          phone,
          isPhoneVerified: true,
          authProvider: 'otp',
          roles: ['customer'],
          activeRole: 'customer',
          current_role: 'customer',
        });
        await this._logAction(user._id, 'USER_REGISTER', 'User', user._id, 'Mobile OTP registration', req);
      } else if (!user.isPhoneVerified) {
        await authRepository.updateUser(user._id, { isPhoneVerified: true });
      }

      // Generate JWT Access & Refresh Token Pair
      const tokens = await this.generateTokenPair(user, req);

      await this._logAction(user._id, 'USER_LOGIN', 'User', user._id, 'Mobile OTP login', req);

      return {
        user: this._sanitizeUser(user),
        ...tokens,
      };
    }

    // Email OTP fallback
    const otpDoc = await authRepository.findLatestOtp(identifier, 'login');
    if (!otpDoc) {
      throw ApiError.badRequest('OTP expired or not found. Please request a new one.');
    }

    if (otpDoc.isMaxAttemptsReached()) {
      throw ApiError.tooMany('Maximum OTP attempts reached. Please request a new OTP.');
    }

    if (otpDoc.otp !== otp) {
      await otpDoc.incrementAttempts();
      throw ApiError.badRequest('Invalid OTP. Please try again.');
    }

    await otpDoc.markUsed();

    let user = await authRepository.findUserByEmail(identifier);
    if (!user) {
      user = await authRepository.createUser({
        name: identifier.split('@')[0],
        email: identifier.toLowerCase(),
        isEmailVerified: true,
        authProvider: 'otp',
        roles: ['customer'],
        activeRole: 'customer',
      });
      await this._logAction(user._id, 'USER_REGISTER', 'User', user._id, 'OTP registration', req);
    }

    const tokens = await this.generateTokenPair(user, req);

    return {
      user: this._sanitizeUser(user),
      ...tokens,
    };
  }

  // ══════════════════════════════════════════════════════════
  // GOOGLE OAUTH
  // ══════════════════════════════════════════════════════════

  async googleOAuthCallback(profile, req) {
    let user = await authRepository.findUserByGoogleId(profile.id);

    if (!user) {
      const existingUser = await authRepository.findUserByEmail(profile.emails[0].value);
      if (existingUser) {
        existingUser.googleId = profile.id;
        existingUser.avatarUrl = existingUser.avatarUrl || profile.photos?.[0]?.value || '';
        existingUser.isEmailVerified = true;
        await existingUser.save();
        user = existingUser;
      } else {
        user = await authRepository.createUser({
          name: profile.displayName,
          email: profile.emails[0].value.toLowerCase(),
          googleId: profile.id,
          avatarUrl: profile.photos?.[0]?.value || '',
          authProvider: 'google',
          isEmailVerified: true,
          roles: ['customer'],
          activeRole: 'customer',
        });
        await this._logAction(user._id, 'USER_REGISTER', 'User', user._id, 'Google OAuth registration', req);
      }
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = req?.ip || '127.0.0.1';
    await user.save();

    const tokens = await this.generateTokenPair(user, req);
    await this._logAction(user._id, 'USER_LOGIN', 'User', user._id, 'Google login', req);

    return {
      user: this._sanitizeUser(user),
      ...tokens,
    };
  }

  // ══════════════════════════════════════════════════════════
  // TOKEN REFRESH (ROTATION)
  // ══════════════════════════════════════════════════════════

  async refreshAccessToken(refreshToken, req) {
    const tokenDoc = await authRepository.findRefreshToken(refreshToken);

    if (!tokenDoc) {
      logger.warn('Refresh token reuse detected!', { service: 'auth', token: refreshToken.slice(0, 10) });
      const revokedToken = await require('../models/RefreshToken').findOne({ token: refreshToken });
      if (revokedToken) {
        await authRepository.revokeTokenFamily(revokedToken.family);
      }
      throw ApiError.unauthorized('Invalid refresh token. Please log in again.');
    }

    if (tokenDoc.expiresAt < new Date()) {
      await authRepository.revokeRefreshToken(refreshToken);
      throw ApiError.unauthorized('Refresh token expired. Please log in again.');
    }

    const user = await authRepository.findUserById(tokenDoc.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found.');
    }

    const tokens = await this.generateTokenPair(user, req, tokenDoc.family);
    await authRepository.revokeRefreshToken(refreshToken, tokens.refreshToken);

    await this._logAction(user._id, 'TOKEN_REFRESH', 'RefreshToken', tokenDoc._id, 'Token rotation', req);

    return {
      user: this._sanitizeUser(user),
      ...tokens,
    };
  }

  // ══════════════════════════════════════════════════════════
  // LOGOUT
  // ══════════════════════════════════════════════════════════

  async logout(refreshToken, userId, req) {
    if (refreshToken) {
      await authRepository.revokeRefreshToken(refreshToken);
    }
    await this._logAction(userId, 'USER_LOGOUT', 'User', userId, 'Logout', req);
    return { message: 'Logged out successfully.' };
  }

  async logoutAll(userId, req) {
    await authRepository.revokeAllUserTokens(userId);
    await this._logAction(userId, 'TOKEN_REVOKE', 'User', userId, 'Logout from all devices', req);
    return { message: 'Logged out from all devices.' };
  }

  // ══════════════════════════════════════════════════════════
  // FORGOT PASSWORD
  // ══════════════════════════════════════════════════════════

  async forgotPassword(email) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      return { message: 'If an account with this email exists, an OTP has been sent.' };
    }
    await this.requestOtp(email, 'email', 'forgot-password');
    return { message: 'If an account with this email exists, an OTP has been sent.' };
  }

  async resetPassword(email, otp, newPassword, req) {
    const otpDoc = await authRepository.findLatestOtp(email, 'forgot-password');

    if (!otpDoc) {
      throw ApiError.badRequest('OTP expired or not found.');
    }

    if (otpDoc.otp !== otp) {
      await otpDoc.incrementAttempts();
      throw ApiError.badRequest('Invalid OTP.');
    }

    await otpDoc.markUsed();

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    user.password = newPassword;
    await user.save();

    await authRepository.revokeAllUserTokens(user._id);

    await this._logAction(user._id, 'PASSWORD_RESET', 'User', user._id, 'Password reset via OTP', req);

    return { message: 'Password reset successfully. Please log in again.' };
  }

  // ══════════════════════════════════════════════════════════
  // ROLE MANAGEMENT
  // ══════════════════════════════════════════════════════════

  async switchRole(userId, newRole, req) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (user.roles.includes('admin') && newRole !== 'admin') {
      throw ApiError.forbidden('Admin accounts cannot switch to non-admin roles.');
    }

    if (!user.roles.includes(newRole)) {
      throw ApiError.badRequest(`You do not have the "${newRole}" role. Please activate it first.`);
    }

    const updatedUser = await authRepository.updateUser(userId, { activeRole: newRole });

    await this._logAction(userId, 'ROLE_SWITCH', 'User', userId, `Switched to ${newRole}`, req);

    return this._sanitizeUser(updatedUser);
  }

  async updateProfile(userId, { name, avatarUrl, phone, gender, occupation, dob, language, location, vendorProfile, creatorProfile }, req) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;
    if (phone) updateFields.phone = phone;
    if (gender) updateFields.gender = gender;
    if (occupation) updateFields.occupation = occupation;
    if (dob) updateFields.dob = dob;
    if (language) updateFields.language = language;
    if (location) {
      updateFields.location = {
        type: 'Point',
        coordinates: location.coordinates || [0, 0],
        address: location.address,
        city: location.city,
        district: location.district,
        state: location.state,
        pincode: location.pincode
      };
    }
    if (vendorProfile) {
      const currentProfile = user.vendorProfile ? (user.vendorProfile.toObject ? user.vendorProfile.toObject() : user.vendorProfile) : {};
      updateFields.vendorProfile = {
        ...currentProfile,
        ...vendorProfile
      };
    }
    if (creatorProfile) {
      const currentProfile = user.creatorProfile ? (user.creatorProfile.toObject ? user.creatorProfile.toObject() : user.creatorProfile) : {};
      updateFields.creatorProfile = {
        ...currentProfile,
        ...creatorProfile
      };
    }

    const updatedUser = await authRepository.updateUser(userId, updateFields);
    await this._logAction(userId, 'PROFILE_UPDATE', 'User', userId, 'Updated profile details', req);

    return this._sanitizeUser(updatedUser);
  }

  async followUser(userId, followId, req) {
    if (userId.toString() === followId.toString()) {
      throw ApiError.badRequest('You cannot follow yourself.');
    }

    const userToFollow = await authRepository.findUserById(followId);
    if (!userToFollow) {
      throw ApiError.notFound('User to follow not found.');
    }

    await require('../models/User').findByIdAndUpdate(userId, {
      $addToSet: { following: followId }
    });

    await require('../models/User').findByIdAndUpdate(followId, {
      $addToSet: { followers: userId },
      $inc: { followersCount: 1 }
    });

    await require('../models/User').findByIdAndUpdate(userId, {
      $inc: { followingCount: 1 }
    });

    await this._logAction(userId, 'USER_FOLLOW', 'User', followId, `Followed user ${userToFollow.name}`, req);

    return this.getCurrentUser(userId);
  }

  async unfollowUser(userId, unfollowId, req) {
    const userToUnfollow = await authRepository.findUserById(unfollowId);
    if (!userToUnfollow) {
      throw ApiError.notFound('User to unfollow not found.');
    }

    await require('../models/User').findByIdAndUpdate(userId, {
      $pull: { following: unfollowId }
    });

    await require('../models/User').findByIdAndUpdate(unfollowId, {
      $pull: { followers: userId },
      $inc: { followersCount: -1 }
    });

    await require('../models/User').findByIdAndUpdate(userId, {
      $inc: { followingCount: -1 }
    });

    await this._logAction(userId, 'USER_UNFOLLOW', 'User', unfollowId, `Unfollowed user ${userToUnfollow.name}`, req);

    return this.getCurrentUser(userId);
  }

  async addRole(userId, newRole, profileData, req) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (user.roles.includes(newRole)) {
      throw ApiError.conflict(`You already have the "${newRole}" role.`);
    }

    const updateData = {
      $push: { roles: newRole },
      activeRole: newRole,
    };

    if (newRole === 'vendor' && profileData) {
      updateData.vendorProfile = profileData;
    } else if (newRole === 'creator' && profileData) {
      updateData.creatorProfile = profileData;
    }

    const updatedUser = await authRepository.updateUser(userId, updateData);

    const actionType = newRole === 'vendor' ? 'VENDOR_PROFILE_CREATE' : 'CREATOR_PROFILE_CREATE';
    await this._logAction(userId, actionType, 'User', userId, `Added ${newRole} role`, req);

    return this._sanitizeUser(updatedUser);
  }

  async deleteAccount(userId, req) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const updateData = {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
      email: user.email ? `deleted_${user.email}_${randomSuffix}` : undefined,
      phone: user.phone ? `deleted_${user.phone}_${randomSuffix}` : undefined,
    };

    await authRepository.updateUser(userId, updateData);
    await this._logAction(userId, 'USER_DELETE', 'User', userId, 'Deleted account', req);
    return { success: true, message: 'Account deleted successfully.' };
  }

  async getCurrentUser(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return this._sanitizeUser(user);
  }

  serializeUser(user) {
    return this._sanitizeUser(user);
  }

  validatePhone(phone) {
    const p = String(phone).trim();
    if (!/^\d{10}$/.test(p) || !['6', '7', '8', '9'].includes(p[0])) {
      throw ApiError.badRequest('Invalid Indian phone number. Provide a 10-digit number starting 6-9.');
    }
    return p;
  }

  async issueTokens(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshTokenData = await this.createRefreshToken(user, { headers: {}, ip: '127.0.0.1' });
    return {
      access_token: accessToken,
      refresh_token: refreshTokenData.token,
    };
  }

  _sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    delete userObj.__v;
    delete userObj.loginAttempts;
    delete userObj.lockUntil;
    return userObj;
  }

  _parseExpiry(expiry) {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 86400000;
    return parseInt(match[1], 10) * units[match[2]];
  }

  async _logAction(userId, action, entity, entityId, description, req) {
    try {
      await authRepository.createAuditLog({
        userId,
        action,
        entity,
        entityId,
        description,
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
      });
    } catch (error) {
      logger.error('Failed to create audit log:', { error: error.message, service: 'audit' });
    }
  }
}

module.exports = new AuthService();
