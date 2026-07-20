const express = require('express');
const creatorController = require('../controllers/creatorController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Creator Studio Routes — /api/v1/creator
 */

router.get('/dashboard', authenticate, creatorController.getDashboard);

router.get('/portfolio', authenticate, creatorController.getPortfolio);
router.post('/portfolio/reels', authenticate, creatorController.addPortfolioReel);
router.post('/portfolio/images', authenticate, creatorController.addPortfolioImage);
router.delete('/portfolio/:type/:id', authenticate, creatorController.deletePortfolioItem);

router.get('/pricing', authenticate, creatorController.getPricing);
router.patch('/pricing', authenticate, creatorController.updatePricing);

router.get('/availability', authenticate, creatorController.getAvailability);
router.patch('/availability', authenticate, creatorController.updateAvailability);

router.get('/orders', authenticate, creatorController.getOrders);
router.patch('/orders/:id/status', authenticate, creatorController.updateOrderStatus);

module.exports = router;
