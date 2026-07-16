const crypto = require('crypto');
const User = require('../models/User');
const OtpRequest = require('../models/OtpRequest');
const RefreshToken = require('../models/RefreshToken');
const { AuditLog } = require('../models/Misc');
const { generateOtp, hashOtp } = require('../utils/otp.utils');
const { createAccessToken, createRefreshTokenPair, hashRefreshToken } = require('../utils/jwt.utils');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const msg91Service = require('./msg91.service');

const OTP_TTL_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;
const VALID_ROLES = new Set(['customer', 'vendor', 'creator']);

const serializeUser = (user) => {
  const u = user.toObject ? user.toObject() : { ...user };
  return {
    id: (u._id || u.id).toString(),
    phone: u.phone,
    name: u.name,
    email: u.email,
    roles: u.roles,
    current_role: u.current_role,
    kyc_status: u.kyc_status,
    profile_pic: u.profile_pic,
    gender: u.gender,
    dob: u.dob,
    is_active: u.is_active,
    is_subscribed_verified: !!u.is_subscribed_verified,
    verified_badge: !!u.is_subscribed_verified && u.kyc_status === 'approved',
    rating_avg: u.rating_avg || 0,
    rating_count: u.rating_count || 0,
    trust_score: u.trust_score || null,
    city: u.city || null,
    referral_code: u.referral_code || null,
    avg_response_time_seconds: u.avg_response_time_seconds || null,
    chat_response_rate: u.chat_response_rate || 0,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
};

const validatePhone = (phone) => {
  const p = phone.trim();
  if (!/^\d{10}$/.test(p) || !['6', '7', '8', '9'].includes(p[0])) {
    throw ApiError.badRequest('Invalid Indian phone number. Provide a 10-digit number starting 6-9.');
  }
  return p;
};

const requestOtp = async (phone) => {
  phone = validatePhone(phone);
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Invalidate previous unverified OTPs
  await OtpRequest.deleteMany({ phone, verified: false });

  await OtpRequest.create({
    phone,
    otp_hash: hashOtp(otp),
    purpose: 'login',
    expires_at: expiresAt,
  });

  try {
    await msg91Service.sendOtpSms(phone, otp);
  } catch (err) {
    logger.error('OTP send failed:', err.message);
    throw new ApiError(503, 'SMS service temporarily unavailable. Please try again later.');
  }

  const response = {
    success: true,
    message: 'OTP sent successfully',
    expires_in_seconds: OTP_TTL_MINUTES * 60,
  };

  if (msg91Service.isDevMode()) {
    response.dev_mode = true;
    response.dev_otp = otp;
  }
  return response;
};

const verifyOtpAndLogin = async (phone, otp, name = null, roles = null, referralCode = null) => {
  phone = validatePhone(phone);

  const record = await OtpRequest.findOne({ phone, verified: false }).sort({ created_at: -1 });
  if (!record) {
    throw ApiError.badRequest('OTP not requested or already used');
  }

  if (record.expires_at < new Date()) {
    throw ApiError.badRequest('OTP expired');
  }

  if ((record.attempts || 0) >= MAX_OTP_ATTEMPTS) {
    throw ApiError.tooMany('Too many OTP attempts. Please request a new OTP.');
  }

  if (!crypto.timingSafeEqual(
    Buffer.from(hashOtp(otp)),
    Buffer.from(record.otp_hash)
  )) {
    await OtpRequest.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    throw ApiError.badRequest('Invalid OTP');
  }

  // Mark verified
  await OtpRequest.updateOne({ _id: record._id }, { $set: { verified: true } });

  // Sanitize roles
  let cleanRoles = [];
  if (roles && Array.isArray(roles)) {
    cleanRoles = roles.filter(r => VALID_ROLES.has(r));
  }
  if (cleanRoles.length === 0) cleanRoles = ['customer'];

  // Upsert user
  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({
      phone,
      name,
      roles: cleanRoles,
      current_role: cleanRoles[0],
    });
    // Signup bonus
    try {
      const walletService = require('./wallet.service');
      await walletService.earnCredits(user._id.toString(), 50, 'Welcome bonus', 'signup', user._id.toString());
    } catch (err) {
      logger.error('Signup bonus failed:', err.message);
    }
    // Referral
    try {
      const referralService = require('./referral.service');
      await referralService.ensureCode(user._id.toString());
      if (referralCode) {
        await referralService.claimOnSignup(user._id.toString(), referralCode);
      }
    } catch (err) {
      logger.error('Referral setup failed:', err.message);
    }
    user = await User.findById(user._id);
  } else {
    // Existing user: revive if soft-deleted
    const updates = { updated_at: new Date() };
    if (user.is_deleted) {
      updates.is_deleted = false;
      updates.is_active = true;
      updates.is_test_data = false;
    }
    if (name && !user.name) updates.name = name;
    await User.updateOne({ _id: user._id }, { $set: updates });
    user = await User.findById(user._id);
  }

  const tokens = await issueTokens(user);

  await AuditLog.create({
    user_id: user._id.toString(),
    action: 'login',
    meta: { phone },
  });

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: 'bearer',
    user: serializeUser(user),
  };
};

