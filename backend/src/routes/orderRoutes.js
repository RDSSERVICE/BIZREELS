const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, orderController.create);
router.get('/', authenticate, orderController.getOrders);
router.get('/vendor/me', authenticate, orderController.getVendorOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.patch('/:id/status', authenticate, orderController.updateStatus);
router.put('/:id/status', authenticate, orderController.updateStatus);
router.patch('/:id/cancel', authenticate, orderController.cancel);
router.patch('/:id', authenticate, orderController.updateStatus);
router.put('/:id', authenticate, orderController.updateStatus);

module.exports = router;
