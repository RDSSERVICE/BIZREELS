const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const authValidation = require('../validations/authValidation');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

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
router.post('/register', authValidation.register, validate, authController.register);
router.post('/login', authValidation.loginEmail, validate, authController.loginWithEmail);

router.post('/otp/request', authValidation.requestOtp, validate, authController.requestOtp);
router.post('/otp/verify', authValidation.verifyOtp, validate, authController.verifyOtp);

router.post('/forgot-password', authValidation.forgotPassword, validate, authController.forgotPassword);
router.post('/reset-password', authValidation.resetPassword, validate, authController.resetPassword);

router.post('/refresh-token', authController.refreshToken);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  authController.googleCallback
);

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
