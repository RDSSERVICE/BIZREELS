const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Centralized error handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || 'field';
    const label = field === 'phone' ? 'phone number' : field === 'email' ? 'email address' : field;
    message = `An account with this ${label} already exists. Please log in instead.`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Joi validation error
  if (err.isJoi) {
    statusCode = 422;
    message = 'Validation error';
    errors = err.details.map(d => ({
      field: d.path.join('.'),
      message: d.message,
    }));
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error('Server error:', { message: err.message, stack: err.stack, url: req.originalUrl });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
};

/**
 * 404 handler for unmatched routes.
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = { errorHandler, notFoundHandler };
