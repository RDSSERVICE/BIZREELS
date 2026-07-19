const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Global error-handling middleware.
 * Catches all errors thrown or passed via next(err).
 *
 * In development: full stack traces returned.
 * In production: only operational errors expose details.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  // ── Mongoose Bad ObjectId ───────────────────────────────
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // ── Mongoose Duplicate Key ──────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    error = ApiError.conflict(`Duplicate value for field: ${field}`);
  }

  // ── Mongoose Validation Error ───────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest('Validation failed', messages);
  }

  // ── JWT Errors ──────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token. Please log in again.');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired. Please log in again.');
  }

  // ── Mongoose / MongoDB Network & Timeout Errors ────────
  if (err.name === 'MongoNetworkTimeoutError' || err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    error = ApiError.serviceUnavailable('Database service temporarily unavailable or timed out. Please try again.');
  }

  // ── Determine status code ──────────────────────────────
  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational !== undefined ? error.isOperational : false;

  // ── Log ─────────────────────────────────────────────────
  if (statusCode >= 500 || !isOperational) {
    logger.error('Unhandled Error:', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      service: 'error-handler',
    });
  } else {
    logger.warn('Operational Error:', {
      message: error.message,
      statusCode,
      url: req.originalUrl,
      method: req.method,
      service: 'error-handler',
    });
  }

  // ── Response ────────────────────────────────────────────
  const response = {
    success: false,
    message: error.message || 'Internal Server Error',
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
