const express = require('express');
const inquiryController = require('../controllers/inquiryController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, inquiryController.create);
router.get('/', authenticate, inquiryController.getInquiries);
router.patch('/:id/close', authenticate, inquiryController.close);
router.delete('/:id', authenticate, inquiryController.delete);

module.exports = router;
