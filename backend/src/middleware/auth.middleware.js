const ApiError = require('../utils/ApiError');
const { decodeAccessToken } = require('../utils/jwt.utils');
const User = require('../models/User');

/**
 * Require authentication middleware.
 * Extracts JWT from Authorization header, verifies it, and attaches user to req.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing bearer token');
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = decodeAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Access token expired');
      }
      throw ApiError.unauthorized('Invalid access token');
    }

    if (payload.type !== 'access') {
      throw ApiError.unauthorized('Wrong token type');
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.is_active) {
      throw ApiError.unauthorized('User not found or disabled');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional auth — extracts user_id from token if present, does not throw.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.userId = null;
      return next();
    }
    const token = authHeader.split(' ')[1];
    const payload = decodeAccessToken(token);
    if (payload.type === 'access') {
      req.userId = payload.sub;
    }
  } catch {
    req.userId = null;
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
