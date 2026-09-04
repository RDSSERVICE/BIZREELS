const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const authValidation = require('../validations/authValidation');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * Auth Routes — /api/v1/auth
 *
 * Public:
 *   POST /register          - Email registration
 *   POST /login             - Email login
 *   POST /otp/request       - Request OTP
 *   POST /otp/verify        - Verify OTP & login
 *   POST /forgot-password   - Request password reset OTP
 *   POST /reset-password    - Reset password with OTP
 *   POST /refresh-token     - Refresh access token
 *   GET  /google            - Initiate Google OAuth
 *   GET  /google/callback   - Google OAuth callback
 *
 * Protected:
 *   GET    /me              - Get current user
 *   POST   /logout          - Logout (revoke current token)
 *   POST   /logout-all      - Logout from all devices
 *   PATCH  /switch-role     - Switch active role
 *   POST   /add-role        - Add a new role to account
 */

// ── Public Routes ─────────────────────────────────────────
router.post('/register', authLimiter, authValidation.register, validate, authController.register);
router.post('/login', authLimiter, authValidation.loginEmail, validate, authController.loginWithEmail);

// Dev override login to bypass admin OTP
const adminPhoneService = require('../services/admin-phone.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
router.post('/dev/admin-login', authLimiter, asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await adminPhoneService.devAdminLogin(token);

  if (result.refreshToken) {
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
  }

  return ApiResponse.ok(res, 'Admin override login successful.', {
    user: result.user,
    accessToken: result.accessToken,
    via: result.via,
  });
}));

// ── OTP Endpoints (Dual-Channel: SMS & WhatsApp) ─────────
router.post('/otp/send', authLimiter, authValidation.sendOtp, validate, authController.sendOtp);
router.post('/otp/resend', authLimiter, authValidation.resendOtp, validate, authController.resendOtp);
router.post('/otp/verify', authLimiter, authValidation.verifyOtp, validate, authController.verifyOtp);

// Legacy / Compatibility OTP Endpoints
router.post('/otp/request', authLimiter, authValidation.requestOtp, validate, authController.sendOtp);
router.post('/phone/send-otp', authLimiter, authValidation.sendPhoneOtp, validate, authController.sendOtp);
router.post('/phone/verify-otp', authLimiter, authValidation.verifyPhoneOtp, validate, authController.verifyOtp);
router.post('/send-otp', authLimiter, authController.sendOtp);
router.post('/verify-otp', authLimiter, authController.verifyOtp);

router.post('/forgot-password', authLimiter, authValidation.forgotPassword, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, authValidation.resetPassword, validate, authController.resetPassword);

router.post('/refresh-token', authController.refreshToken);
router.post('/refresh', authController.refreshToken);

// Google OAuth (General / Web)
router.get(
  '/google',
  (req, res, next) => {
    const config = require('../config');
    const redirectUri = req.query.redirect_uri || req.query.redirect || req.query.state || '';
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const callbackURL = config.google.callbackUrl || `${protocol}://${host}/api/v1/auth/google/callback`;
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      callbackURL,
      state: redirectUri,
    })(req, res, next);
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    const config = require('../config');
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const callbackURL = config.google.callbackUrl || `${protocol}://${host}/api/v1/auth/google/callback`;
    const targetState = req.query.state || req.query.redirect_uri || '';

    passport.authenticate('google', { session: false, callbackURL }, (err, user, info) => {
      if (err || !user) {
        const errorMsg = err?.message || info?.message || 'Google authentication failed';
        if (targetState && (targetState.includes('://') || targetState.startsWith('bizreel://') || targetState.startsWith('exp://'))) {
          const sep = targetState.includes('?') ? '&' : '?';
          return res.redirect(`${targetState}${sep}error=${encodeURIComponent(errorMsg)}`);
        }
        let clientUrl = process.env.CLIENT_URL || 'https://bizreels.in';
        clientUrl = clientUrl.replace(/\/+$/, '');
        return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(errorMsg)}`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  authController.googleCallback
);

// ── App-Specific Google OAuth & Direct Token Exchange ─────────
router.get(
  '/app/google',
  (req, res, next) => {
    const redirectUri = req.query.redirect_uri || req.query.redirect || req.query.state || 'bizreel://auth/callback';
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const callbackURL = `${protocol}://${host}/api/v1/auth/app/google/callback`;
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      callbackURL,
      state: redirectUri,
    })(req, res, next);
  }
);

router.get(
  '/app/google/callback',
  (req, res, next) => {
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const callbackURL = `${protocol}://${host}/api/v1/auth/app/google/callback`;
    const targetState = req.query.state || 'bizreel://auth/callback';

    passport.authenticate('google', { session: false, callbackURL }, (err, user, info) => {
      if (err || !user) {
        const errorMsg = err?.message || info?.message || 'Google authentication failed';
        const sep = targetState.includes('?') ? '&' : '?';
        return res.redirect(`${targetState}${sep}error=${encodeURIComponent(errorMsg)}`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  authController.googleCallback
);

// Direct Google ID Token / Profile Token Exchange (Mobile App & SDK)
router.post('/google/token', authLimiter, authController.googleTokenLogin);
router.post('/google/mobile', authLimiter, authController.googleTokenLogin);
router.post('/app/google', authLimiter, authController.googleTokenLogin);

// ── Protected Routes ──────────────────────────────────────
router.get('/me', authenticate, authController.getMe);
router.patch('/profile', authenticate, authController.updateProfile);
router.post('/users/:id/follow', authenticate, authController.follow);
router.post('/users/:id/unfollow', authenticate, authController.unfollow);
router.delete('/profile', authenticate, authController.deleteAccount);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.patch('/switch-role', authenticate, authValidation.switchRole, validate, authController.switchRole);
router.post('/add-role', authenticate, authValidation.addRole, validate, authController.addRole);

module.exports = router;
