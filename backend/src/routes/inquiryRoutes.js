const express = require('express');
const inquiryController = require('../controllers/inquiryController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, inquiryController.create);
router.get('/', authenticate, inquiryController.getInquiries);

module.exports = router;
