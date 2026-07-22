const { body, param, query } = require('express-validator');

/**
 * Requirement & Quotes Validation configuration.
 */
const requirementValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Requirement title is required.')
      .isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters.'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description context is required.')
      .isLength({ max: 1500 }).withMessage('Description cannot exceed 1500 characters.'),
    body('category')
      .trim()
      .notEmpty().withMessage('Category selection is required.'),
    body('budget')
      .isFloat({ min: 1 }).withMessage('Budget estimate must be a positive number.'),
    body('deadline')
      .optional()
      .isISO8601().toDate().withMessage('Fulfillment deadline must be a valid date.'),
    body('lat')
      .optional()
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude coordinates.'),
    body('lng')
      .optional()
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude coordinates.'),
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid Requirement ID.'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters.'),
    body('budget')
      .optional()
      .isFloat({ min: 1 }).withMessage('Budget estimate must be a positive number.'),
  ],

  idParam: [
    param('id')
      .isMongoId().withMessage('Invalid ID reference.'),
  ],

  createQuote: [
    body('requirementId')
      .isMongoId().withMessage('Invalid Requirement ID.'),
    body('price')
      .isFloat({ min: 1 }).withMessage('Bid quote price must be greater than zero.'),
    body('estimatedDelivery')
      .isISO8601().toDate().withMessage('Estimated delivery must be a valid date.'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters.'),
  ],

  quoteParam: [
    param('quoteId')
      .isMongoId().withMessage('Invalid Quote ID.'),
  ],

  quoteStatus: [
    param('quoteId')
      .isMongoId().withMessage('Invalid Quote ID.'),
    body('status')
      .isIn(['accepted', 'rejected']).withMessage('Status must be "accepted" or "rejected".'),
  ],

  queryRequirements: [
    query('page')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Page must be positive integer.'),
    query('lat')
      .optional({ checkFalsy: true })
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid coordinates.'),
    query('lng')
      .optional({ checkFalsy: true })
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid coordinates.'),
  ],
};

module.exports = requirementValidation;
