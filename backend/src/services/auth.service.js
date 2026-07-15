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

module.exports = {
  serializeUser,
  validatePhone,
  requestOtp,
  verifyOtpAndLogin,
  issueTokens,
  refreshAccessToken,
  revokeRefreshToken,
};
