const express = require('express');
const authService = require('../services/auth.service');
const adminPhoneService = require('../services/admin-phone.service');
const googleAuthService = require('../services/google-auth.service');
const { requireAuth } = require('../middleware/auth.middleware');
const { checkAndRecord } = require('../utils/rateLimit');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const ALLOW_DEV_ADMIN_LOGIN = process.env.ALLOW_DEV_ADMIN_LOGIN === 'true';

router.post('/otp/send', catchAsync(async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10) {
    throw ApiError.badRequest('Phone must be 10 digits');
  }

  // Rate limit: 3 requests per phone per 10 min
  const { allowed, remaining } = checkAndRecord(`otp:${phone}`, 3, 600);
  if (!allowed) {
    throw new ApiError(429, `Too many OTP requests. Try again in ${remaining} seconds.`);
  }

  const result = await authService.requestOtp(phone);
  res.json(result);
}));

router.post('/otp/verify', catchAsync(async (req, res) => {
  const { phone, otp, name, roles, referral_code } = req.body;
  if (!phone || phone.length !== 10) {
    throw ApiError.badRequest('Phone must be 10 digits');
  }
  if (!otp || otp.length !== 6) {
    throw ApiError.badRequest('OTP must be 6 digits');
  }

  // IP rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
  const { allowed, remaining } = checkAndRecord(`otpv:${phone}:${ip}`, 10, 3600);
  if (!allowed) {
    throw new ApiError(429, `Too many verification attempts. Retry in ${remaining}s.`);
  }

  const result = await authService.verifyOtpAndLogin({
    phone,
    otp,
    name,
    roles,
    referralCode: referral_code,
  });
  res.json(result);
}));

if (ALLOW_DEV_ADMIN_LOGIN) {
  router.post('/dev/admin-login', catchAsync(async (req, res) => {
    const { token } = req.body;
    if (!token || token.length < 8 || token.length > 256) {
      throw ApiError.badRequest('Invalid token format');
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
    const { allowed, remaining } = checkAndRecord(`devadmin:${ip}`, 30, 60);
    if (!allowed) {
      throw new ApiError(429, `Too many attempts. Retry in ${remaining}s.`);
    }

    const result = await adminPhoneService.devAdminLogin(token.trim());
    res.json(result);
  }));
}

router.post('/google/session-exchange', catchAsync(async (req, res) => {
  const { session_id } = req.body;
  if (!session_id || session_id.length < 8 || session_id.length > 256) {
    throw ApiError.badRequest('Invalid session_id');
  }

  const result = await googleAuthService.exchangeSessionAndLogin(session_id.trim());
  res.json(result);
}));

router.post('/refresh', catchAsync(async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    throw ApiError.badRequest('refresh_token required');
  }

  const result = await authService.refreshAccessToken(refresh_token);
  res.json(result);
}));

router.post('/logout', catchAsync(async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    throw ApiError.badRequest('refresh_token required');
  }

  await authService.revokeRefreshToken(refresh_token);
  res.json({ success: true, message: 'Logged out' });
}));

// Email Registration
router.post('/email/register', catchAsync(async (req, res) => {
  const { email, password, name, phone, roles, referral_code } = req.body;
  const result = await authService.registerWithEmail(
    email,
    password,
    name,
    phone,
    roles,
    referral_code
  );
  res.status(201).json(result);
}));

// Email Login
router.post('/email/login', catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginWithEmail(email, password);
  res.json(result);
}));

// Forgot Password (Email OTP generation)
router.post('/forgot-password', catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    throw ApiError.badRequest('Valid email is required');
  }

  const { allowed, remaining } = checkAndRecord(`forgot:${email}`, 3, 600);
  if (!allowed) {
    throw new ApiError(429, `Too many requests. Retry in ${remaining}s.`);
  }

  const result = await authService.forgotPassword(email);
  res.json(result);
}));

// Reset Password (Verify Email OTP and reset)
router.post('/reset-password', catchAsync(async (req, res) => {
  const { email, otp, new_password } = req.body;
  if (!email) {
    throw ApiError.badRequest('Email is required');
  }
  if (!otp) {
    throw ApiError.badRequest('OTP is required');
  }
  if (!new_password) {
    throw ApiError.badRequest('New password is required');
  }

  const result = await authService.resetPassword(email, otp, new_password);
  res.json(result);
}));

// Bind Phone: Send OTP (Requires user to be authenticated)
router.post('/bind-phone/send-otp', requireAuth, catchAsync(async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10) {
    throw ApiError.badRequest('Phone must be 10 digits');
  }

  const { allowed, remaining } = checkAndRecord(`bind:${phone}`, 3, 600);
  if (!allowed) {
    throw new ApiError(429, `Too many requests. Retry in ${remaining}s.`);
  }

  const result = await authService.requestPhoneBindOtp(req.user._id.toString(), phone);
  res.json(result);
}));

// Bind Phone: Verify OTP and link (Requires user to be authenticated)
router.post('/bind-phone/verify', requireAuth, catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || phone.length !== 10) {
    throw ApiError.badRequest('Phone must be 10 digits');
  }
  if (!otp || otp.length !== 6) {
    throw ApiError.badRequest('OTP must be 6 digits');
  }

  const result = await authService.verifyPhoneBindOtp(req.user._id.toString(), phone, otp);
  res.json(result);
}));

module.exports = router;
