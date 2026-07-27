const express = require('express');
const creatorMarketplaceController = require('../controllers/creatorMarketplaceController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Creator Marketplace Routes
 * Base prefix: /api/v1/creator-marketplace
 */

// Discover creators listing
router.get('/discover', authenticate, creatorMarketplaceController.discover);

// Get distinct cities of available creators
router.get('/cities', authenticate, creatorMarketplaceController.getCities);

// Get distinct categories of creators
router.get('/categories', authenticate, creatorMarketplaceController.getCategories);

// Get complete creator profile for details rendering
router.get('/:id/profile', authenticate, creatorMarketplaceController.getCreatorProfile);

module.exports = router;
