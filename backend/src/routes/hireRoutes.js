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

module.exports = router;
