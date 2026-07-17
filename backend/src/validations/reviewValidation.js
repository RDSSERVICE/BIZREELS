const { body, param, query } = require('express-validator');

/**
 * Review Validation rules configuration.
 */
const reviewValidation = {
  create: [
    body('rating')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Comment details cannot exceed 1000 characters.'),
    body('targetUserId')
      .optional()
      .isMongoId().withMessage('Invalid target user ID.'),
    body('targetListingId')
      .optional()
      .isMongoId().withMessage('Invalid target listing ID.'),
    // Custom check: one of targetUserId or targetListingId must be present
    body().custom((value) => {
      if (!value.targetUserId && !value.targetListingId) {
        throw new Error('Either a target user ID or listing ID must be selected to leave a review.');
      }
      return true;
    }),
  ],

  idParam: [
    param('id')
      .isMongoId().withMessage('Invalid Review ID.'),
  ],

  queryReviews: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page number must be positive.'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.'),
  ],
};

module.exports = reviewValidation;
