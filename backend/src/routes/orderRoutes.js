const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, orderController.create);
router.get('/', authenticate, orderController.getOrders);
router.patch('/:id/cancel', authenticate, orderController.cancel);

module.exports = router;
