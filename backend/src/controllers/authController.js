const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * AuthController
 * HTTP request handlers for authentication endpoints.
 * Thin layer: delegates all logic to AuthService.
 */
class AuthController {
  // ── Register ────────────────────────────────────────────
  register = asyncHandler(async (req, res) => {
    const { name, email, phone, password, role } = req.body;
    const result = await authService.registerWithEmail({ name, email, phone, password, role }, req);

    this._setRefreshTokenCookie(res, result.refreshToken);

    return ApiResponse.created(res, 'Registration successful.', {
      user: result.user,
      accessToken: result.accessToken,
    });
  });

  // ── Email Login ─────────────────────────────────────────
  loginWithEmail = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;
    const result = await authService.loginWithEmail({ email, password, role }, req);

    this._setRefreshTokenCookie(res, result.refreshToken);

    return ApiResponse.ok(res, 'Login successful.', {
      user: result.user,
      accessToken: result.accessToken,
    });
  });

  // ── Request OTP ─────────────────────────────────────────
  requestOtp = asyncHandler(async (req, res) => {
    const identifier = req.body.phone || req.body.identifier;
    const identifierType = req.body.identifierType || (req.body.phone ? 'phone' : 'email');
    const result = await authService.requestOtp(identifier, identifierType, req.body.purpose || 'login');

    return ApiResponse.ok(res, result.message, {
      expiresInMinutes: result.expiresInMinutes,
      otp: result.otp,
    });
  });

  // ── Verify OTP & Login ──────────────────────────────────
  verifyOtp = asyncHandler(async (req, res) => {
    const identifier = req.body.phone || req.body.identifier;
    const identifierType = req.body.identifierType || (req.body.phone ? 'phone' : 'email');
    const { otp } = req.body;
    const result = await authService.verifyOtpAndLogin(identifier, identifierType, otp, req);

    this._setRefreshTokenCookie(res, result.refreshToken);

    return ApiResponse.ok(res, 'OTP verified. Login successful.', {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  });

  // ── Google OAuth Callback ───────────────────────────────
  googleCallback = asyncHandler(async (req, res) => {
    // req.user is set by Passport.js after Google OAuth
    const result = await authService.googleOAuthCallback(req.user, req);

    this._setRefreshTokenCookie(res, result.refreshToken);

    // Redirect to frontend with access token
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?accessToken=${result.accessToken}`;
    return res.redirect(redirectUrl);
  });

  // ── Refresh Token ───────────────────────────────────────
  refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required.' });
    }

    const result = await authService.refreshAccessToken(refreshToken, req);

    this._setRefreshTokenCookie(res, result.refreshToken);

    return ApiResponse.ok(res, 'Token refreshed.', {
      user: result.user,
      accessToken: result.accessToken,
    });
  });

  // ── Logout ──────────────────────────────────────────────
  logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    await authService.logout(refreshToken, req.user._id, req);

    res.clearCookie('refreshToken');

    return ApiResponse.ok(res, 'Logged out successfully.');
  });

  // ── Logout All Devices ──────────────────────────────────
  logoutAll = asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user._id, req);

    res.clearCookie('refreshToken');

    return ApiResponse.ok(res, 'Logged out from all devices.');
  });

  // ── Forgot Password ────────────────────────────────────
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    return ApiResponse.ok(res, result.message);
  });

  // ── Reset Password ─────────────────────────────────────
  resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword(email, otp, newPassword, req);

    return ApiResponse.ok(res, result.message);
  });

  // ── Switch Role ─────────────────────────────────────────
  switchRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const user = await authService.switchRole(req.user._id, role, req);

    return ApiResponse.ok(res, `Switched to ${role} role.`, { user });
  });

  // ── Add Role ────────────────────────────────────────────
  addRole = asyncHandler(async (req, res) => {
    const { role, profileData } = req.body;
    const user = await authService.addRole(req.user._id, role, profileData, req);

    return ApiResponse.ok(res, `${role} role activated.`, { user });
  });

  // ── Get Current User ───────────────────────────────────
  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user._id);

    return ApiResponse.ok(res, 'User profile fetched.', { user });
  });

  // ── Update Profile ─────────────────────────────────────
  updateProfile = asyncHandler(async (req, res) => {
    const { name, avatarUrl, phone, gender, occupation, dob, language, location, vendorProfile, creatorProfile } = req.body;
    const user = await authService.updateProfile(req.user._id, { name, avatarUrl, phone, gender, occupation, dob, language, location, vendorProfile, creatorProfile }, req);

    return ApiResponse.ok(res, 'Profile updated successfully.', { user });
  });

  // ── Delete Account ─────────────────────────────────────
  deleteAccount = asyncHandler(async (req, res) => {
    const result = await authService.deleteAccount(req.user._id, req);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return ApiResponse.ok(res, 'Account deleted successfully.', result);
  });

  // ── Follow User ────────────────────────────────────────
  follow = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await authService.followUser(req.user._id, id, req);
    return ApiResponse.ok(res, 'Followed user successfully.', { user });
  });

  // ── Unfollow User ──────────────────────────────────────
  unfollow = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await authService.unfollowUser(req.user._id, id, req);
    return ApiResponse.ok(res, 'Unfollowed user successfully.', { user });
  });

  // ── Private: Set Refresh Token Cookie ───────────────────
  _setRefreshTokenCookie(res, refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth',
    });
  }
}

module.exports = new AuthController();
