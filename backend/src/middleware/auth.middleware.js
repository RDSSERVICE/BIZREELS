const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { decodeAccessToken } = require('../utils/jwt.utils');
const config = require('../config');
const User = require('../models/User');

/**
 * Require authentication middleware.
 * Supports both JWT token payload formats (sub / userId, jwtSecret / jwt.accessSecret).
 * Extracts JWT from Authorization header or cookies, verifies it, and attaches user to req.
 */
const requireAuth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ApiError.unauthorized('Missing bearer token');
    }

    let payload;
    try {
      payload = decodeAccessToken(token);
    } catch (err) {
      try {
        payload = jwt.verify(token, config.jwt.accessSecret);
      } catch (err2) {
        if (err.name === 'TokenExpiredError' || err2.name === 'TokenExpiredError') {
          throw ApiError.unauthorized('Access token expired');
        }
        throw ApiError.unauthorized('Invalid access token');
      }
    }

    const userId = payload.sub || payload.userId;
    if (!userId) {
      throw ApiError.unauthorized('Invalid token payload');
    }

    const user = await User.findById(userId);
    if (!user || user.is_active === false || user.isDeleted === true) {
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
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) {
      req.userId = null;
      return next();
    }
    let payload;
    try {
      payload = decodeAccessToken(token);
    } catch {
      try {
        payload = jwt.verify(token, config.jwt.accessSecret);
      } catch {
        payload = null;
      }
    }
    req.userId = payload ? (payload.sub || payload.userId) : null;
  } catch {
    req.userId = null;
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
