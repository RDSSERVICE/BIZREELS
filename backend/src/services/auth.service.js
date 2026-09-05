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

  async registerWithEmail({ name, email, phone, password, role, referralCode, interests }, req) {
    const cleanEmail = (typeof email === 'string' && email.trim()) ? email.trim().toLowerCase() : undefined;
    let cleanPhone = (typeof phone === 'string' && phone.trim()) ? phone.trim() : undefined;
    if (cleanPhone) {
      const digits = cleanPhone.replace(/\D/g, '');
      if (digits.length === 10) {
        cleanPhone = `+91${digits}`;
      } else if (digits.length === 12 && digits.startsWith('91')) {
        cleanPhone = `+${digits}`;
      }
    }

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

    let cleanedInterests = [];
    if (Array.isArray(interests) && interests.length > 0) {
      cleanedInterests = interests.map(i => ({
        category: String(typeof i === 'string' ? i : i.category || i.name || '').trim(),
        subcategory: (typeof i === 'object' && i.subcategory) ? String(i.subcategory).trim() : null,
      })).filter(i => i.category);
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
      ...(cleanedInterests.length > 0 && {
        customerProfile: {
          interests: cleanedInterests,
          interestsSelectedAt: new Date(),
        }
      })
    });

    const tokens = await this.generateTokenPair(user, req);

    await this._logAction(user._id, 'USER_REGISTER', 'User', user._id, 'Email registration', req);

    logger.info(`New user registered: ${email}`, { service: 'auth', userId: user._id });

    // Claim referral code if present
    if (referralCode) {
      try {
        const referralService = require('./referral.service');
        await referralService.claimOnSignup(user._id, referralCode, req.ip || '127.0.0.1');
      } catch (err) {
        logger.error(`Failed to process referral code ${referralCode} for user ${user._id}: ${err.message}`, { service: 'referral' });
      }
    }

    try {
      const { emitToAdmin } = require('../sockets');
      emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
    } catch (err) {}

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
  // OTP LOGIN / VERIFICATION (Redis + Twilio SMS & WhatsApp)
  // ══════════════════════════════════════════════════════════

  async requestOtp(identifier, identifierType = 'phone', purpose = 'login', channel = 'sms') {
    const otpService = require('./otp.service');

    if (purpose === 'signup') {
      let existingUser = null;
      if (identifierType === 'phone' || (identifier && /^\+?[\d\s-]{8,}$/.test(identifier))) {
        existingUser = await authRepository.findUserByPhone(identifier);
      } else {
        existingUser = await authRepository.findUserByEmail(identifier);
      }
      if (existingUser) {
        throw ApiError.conflict('Account with this phone number or email already exists. Please Sign In.');
      }
    }

    if (identifierType === 'phone') {
      const result = await otpService.sendOtp({
        phone: identifier,
        channel: channel || 'sms',
        purpose: purpose || 'login',
      });
      return result;
    }

    // Email OTP sending via Resend Email Service
    const email = typeof identifier === 'string' ? identifier.trim().toLowerCase() : '';
    const emailService = require('./email.service');
    const { generateOtp } = require('../utils/otp.utils');
    const otp = generateOtp();
    const expiryMinutes = config.otp.expiryMinutes || 10;

    await authRepository.createOtp({
      identifier: email,
      identifierType: 'email',
      otp,
      purpose,
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
      maxAttempts: config.otp.maxAttempts || 5,
    });

    // Send email via Resend
    let emailResult;
    if (purpose === 'forgot-password') {
      emailResult = await emailService.sendPasswordResetOtp({ to: email, otp, expiresInMinutes: expiryMinutes });
    } else {
      emailResult = await emailService.sendOtpEmail({ to: email, otp, purpose, expiresInMinutes: expiryMinutes });
    }

    if (emailResult && !emailResult.success && emailResult.error) {
      const errMsg = typeof emailResult.error === 'object' ? emailResult.error.message : emailResult.error;
      throw ApiError.badRequest(errMsg || 'Failed to dispatch email via Resend.');
    }

    const result = {
      message: `OTP sent successfully to ${email}`,
      expiresInMinutes: expiryMinutes,
    };

    if (config.env === 'development' || !config.resend?.apiKey || !config.resend.apiKey.startsWith('re_')) {
      result.otp = otp;
    }
    return result;
  }

  async verifyOtpAndLogin(identifier, identifierType = 'phone', otp, req, channel = null, purpose = 'login') {
    const otpService = require('./otp.service');

    if (identifierType === 'phone') {
      const verified = await otpService.verifyOtp({
        phone: identifier,
        otp,
        channel,
        purpose: purpose || 'login',
      });

      const phone = verified.phone;

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
        await this._logAction(user._id, 'USER_REGISTER', 'User', user._id, `Mobile OTP registration via ${verified.channel || 'sms'}`, req);

        // Claim referral code if present
        const referralCode = req?.body?.referralCode || req?.body?.ref;
        if (referralCode) {
          try {
            const referralService = require('./referral.service');
            await referralService.claimOnSignup(user._id, referralCode, req.ip || '127.0.0.1');
          } catch (err) {
            logger.error(`Failed to process referral code ${referralCode} for user ${user._id} during phone OTP signup: ${err.message}`, { service: 'referral' });
          }
        }

        try {
          const { emitToAdmin } = require('../sockets');
          emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
        } catch (err) {}
      } else {
        if (!user.isPhoneVerified) {
          user.isPhoneVerified = true;
        }
      }

      user.lastLoginAt = new Date();
      user.lastLoginIp = req?.ip || '127.0.0.1';
      await user.save();

      // Generate JWT Access & Refresh Token Pair
      const tokens = await this.generateTokenPair(user, req);

      await this._logAction(user._id, 'USER_LOGIN', 'User', user._id, `Mobile OTP login via ${verified.channel || 'sms'}`, req);

      return {
        user: this._sanitizeUser(user),
        channel: verified.channel,
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

      // Claim referral code if present
      const referralCode = req.body?.referralCode || req.body?.ref;
      if (referralCode) {
        try {
          const referralService = require('./referral.service');
          await referralService.claimOnSignup(user._id, referralCode, req.ip || '127.0.0.1');
        } catch (err) {
          logger.error(`Failed to process referral code ${referralCode} for user ${user._id} during email OTP signup: ${err.message}`, { service: 'referral' });
        }
      }
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
        try {
          const { emitToAdmin } = require('../sockets');
          emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
        } catch (err) {}
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

  async forgotPassword(identifier) {
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      throw ApiError.badRequest('Mobile number or email is required.');
    }
    const clean = identifier.trim();
    const isPhone = /^\+?[\d\s-]{8,}$/.test(clean);

    let user = null;
    if (isPhone) {
      user = await authRepository.findUserByPhone(clean);
    } else {
      user = await authRepository.findUserByEmail(clean.toLowerCase());
    }

    if (!user) {
      throw ApiError.notFound(
        isPhone
          ? 'No account found with this phone number.'
          : 'No account found with this email address.'
      );
    }

    const identifierType = isPhone ? 'phone' : 'email';
    const targetIdentifier = isPhone ? (user.phone || clean) : user.email;

    const otpResult = await this.requestOtp(targetIdentifier, identifierType, 'forgot-password');
    return {
      message: otpResult.message || `Password reset OTP sent to your ${isPhone ? 'mobile number' : 'email'}.`,
      identifier: targetIdentifier,
      identifierType,
    };
  }

  async resetPassword(identifier, otp, newPassword, req) {
    if (!identifier || !otp || !newPassword) {
      throw ApiError.badRequest('Mobile number/Email, OTP, and new password are required.');
    }

    const clean = identifier.trim();
    const isPhone = /^\+?[\d\s-]{8,}$/.test(clean);

    let user = null;
    if (isPhone) {
      user = await authRepository.findUserByPhone(clean);
    } else {
      user = await authRepository.findUserByEmail(clean.toLowerCase());
    }

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (isPhone) {
      const otpService = require('./otp.service');
      await otpService.verifyOtp({
        phone: user.phone || clean,
        otp,
        purpose: 'forgot-password',
      });
    } else {
      const targetEmail = (user.email || clean).toLowerCase();
      const otpDoc = await authRepository.findLatestOtp(targetEmail, 'forgot-password');

      if (!otpDoc) {
        throw ApiError.badRequest('OTP expired or not found. Please request a new OTP.');
      }

      if (otpDoc.isMaxAttemptsReached && otpDoc.isMaxAttemptsReached()) {
        throw ApiError.tooMany('Maximum OTP attempts reached. Please request a new OTP.');
      }

      if (otpDoc.otp !== otp) {
        await otpDoc.incrementAttempts();
        throw ApiError.badRequest('Invalid OTP code. Please check and try again.');
      }

      await otpDoc.markUsed();
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

    if (!['customer', 'vendor', 'creator', 'admin'].includes(newRole)) {
      throw ApiError.badRequest(`Invalid target role: ${newRole}`);
    }

    if (!user.roles.includes(newRole)) {
      user.roles.push(newRole);
    }

    user.activeRole = newRole;
    user.current_role = newRole;
    await user.save();

    try {
      const cache = require('../utils/cache');
      await cache.deleteCache(`user:auth:${userId}`);
    } catch (err) {}

    await this._logAction(userId, 'ROLE_SWITCH', 'User', userId, `Switched to ${newRole}`, req);

    const sanitized = this._sanitizeUser(user);

    let isOnboardingRequired = false;
    let targetOnboardingPath = null;
    let targetDashboardPath = null;

    if (newRole === 'vendor') {
      targetDashboardPath = '/vendor/dashboard';
      const vp = user.vendorProfile || {};
      const isComplete = Boolean(vp.shopName || vp.businessName || vp.store_name);
      if (!isComplete) {
        isOnboardingRequired = true;
        targetOnboardingPath = '/vendor/onboarding';
      }
    } else if (newRole === 'creator') {
      targetDashboardPath = '/creator/dashboard';
      const cp = user.creatorProfile || {};
      const isComplete = Boolean(cp.displayName || cp.name);
      if (!isComplete) {
        isOnboardingRequired = true;
        targetOnboardingPath = '/creator/onboarding';
      }
    } else if (newRole === 'customer') {
      targetDashboardPath = '/customer/home';
      const custp = user.customerProfile || {};
      const isComplete = Boolean(
        custp.interestsSelectedAt || (Array.isArray(custp.interests) && custp.interests.length >= 5)
      );
      if (!isComplete) {
        isOnboardingRequired = true;
        targetOnboardingPath = '/customer/choose-interests';
      }
    } else if (newRole === 'admin') {
      targetDashboardPath = '/admin/dashboard';
    }

    const redirectTo = isOnboardingRequired ? targetOnboardingPath : (targetDashboardPath || '/customer/home');

    return {
      user: sanitized,
      activeRole: newRole,
      isOnboardingRequired,
      targetOnboardingPath,
      targetDashboardPath,
      redirectTo,
    };
  }

  async updateProfile(userId, { name, avatarUrl, profile_pic, phone, gender, occupation, profession, dob, language, location, vendorProfile, creatorProfile, city }, req) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    const resolvedPic = avatarUrl !== undefined ? avatarUrl : profile_pic;
    if (resolvedPic !== undefined) {
      updateFields.avatarUrl = resolvedPic;
      updateFields.profile_pic = resolvedPic;
    }
    if (phone !== undefined) {
      let cleanPhone = (typeof phone === 'string') ? phone.trim() : '';
      if (cleanPhone) {
        const digits = cleanPhone.replace(/\D/g, '');
        if (digits.length === 10) {
          cleanPhone = `+91${digits}`;
        } else if (digits.length === 12 && digits.startsWith('91')) {
          cleanPhone = `+${digits}`;
        }
        const existingPhone = await authRepository.findUserByPhone(cleanPhone);
        if (existingPhone && existingPhone._id.toString() !== userId.toString()) {
          throw ApiError.conflict('This mobile number is already registered to another account.');
        }
        updateFields.phone = cleanPhone;
      }
    }
    if (gender) updateFields.gender = gender;
    if (profession !== undefined) {
      updateFields.profession = profession;
      updateFields.occupation = profession;
    } else if (occupation !== undefined) {
      updateFields.occupation = occupation;
      updateFields.profession = occupation;
    }
    if (dob) {
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        throw ApiError.badRequest('Invalid Date of Birth.');
      }
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (dobDate > today) {
        throw ApiError.badRequest('Date of Birth cannot be in the future.');
      }
      updateFields.dob = dob;
    }
    if (language) updateFields.language = language;
    if (city !== undefined) updateFields.city = city;
    if (location) {
      updateFields.location = {
        type: 'Point',
        coordinates: location.coordinates || [0, 0],
        address: location.address,
        city: location.city || city,
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
      if (creatorProfile.dob) {
        const dobDate = new Date(creatorProfile.dob);
        if (isNaN(dobDate.getTime())) {
          throw ApiError.badRequest('Invalid Date of Birth in creator profile.');
        }
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (dobDate > today) {
          throw ApiError.badRequest('Date of Birth in creator profile cannot be in the future.');
        }
        // Calculate age
        let age = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
          age--;
        }
        if (age < 18) {
          throw ApiError.badRequest('Must be 18 years or older to register as a Creator.');
        }
      if (creatorProfile.availability || creatorProfile.availabilityStatus) {
        const rawAvail = creatorProfile.availability || creatorProfile.availabilityStatus;
        const normalizedAvail = typeof rawAvail === 'string'
          ? (rawAvail.toLowerCase().includes('busy') ? 'Busy' : (rawAvail.toLowerCase().includes('leave') ? 'On Leave' : 'Available'))
          : 'Available';
        creatorProfile.availability = normalizedAvail;
        creatorProfile.availabilityStatus = normalizedAvail;
        updateFields.availabilityStatus = normalizedAvail;
        updateFields.availability = normalizedAvail;
      }
      const currentProfile = user.creatorProfile ? (user.creatorProfile.toObject ? user.creatorProfile.toObject() : user.creatorProfile) : {};
      updateFields.creatorProfile = {
        ...currentProfile,
        ...creatorProfile
      };
    }

     const updatedUser = await authRepository.updateUser(userId, updateFields);

    try {
      const cache = require('../utils/cache');
      await cache.deleteCache(`user:auth:${userId}`);
    } catch (err) {}

    await this._logAction(userId, 'PROFILE_UPDATE', 'User', userId, 'Updated profile details', req);

    try {
      const { emitToAdmin } = require('../sockets');
      emitToAdmin('admin:update', { tags: ['AdminUsers'] });
    } catch (err) {}

    return this._sanitizeUser(updatedUser);
  }

  async followUser(userId, followId, req) {
    const followService = require('./follow.service');
    const result = await followService.follow(userId.toString(), followId.toString());
    const userToFollow = await authRepository.findUserById(followId);
    await this._logAction(userId, 'USER_FOLLOW', 'User', followId, `Followed user ${userToFollow ? userToFollow.name : ''}`, req);
    return this.getCurrentUser(userId);
  }

  async unfollowUser(userId, unfollowId, req) {
    const followService = require('./follow.service');
    const result = await followService.unfollow(userId.toString(), unfollowId.toString());
    const userToUnfollow = await authRepository.findUserById(unfollowId);
    await this._logAction(userId, 'USER_UNFOLLOW', 'User', unfollowId, `Unfollowed user ${userToUnfollow ? userToUnfollow.name : ''}`, req);
    return this.getCurrentUser(userId);
  }

  async addRole(userId, newRole, profileData, req) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (user.roles.includes(newRole)) {
      // Idempotent: If user already has the role, update profile data and set it as activeRole
      const updateData = {
        activeRole: newRole,
      };
      if (newRole === 'vendor') {
        if (profileData) {
          updateData.vendorProfile = profileData;
        }
      } else if (newRole === 'creator') {
        if (profileData) {
          updateData.creatorProfile = profileData;
        }
      }
      const updatedUser = await authRepository.updateUser(userId, updateData);
      const actionType = newRole === 'vendor' ? 'VENDOR_PROFILE_UPDATE' : 'CREATOR_PROFILE_UPDATE';
      await this._logAction(userId, actionType, 'User', userId, `Updated profile for existing ${newRole} role`, req);
      return this._sanitizeUser(updatedUser);
    }

    const updateData = {
      $push: { roles: newRole },
      activeRole: newRole,
    };

    if (newRole === 'vendor') {
      if (profileData) {
        updateData.vendorProfile = profileData;
      }
      // Grant free welcome credits to first-time vendor
      if (!user.has_received_vendor_bonus) {
        const walletService = require('./wallet.service');
        const notificationService = require('./notification.service');
        const WELCOME_CREDITS = 100;
        try {
          await walletService.credit({
            userId,
            amount: WELCOME_CREDITS,
            transactionType: 'vendor_welcome_bonus',
            reason: 'Free Welcome credits for registering as Vendor',
            source: 'system'
          });
          updateData.has_received_vendor_bonus = true;
          
          await notificationService.create(
            userId,
            'reward',
            `+${WELCOME_CREDITS} Welcome Credits!`,
            "You have received 100 free credits to explore BizReels vendor outreach.",
            {},
            '/vendor/wallet',
            'vendor'
          );
        } catch (err) {
          logger.error('Failed to grant vendor welcome credits:', err);
        }
      }
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
      is_deleted: true,
      isDeleted: true,
      deletedAt: new Date(),
      is_active: false,
      isActive: false,
      email: user.email ? `deleted_${user.email}_${randomSuffix}` : undefined,
      phone: user.phone ? `deleted_${user.phone}_${randomSuffix}` : undefined,
    };

    await authRepository.updateUser(userId, updateData);

    // Stage 2: Perform cascade delete of all user-related data
    try {
      const Reel = require('../models/Reel');
      const Listing = require('../models/Listing');
      const Comment = require('../models/Comment');
      const ReelLike = require('../models/ReelLike');
      const Requirement = require('../models/Requirement');
      const Review = require('../models/Review');
      const Offer = require('../models/Offer');
      const Inquiry = require('../models/Inquiry');
      const HireRequest = require('../models/HireRequest');
      const Follow = require('../models/Follow');
      const Conversation = require('../models/Conversation');
      const Message = require('../models/Message');
      const RefreshToken = require('../models/RefreshToken');
      const Order = require('../models/Order');
      const Deal = require('../models/Deal');
      const Notification = require('../models/Notification');
      const Proposal = require('../models/Proposal');
      const Quote = require('../models/Quote');

      // Execute deleteMany calls in parallel
      await Promise.all([
        Reel.deleteMany({ creator: userId }),
        Listing.deleteMany({ vendor: userId }),
        Comment.deleteMany({ user: userId }),
        ReelLike.deleteMany({ user: userId }),
        Requirement.deleteMany({ customer: userId }),
        Review.deleteMany({ $or: [{ author: userId }, { targetUser: userId }] }),
        Offer.deleteMany({ $or: [{ userId: userId }, { createdBy: userId }] }),
        Inquiry.deleteMany({ $or: [{ customer: userId }, { vendor: userId }] }),
        HireRequest.deleteMany({ $or: [{ vendor: userId }, { creator: userId }] }),
        Follow.deleteMany({ $or: [{ follower_id: userId.toString() }, { following_id: userId.toString() }] }),
        Conversation.deleteMany({ participants: userId }),
        Message.deleteMany({ sender: userId }),
        RefreshToken.deleteMany({ user: userId }),
        Order.deleteMany({ $or: [{ customer: userId }, { vendor: userId }] }),
        Deal.deleteMany({ $or: [{ buyer_id: userId.toString() }, { seller_id: userId.toString() }] }),
        Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }, { recipient: userId.toString() }, { sender: userId.toString() }] }),
        Proposal.deleteMany({ vendor_id: userId }),
        Quote.deleteMany({ vendor: userId })
      ]);
    } catch (err) {
      console.error('Error cascading deletion for user ' + userId + ':', err);
    }

    await this._logAction(userId, 'USER_DELETE', 'User', userId, 'Deleted account and cascaded related data', req);
    return { success: true, message: 'Account and associated data deleted successfully.' };
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
    const { normalizeIndianPhone } = require('../utils/otp.utils');
    return normalizeIndianPhone(phone);
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
    const effectiveRole = userObj.activeRole || userObj.current_role || 'customer';
    userObj.activeRole = effectiveRole;
    userObj.current_role = effectiveRole;
    delete userObj.password;
    delete userObj.__v;
    delete userObj.followers;
    delete userObj.following;
    delete userObj.loginAttempts;
    delete userObj.lockUntil;
    return userObj;
  }

  _parseExpiry(expiry) {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = expiry ? expiry.match(/^(\d+)([smhd])$/) : null;
    if (!match) return 60 * 86400000;
    return parseInt(match[1], 10) * units[match[2]];
  }

  _logAction(userId, action, entity, entityId, description, req) {
    authRepository.createAuditLog({
      userId,
      action,
      entity,
      entityId,
      description,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    }).catch((error) => {
      logger.error('Failed to create audit log asynchronously:', { error: error.message, service: 'audit' });
    });
  }
}

module.exports = new AuthService();
