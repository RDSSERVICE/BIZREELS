const rateLimit = require('express-rate-limit');
const config = require('../config');

// Bypass rate limiting in development mode to prevent local test blocks
const isDev = config.env === 'development';

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 attempts
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

module.exports = {
  apiLimiter,
  authLimiter,
};
