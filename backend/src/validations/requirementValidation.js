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
      .optional()
      .isFloat({ min: 0 }).withMessage('Budget estimate must be a positive number.'),
    body('budget_min')
      .optional()
      .isFloat({ min: 0 }).withMessage('Minimum budget must be a positive number.'),
    body('budget_max')
      .optional()
      .isFloat({ min: 0 }).withMessage('Maximum budget must be a positive number.'),
    body('quantity')
      .optional()
      .isInt({ min: 1 }).withMessage('Quantity must be a positive integer.'),
    body('subcategory')
      .optional()
      .trim(),
    body('city')
      .optional()
      .trim(),
    body('state')
      .optional()
      .trim(),
    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters.'),
    body('deadline')
      .optional()
      .isISO8601().toDate().withMessage('Fulfillment deadline must be a valid date.'),
    body('lat')
      .optional()
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude coordinates.'),
    body('lng')
      .optional()
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude coordinates.'),
    body('detailedSpecifications')
      .optional()
      .trim()
      .isLength({ max: 3000 }).withMessage('Detailed specifications cannot exceed 3000 characters.'),
    body('expectedDeliveryDate')
      .optional()
      .isISO8601().toDate().withMessage('Expected delivery date must be a valid date.'),
    body('expectedDeliveryTime')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Delivery time cannot exceed 50 characters.'),
    body('productCondition')
      .optional()
      .isIn(['new', 'used', 'refurbished', 'other', null, '']).withMessage('Invalid product condition.'),
    body('customProductCondition')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Custom condition cannot exceed 100 characters.'),
    body('serviceModel')
      .optional()
      .isIn(['onsite', 'remote', 'hybrid', 'other', null, '']).withMessage('Invalid service model.'),
    body('customServiceModel')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Custom service model cannot exceed 100 characters.'),
    body('customCategory')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Custom category cannot exceed 100 characters.'),
    body('customSubcategory')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Custom subcategory cannot exceed 100 characters.'),
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
      .isFloat({ min: 0 }).withMessage('Budget estimate must be a positive number.'),
    body('budget_min')
      .optional()
      .isFloat({ min: 0 }).withMessage('Minimum budget must be a positive number.'),
    body('budget_max')
      .optional()
      .isFloat({ min: 0 }).withMessage('Maximum budget must be a positive number.'),
    body('detailedSpecifications')
      .optional()
      .trim()
      .isLength({ max: 3000 }).withMessage('Detailed specifications cannot exceed 3000 characters.'),
    body('expectedDeliveryDate')
      .optional()
      .isISO8601().toDate().withMessage('Expected delivery date must be a valid date.'),
    body('expectedDeliveryTime')
      .optional()
      .trim(),
    body('productCondition')
      .optional()
      .isIn(['new', 'used', 'refurbished', 'other', null, '']).withMessage('Invalid product condition.'),
    body('serviceModel')
      .optional()
      .isIn(['onsite', 'remote', 'hybrid', 'other', null, '']).withMessage('Invalid service model.'),
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
    query('approvalStatus')
      .optional()
      .isIn(['pending_approval', 'approved', 'rejected']).withMessage('Invalid approval status.'),
  ],
};

module.exports = requirementValidation;
