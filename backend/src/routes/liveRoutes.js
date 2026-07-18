const express = require('express');
const liveController = require('../controllers/liveController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * Live Broadcast Routes — /api/v1/live
 */

router.get('/', authenticate, liveController.getActiveStreams);
router.post('/', authenticate, authorize('vendor', 'creator', 'admin'), liveController.create);
router.post('/:id/end', authenticate, liveController.end);
router.post('/:id/join', authenticate, liveController.join);
router.post('/:id/leave', authenticate, liveController.leave);
router.post('/:id/like', authenticate, liveController.like);
router.post('/:id/comment', authenticate, liveController.comment);

module.exports = router;
