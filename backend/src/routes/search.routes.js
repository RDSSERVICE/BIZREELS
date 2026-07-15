const express = require('express');
const { optionalAuth } = require('../middleware/auth.middleware');
const searchService = require('../services/search.service');
const { catchAsync } = require('../utils/helpers');

const router = express.Router();

router.get('/', optionalAuth, catchAsync(async (req, res) => {
  const q = req.query.q || null;
  const category_id = req.query.category_id || null;
  const sub_category_id = req.query.sub_category_id || null;
  const type = req.query.type || null;
  const condition = req.query.condition || null;
  const price_min = req.query.price_min ? parseFloat(req.query.price_min) : null;
  const price_max = req.query.price_max ? parseFloat(req.query.price_max) : null;
  const is_negotiable = req.query.is_negotiable !== undefined ? req.query.is_negotiable === 'true' : null;
  const has_offer = req.query.has_offer !== undefined ? req.query.has_offer === 'true' : null;
  const lat = req.query.lat ? parseFloat(req.query.lat) : null;
  const lng = req.query.lng ? parseFloat(req.query.lng) : null;
  const radius = req.query.radius ? parseFloat(req.query.radius) : null;
  const sort = req.query.sort || 'recent';
  const cursor = req.query.cursor || null;
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || 20, 10)));

  const result = await searchService.searchListings({
    q,
    category_id,
    sub_category_id,
    type_: type,
    condition,
    price_min,
    price_max,
    is_negotiable,
    has_offer,
    lat,
    lng,
    radius_km: radius,
    sort,
    cursor,
    limit,
    userId: req.userId || null,
  });

  res.json(result);
}));

router.get('/suggest', catchAsync(async (req, res) => {
  const q = req.query.q || '';
  const result = await searchService.suggest(q);
  res.json(result);
}));

module.exports = router;
