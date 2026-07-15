const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const interactionService = require('../services/interaction.service');
const { catchAsync } = require('../utils/helpers');

const router = express.Router();

router.post('/listings/:listing_id/like', requireAuth, catchAsync(async (req, res) => {
  const result = await interactionService.toggle(req.user._id.toString(), req.params.listing_id, 'like');
  res.json(result);
}));

router.post('/listings/:listing_id/save', requireAuth, catchAsync(async (req, res) => {
  const result = await interactionService.toggle(req.user._id.toString(), req.params.listing_id, 'save');
  res.json(result);
}));

router.get('/interactions/me/saved', requireAuth, catchAsync(async (req, res) => {
  const items = await interactionService.myListingsByType(req.user._id.toString(), 'save');
  res.json({ items });
}));

router.get('/interactions/me/liked', requireAuth, catchAsync(async (req, res) => {
  const items = await interactionService.myListingsByType(req.user._id.toString(), 'like');
  res.json({ items });
}));

module.exports = router;