const issueTokens = async (user) => {
  const userId = user._id.toString();
  const accessToken = createAccessToken(userId, user.roles, user.current_role);
  const { raw, tokenHash, expiresAt } = createRefreshTokenPair(userId);

  await RefreshToken.create({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return { access_token: accessToken, refresh_token: raw };
};

const refreshAccessToken = async (refreshToken) => {
  const tokenHash = hashRefreshToken(refreshToken);
  const rec = await RefreshToken.findOne({ token_hash: tokenHash });
  if (!rec) throw ApiError.unauthorized('Invalid refresh token');

  if (rec.expires_at < new Date()) {
    throw ApiError.unauthorized('Refresh token expired');
  }

  if (rec.revoked) {
    // Reuse attack — burn the whole family
    await RefreshToken.updateMany(
      { user_id: rec.user_id, revoked: false },
      { $set: { revoked: true } }
    );
    await AuditLog.create({
      user_id: rec.user_id,
      action: 'refresh_reuse_detected',
      meta: {},
    });
    throw ApiError.unauthorized('Refresh token reuse detected. Please sign in again.');
  }

  const user = await User.findById(rec.user_id);
  if (!user || user.is_deleted) throw ApiError.unauthorized('User not found');

  // Rotate: revoke old, issue new pair
  await RefreshToken.updateOne({ _id: rec._id }, { $set: { revoked: true } });
  const newTokens = await issueTokens(user);

  return {
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token,
    token_type: 'bearer',
  };
};

const revokeRefreshToken = async (refreshToken) => {
  const tokenHash = hashRefreshToken(refreshToken);
  await RefreshToken.updateOne({ token_hash: tokenHash }, { $set: { revoked: true } });
};

/**
 * Register a user using Email + Password
 */
const registerWithEmail = async (email, password, name = null, phone = null, roles = null, referralCode = null) => {
  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw ApiError.badRequest('Invalid email address');
  }
  if (!password || password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters long');
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email: cleanEmail });
  if (existingEmail) {
    throw ApiError.badRequest('Email is already registered.');
  }

  // Check phone if provided
  let cleanPhone = null;
  if (phone) {
    cleanPhone = validatePhone(phone);
    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone) {
      throw ApiError.badRequest('Phone number is already registered.');
    }
  }

  // Hash password using bcryptjs
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 10);

  // Sanitize roles
  let cleanRoles = [];
  if (roles && Array.isArray(roles)) {
    cleanRoles = roles.filter(r => VALID_ROLES.has(r));
  }
  if (cleanRoles.length === 0) cleanRoles = ['customer'];

  // Create user
  let user = await User.create({
    email: cleanEmail,
    password: hashedPassword,
    name: name ? String(name).trim() : null,
    phone: cleanPhone,
    roles: cleanRoles,
    current_role: cleanRoles[0],
  });

  // Welcome credit bonus
  try {
    const walletService = require('./wallet.service');
    await walletService.earnCredits(user._id.toString(), 50, 'Welcome bonus', 'signup', user._id.toString());
  } catch (err) {
    logger.error('Signup bonus failed:', err.message);
  }

  // Referral handling
  try {
    const referralService = require('./referral.service');
    await referralService.ensureCode(user._id.toString());
    if (referralCode) {
      await referralService.claimOnSignup(user._id.toString(), referralCode);
    }
  } catch (err) {
    logger.error('Referral setup failed:', err.message);
  }

  user = await User.findById(user._id);
  const tokens = await issueTokens(user);

  await AuditLog.create({
    user_id: user._id.toString(),
    action: 'register_email',
    meta: { email: cleanEmail },
  });

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: 'bearer',
    user: serializeUser(user),
  };
};

/**
 * Log in a user using Email + Password
 */
const loginWithEmail = async (email, password) => {
  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail) {
    throw ApiError.badRequest('Email is required');
  }
  if (!password) {
    throw ApiError.badRequest('Password is required');
  }

  const user = await User.findOne({ email: cleanEmail });
  if (!user || user.is_deleted) {
    throw ApiError.badRequest('Invalid email or password');
  }

  if (!user.password) {
    throw ApiError.badRequest('This account does not have a password set. Try logging in with Google or OTP.');
  }

  const bcrypt = require('bcryptjs');
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw ApiError.badRequest('Invalid email or password');
  }

  const tokens = await issueTokens(user);

  await AuditLog.create({
    user_id: user._id.toString(),
    action: 'login_email',
    meta: { email: cleanEmail },
  });

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: 'bearer',
    user: serializeUser(user),
  };
};

/**
 * Generate an Email OTP for password reset
 */
