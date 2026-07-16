const { body, query } = require('express-validator');

/**
 * Analytics Validation rules configuration.
 */
const analyticsValidation = {
  track: [
    body('type')
      .isIn(['reel_view', 'listing_click', 'profile_view', 'search_query', 'conversion'])
      .withMessage('Invalid analytics tracking event type.'),
    body('targetId')
      .optional()
      .isMongoId().withMessage('Invalid target entity ID.'),
    body('queryText')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Search query text is too long.'),
  ],

  querySummary: [
    query('type')
      .optional()
      .isIn(['reel_view', 'listing_click', 'profile_view', 'search_query', 'conversion'])
      .withMessage('Invalid analytics event type filter.'),
    query('targetId')
      .optional()
      .isMongoId().withMessage('Invalid target entity ID filter.'),
    query('startDate')
      .optional()
      .isISO8601().withMessage('Start date must be a valid ISO8601 date string.'),
    query('endDate')
      .optional()
      .isISO8601().withMessage('End date must be a valid ISO8601 date string.'),
  ],
};

module.exports = analyticsValidation;
