const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to check express-validator results.
 * If validation errors exist, throws a structured ApiError.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    const detailMsg = extractedErrors.map((e) => e.message).join(' | ');
    throw ApiError.badRequest(`Validation failed: ${detailMsg}`, extractedErrors);
  }
  next();
};

module.exports = validate;
