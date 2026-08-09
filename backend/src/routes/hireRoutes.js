const express = require('express');
const hireController = require('../controllers/hireController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Hire Routes — /api/v1/hires
 */

router.post('/', authenticate, hireController.create);
router.get('/', authenticate, hireController.getRequests);
router.patch('/:id', authenticate, hireController.updateStatus);
router.patch('/:id/edit', authenticate, hireController.edit);
router.patch('/:id/cancel', authenticate, hireController.cancel);
router.post('/campaign/:id/deliverable', authenticate, hireController.submitDeliverable);
router.patch('/campaign/:id/milestone/:milestoneId/approve', authenticate, hireController.approveMilestone);

module.exports = router;
