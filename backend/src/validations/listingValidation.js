const { body, param, query } = require('express-validator');

/**
 * Listing Validation rules configuration.
 */
const listingValidation = {
  create: [
    body('type')
      .isIn(['product', 'service']).withMessage('Listing type must be "product" or "service".'),
    body('title')
      .trim()
      .notEmpty().withMessage('Listing title is required.')
      .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters.'),
    body('category')
      .trim()
      .notEmpty().withMessage('Category selection is required.'),
    body('price')
      .isFloat({ min: 0 }).withMessage('Base price must be a positive number.'),
    body('salePrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Sale price must be a positive number.'),
    body('condition')
      .optional()
      .isIn(['new', 'refurbished', 'used', 'not_applicable']).withMessage('Invalid listing condition.'),
    body('lat')
      .optional()
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude.'),
    body('lng')
      .optional()
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude.'),
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid Listing ID.'),
    body('type')
      .optional()
      .isIn(['product', 'service']).withMessage('Listing type must be "product" or "service".'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters.'),
    body('price')
      .optional()
      .isFloat({ min: 0 }).withMessage('Base price must be a positive number.'),
    body('lat')
      .optional()
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude.'),
      body('lng')
      .optional()
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude.'),
  ],

  idParam: [
    param('id')
      .isMongoId().withMessage('Invalid Listing ID.'),
  ],

  queryListings: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page number must be positive.'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.'),
    query('lat')
      .optional()
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude coordinates.'),
    query('lng')
      .optional()
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude coordinates.'),
  ],
};

module.exports = listingValidation;
