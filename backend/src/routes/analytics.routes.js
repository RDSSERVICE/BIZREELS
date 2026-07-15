const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const analyticsService = require('../services/analytics.service');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const requireVendor = (req, res, next) => {
  const roles = req.user.roles || [];
  if (!roles.includes('vendor') && !roles.includes('admin')) {
    return next(ApiError.forbidden('Vendor role required'));
  }
  next();
};

router.get('/overview', requireAuth, requireVendor, catchAsync(async (req, res) => {
  const range = req.query.range || '30d';
  if (!['7d', '30d', '90d', 'all'].includes(range)) {
    throw ApiError.badRequest('Invalid range query param');
  }

  const result = await analyticsService.overview(req.user._id.toString(), range);
  res.json(result);
}));

router.get('/listings', requireAuth, requireVendor, catchAsync(async (req, res) => {
  const range = req.query.range || '30d';
  const sort = req.query.sort || 'views';
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || 10, 10)));

  if (!['7d', '30d', '90d', 'all'].includes(range)) {
    throw ApiError.badRequest('Invalid range query param');
  }
  if (!['views', 'chats', 'deals', 'shares'].includes(sort)) {
    throw ApiError.badRequest('Invalid sort query param');
  }

  const result = await analyticsService.perListing(req.user._id.toString(), range, sort, limit);
  res.json(result);
}));

router.get('/timeseries', requireAuth, requireVendor, catchAsync(async (req, res) => {
  const range = req.query.range || '30d';
  const metric = req.query.metric || 'views';

  if (!['7d', '30d', '90d'].includes(range)) {
    throw ApiError.badRequest('Invalid range query param');
  }
  if (!['views', 'chats', 'deals', 'deals_completed'].includes(metric)) {
    throw ApiError.badRequest('Invalid metric query param');
  }

  const result = await analyticsService.timeseries(req.user._id.toString(), range, metric);
  res.json(result);
}));

router.get('/boost-roi', requireAuth, requireVendor, catchAsync(async (req, res) => {
  const { listing_id } = req.query;
  if (!listing_id) {
    throw ApiError.badRequest('listing_id is required');
  }

  const result = await analyticsService.boostRoi(req.user._id.toString(), listing_id);
  res.json(result);
}));

module.exports = router;
