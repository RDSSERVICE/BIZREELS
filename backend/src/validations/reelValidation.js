const { body, param, query } = require('express-validator');

/**
 * Reel validation rules configuration.
 */
const reelValidation = {
  publish: [
    body('caption')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 2200 }).withMessage('Caption cannot exceed 2200 characters.'),
    body('tags')
      .optional({ checkFalsy: true }),
    body('lat')
      .optional({ checkFalsy: true })
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude coordinates.'),
    body('lng')
      .optional({ checkFalsy: true })
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude coordinates.'),
    body('targetListing')
      .optional({ checkFalsy: true })
      .custom((val) => {
        if (!val || val === 'null') return true;
        return require('mongoose').Types.ObjectId.isValid(val);
      }).withMessage('Invalid target listing ID.'),
  ],

  getFeed: [
    query('page')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('Page number must be a positive integer.'),
    query('limit')
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.'),
    query('lat')
      .optional({ checkFalsy: true })
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude.'),
    query('lng')
      .optional({ checkFalsy: true })
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude.'),
  ],

  comment: [
    param('id')
      .isMongoId().withMessage('Invalid Reel ID.'),
    body('content')
      .trim()
      .notEmpty().withMessage('Comment content is required.')
      .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters.'),
  ],

  idParam: [
    param('id')
      .isMongoId().withMessage('Invalid Reel ID.'),
  ],

  commentParam: [
    param('commentId')
      .isMongoId().withMessage('Invalid Comment ID.'),
  ],
};

module.exports = reelValidation;
