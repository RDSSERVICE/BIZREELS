const express = require('express');
const reelController = require('../controllers/reelController');
const reelValidation = require('../validations/reelValidation');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Reels Routes — /api/v1/reels
 *
 * Public:
 *   GET /             - Get paginated Reels feed (nearby, creator, hashtag filters)
 *   GET /:id/comments - Get comments for a Reel
 *
 * Protected (Authenticate required):
 *   POST   /          - Publish a Reel (accepts multipart/form-data 'video')
 *   DELETE /:id       - Delete a Reel (creator-only verification inside service)
 *   POST   /:id/view  - Register a view count update
 *   POST   /:id/like  - Toggle like status on a Reel
 *   POST   /:id/comments - Post a new comment
 *   DELETE /comments/:commentId - Delete a comment
 */

// ── Public Feed and Comments ─────────────────────────────
router.get('/my-reels', authenticate, reelController.getMyReels);
router.get('/', reelValidation.getFeed, validate, (req, res, next) => {
  if (req.query.myReels || req.headers.authorization) {
    // If client asks for my-reels or has auth, try getMyReels if requested
    if (req.query.myReels === 'true') {
      return authenticate(req, res, () => reelController.getMyReels(req, res, next));
    }
  }
  return reelController.getFeed(req, res, next);
});
router.get('/:id/comments', reelValidation.idParam, validate, reelController.getComments);

// ── Protected Actions ────────────────────────────────────
router.post(
  '/',
  authenticate,
  upload.single('video'),
  reelValidation.publish,
  validate,
  reelController.publish
);

router.delete('/:id', authenticate, reelValidation.idParam, validate, reelController.deleteReel);
router.post('/:id/view', authenticate, reelValidation.idParam, validate, reelController.viewReel);
router.post('/:id/like', authenticate, reelValidation.idParam, validate, reelController.toggleLike);

router.post('/:id/comments', authenticate, reelValidation.comment, validate, reelController.addComment);
router.delete('/comments/:commentId', authenticate, reelValidation.commentParam, validate, reelController.deleteComment);

module.exports = router;
