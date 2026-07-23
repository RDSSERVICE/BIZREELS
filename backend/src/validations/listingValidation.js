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
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Page number must be positive.'),
    query('limit')
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
    query('vendor')
      .optional({ checkFalsy: true })
      .isMongoId().withMessage('Invalid vendor ID.'),
    query('type')
      .optional({ checkFalsy: true })
      .isIn(['product', 'service']).withMessage('Type must be "product" or "service".'),
    query('category')
      .optional({ checkFalsy: true })
      .isString().withMessage('Category must be a string.'),
    query('search')
      .optional({ checkFalsy: true })
      .isString().withMessage('Search must be a string.'),
    query('minPrice')
      .optional({ checkFalsy: true })
      .isFloat({ min: 0 }).withMessage('Min price must be a positive number.'),
    query('maxPrice')
      .optional({ checkFalsy: true })
      .isFloat({ min: 0 }).withMessage('Max price must be a positive number.'),
    query('distance')
      .optional({ checkFalsy: true })
      .isFloat({ min: 0 }).withMessage('Distance must be a positive number.'),
    query('condition')
      .optional({ checkFalsy: true })
      .isIn(['new', 'refurbished', 'used', 'not_applicable']).withMessage('Invalid condition.'),
    query('status')
      .optional({ checkFalsy: true })
      .isString().withMessage('Status must be a string.'),
    query('rating')
      .optional({ checkFalsy: true })
      .isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5.'),
    query('lat')
      .optional({ checkFalsy: true })
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude coordinates.'),
    query('lng')
      .optional({ checkFalsy: true })
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude coordinates.'),
  ],
};

module.exports = listingValidation;
