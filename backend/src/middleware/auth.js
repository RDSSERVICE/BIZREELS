const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Authenticate incoming requests via JWT Bearer token or cookie.
 * Supports both token signing secrets and payload formats.
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ApiError.unauthorized('Access denied. No token provided.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.accessSecret);
    } catch {
      try {
        decoded = jwt.verify(token, config.jwtSecret);
      } catch {
        throw ApiError.unauthorized('Invalid or expired token.');
      }
    }

    const userId = decoded.userId || decoded.sub;
    const user = await User.findById(userId)
      .select('-password -__v')
      .lean();

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.');
    }

    if (user.is_active === false || user.isDeleted) {
      throw ApiError.unauthorized('This account has been deactivated.');
    }

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
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    const userRoles = req.user.roles || [];
    const activeRole = req.user.activeRole || req.user.current_role;

    const hasPermission = allowedRoles.some(
      (role) => userRoles.includes(role) || activeRole === role
    );

    if (!hasPermission) {
      return next(
        ApiError.forbidden(
          `Role "${activeRole}" is not authorized to access this resource. Required: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

module.exports = { authenticate, authorize };
