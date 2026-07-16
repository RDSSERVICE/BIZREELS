const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Authenticate incoming requests via JWT Bearer token.
 * Attaches the decoded user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Fallback: extract from httpOnly cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ApiError.unauthorized('Access denied. No token provided.');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    // Fetch user from DB (exclude password, include only needed fields)
    const user = await User.findById(decoded.userId)
      .select('-password -__v')
      .lean();

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.');
    }

    if (user.isDeleted) {
      throw ApiError.unauthorized('This account has been deactivated.');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    next(ApiError.unauthorized('Invalid or expired token.'));
  }
};

/**
 * Role-based access control middleware.
 * Checks if the user's activeRole is among allowed roles.
 *
 * Usage: authorize('vendor', 'admin')
 *
 * @param  {...string} allowedRoles
 * @returns {Function} Express middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    const userRole = req.user.activeRole;

    if (!allowedRoles.includes(userRole)) {
      return next(
        ApiError.forbidden(
          `Role "${userRole}" is not authorized to access this resource. Required: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

module.exports = { authenticate, authorize };