const forgotPassword = async (email) => {
  const cleanEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: cleanEmail, is_deleted: { $ne: true } });
  if (!user) {
    throw ApiError.badRequest('User with this email does not exist.');
  }

  if (!user.password) {
    throw ApiError.badRequest('This account does not support password resets. (OTP-only or Google-linked account).');
  }

  // Generate 6-digit OTP
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

  user.resetPasswordOtpHash = hashOtp(otp);
  user.resetPasswordExpires = expiresAt;
  await user.save();

  const response = {
    success: true,
    message: 'Password reset OTP has been sent to your email.',
  };

  if (process.env.NODE_ENV === 'development' || msg91Service.isDevMode()) {
    response.dev_mode = true;
    response.dev_otp = otp;
  }

  logger.info(`Password reset Email OTP for ${cleanEmail}: ${otp}`);

  return response;
};

/**
 * Verify Email OTP and reset password
 */
const resetPassword = async (email, otp, newPassword) => {
  const cleanEmail = String(email).trim().toLowerCase();
  if (!otp || otp.length !== 6) {
    throw ApiError.badRequest('OTP must be 6 digits.');
  }
  if (!newPassword || newPassword.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters long.');
  }

  const user = await User.findOne({ email: cleanEmail, is_deleted: { $ne: true } });
  if (!user || !user.password) {
    throw ApiError.badRequest('Invalid request.');
  }

  if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw ApiError.badRequest('OTP expired. Please request a new one.');
  }

  if (!user.resetPasswordOtpHash) {
    throw ApiError.badRequest('OTP verification not initiated.');
  }

  const otpHash = hashOtp(otp);
  if (!crypto.timingSafeEqual(
    Buffer.from(otpHash),
    Buffer.from(user.resetPasswordOtpHash)
  )) {
    throw ApiError.badRequest('Invalid OTP.');
  }

  // Update password
  const bcrypt = require('bcryptjs');
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordOtpHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  await AuditLog.create({
    user_id: user._id.toString(),
    action: 'reset_password',
    meta: { email: cleanEmail },
  });

  return {
    success: true,
    message: 'Password has been reset successfully.'
  };
};

/**
 * Generate OTP for binding phone number
 */
const requestPhoneBindOtp = async (userId, phone) => {
  const cleanPhone = validatePhone(phone);

  const existing = await User.findOne({ phone: cleanPhone, _id: { $ne: userId }, is_deleted: { $ne: true } });
  if (existing) {
    throw ApiError.badRequest('Phone number is already linked to another account.');
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await OtpRequest.deleteMany({ phone: cleanPhone, verified: false });

  await OtpRequest.create({
    phone: cleanPhone,
    otp_hash: hashOtp(otp),
    purpose: 'bind-phone',
    expires_at: expiresAt,
  });

  try {
    await msg91Service.sendOtpSms(cleanPhone, otp);
  } catch (err) {
    logger.error('SMS OTP send failed for phone bind:', err.message);
    throw new ApiError(503, 'SMS service temporarily unavailable. Please try again later.');
  }

  const response = {
    success: true,
    message: 'Verification OTP sent to mobile number successfully.',
    expires_in_seconds: 300,
  };

  if (msg91Service.isDevMode()) {
    response.dev_mode = true;
    response.dev_otp = otp;
  }

  return response;
};

/**
 * Verify phone bind OTP and link to account
 */
const verifyPhoneBindOtp = async (userId, phone, otp) => {
  const cleanPhone = validatePhone(phone);
  if (!otp || otp.length !== 6) {
    throw ApiError.badRequest('OTP must be 6 digits.');
  }

  const record = await OtpRequest.findOne({ phone: cleanPhone, verified: false }).sort({ created_at: -1 });
  if (!record) {
    throw ApiError.badRequest('OTP not requested or already used.');
  }

  if (record.expires_at < new Date()) {
    throw ApiError.badRequest('OTP expired.');
  }

  const hash = hashOtp(otp);
  if (!crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(record.otp_hash)
  )) {
    throw ApiError.badRequest('Invalid OTP.');
  }

  await OtpRequest.updateOne({ _id: record._id }, { $set: { verified: true } });

  const user = await User.findById(userId);
  if (!user || user.is_deleted) {
    throw ApiError.notFound('User not found.');
  }

  const duplicate = await User.findOne({ phone: cleanPhone, _id: { $ne: userId }, is_deleted: { $ne: true } });
  if (duplicate) {
    throw ApiError.badRequest('Phone number is already linked to another account.');
  }

  user.phone = cleanPhone;
  await user.save();

  await AuditLog.create({
    user_id: userId,
    action: 'bind_phone',
    meta: { phone: cleanPhone },
  });

  return {
    success: true,
    message: 'Phone number verified and linked successfully.',
    user: serializeUser(user),
  };
};

module.exports = {
  serializeUser,
  validatePhone,
  requestOtp,
  verifyOtpAndLogin,
  issueTokens,
  refreshAccessToken,
  revokeRefreshToken,
  registerWithEmail,
  loginWithEmail,
  forgotPassword,
  resetPassword,
  requestPhoneBindOtp,
  verifyPhoneBindOtp,
};
