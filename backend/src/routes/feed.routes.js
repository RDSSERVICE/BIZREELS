const express = require('express');
const { optionalAuth } = require('../middleware/auth.middleware');
const feedService = require('../services/feed.service');
const { catchAsync } = require('../utils/helpers');

const router = express.Router();

router.get('/', optionalAuth, catchAsync(async (req, res) => {
  const type = req.query.type || 'all';
  const lat = req.query.lat ? parseFloat(req.query.lat) : null;
  const lng = req.query.lng ? parseFloat(req.query.lng) : null;
  const radius = req.query.radius || 'any';
  const cursor = req.query.cursor || null;
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 50, 10)));

  let radiusKm = null;
  if (radius && radius.toLowerCase() !== 'any' && radius.toLowerCase() !== 'all') {
    radiusKm = parseFloat(radius);
    if (isNaN(radiusKm)) {
      radiusKm = null;
    }
  }

  const result = await feedService.buildFeed({
    type,
    lat,
    lng,
    radiusKm,
    cursor,
    limit,
    userId: req.userId || null,
  });

  res.json(result);
}));

router.get('/reels', optionalAuth, catchAsync(async (req, res) => {
  const lat = req.query.lat ? parseFloat(req.query.lat) : null;
  const lng = req.query.lng ? parseFloat(req.query.lng) : null;
  const radius = req.query.radius || 'any';
  const cursor = req.query.cursor || null;
  const limit = Math.max(1, Math.min(30, parseInt(req.query.limit || 15, 10)));

  let radiusKm = null;
  if (radius.toLowerCase() !== 'any') {
    radiusKm = parseFloat(radius);
    if (isNaN(radiusKm)) {
      radiusKm = null;
    }
  }

  const result = await feedService.buildFeed({
    type: 'all',
    reelsOnly: true,
    lat,
    lng,
    radiusKm,
    cursor,
    limit,
    userId: req.userId || null,
  });

  res.json(result);
}));

router.get('/home-trending', catchAsync(async (req, res) => {
  const result = await feedService.getHomeTrendingFeed();
  res.json({
    success: true,
    data: result
  });
}));

module.exports = router;
