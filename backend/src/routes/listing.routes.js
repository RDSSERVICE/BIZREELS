const express = require('express');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const listingService = require('../services/listing.service');
const userService = require('../services/user.service');
const watchService = require('../services/watch.service');
const boostService = require('../services/boost.service');
const eventService = require('../services/event.service');
const { notTestFilter, catchAsync } = require('../utils/helpers');
const { checkAndRecord } = require('../utils/rateLimit');
const Listing = require('../models/Listing');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const isVendor = (user) => user && user.roles && user.roles.includes('vendor');
const isAdmin = (user) => user && user.roles && user.roles.includes('admin');

router.post('/', requireAuth, catchAsync(async (req, res) => {
  const becomeVendor = req.query.become_vendor === 'true';
  let user = req.user;

  if (!isVendor(user)) {
    if (!becomeVendor) {
      throw new ApiError(403, 'Add vendor role first. Retry with ?become_vendor=true to auto-add.');
    }
    await userService.addRole(user._id.toString(), 'vendor');
    user.roles = Array.from(new Set([...(user.roles || []), 'vendor']));
  }

  const result = await listingService.createListing(user._id.toString(), req.body);
  res.json(result);
}));

router.get('/', catchAsync(async (req, res) => {
  const filters = {
    type: req.query.type || null,
    category_id: req.query.category_id || null,
    sub_category_id: req.query.sub_category_id || null,
    vendor_id: req.query.vendor_id || null,
    status: req.query.status || null,
    q: req.query.q || null,
  };
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || 20, 10)));
  const cursor = req.query.cursor || null;

  const result = await listingService.listListings(filters, limit, cursor);
  res.json(result);
}));

router.get('/vendor/me', requireAuth, catchAsync(async (req, res) => {
  if (!isVendor(req.user)) {
    return res.json({ items: [] });
  }
  const items = await listingService.listByVendor(req.user._id.toString());
  res.json({ items });
}));

router.get('/vendor/me/boosted', requireAuth, catchAsync(async (req, res) => {
  const items = await boostService.listMyBoosted(req.user._id.toString());
  res.json({ items });
}));

router.get('/:slug', catchAsync(async (req, res) => {
  const { slug } = req.params;
  const data = await listingService.getBySlug(slug, true);

  // Background/asynchronous task: views increment
  listingService.incrementViews(slug).catch(() => {});

  res.json(data);
}));

router.patch('/:listing_id', requireAuth, catchAsync(async (req, res) => {
  const result = await listingService.updateListing(
    req.params.listing_id,
    req.user._id.toString(),
    req.body,
    isAdmin(req.user)
  );
  res.json(result);
}));

router.post('/:listing_id/status', requireAuth, catchAsync(async (req, res) => {
  const result = await listingService.setStatus(
    req.params.listing_id,
    req.user._id.toString(),
    req.body.status,
    isAdmin(req.user)
  );
  res.json(result);
}));

router.delete('/:listing_id', requireAuth, catchAsync(async (req, res) => {
  await listingService.softDelete(
    req.params.listing_id,
    req.user._id.toString(),
    isAdmin(req.user)
  );
  res.json({ success: true });
}));

router.post('/:listing_id/watch', catchAsync(async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10) {
    throw ApiError.badRequest('Phone must be 10 digits');
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
  const { allowed, remaining } = checkAndRecord(`watch:${ip}`, 5, 3600);
  if (!allowed) {
    throw new ApiError(429, `Too many requests. Try again in ${remaining} seconds.`);
  }

  const result = await watchService.addWatcher(req.params.listing_id, phone);
  res.json(result);
}));

router.post('/:listing_id/boost', requireAuth, catchAsync(async (req, res) => {
  const { duration_days, payment_method = 'credits' } = req.body;
  if (![3, 7, 14].includes(duration_days)) {
    throw ApiError.badRequest('duration_days must be 3, 7, or 14');
  }

  if (payment_method === 'credits') {
    const result = await boostService.boostWithCredits(req.user._id.toString(), req.params.listing_id, duration_days);
    return res.json(result);
  }

  const result = await boostService.boostWithInr(req.user._id.toString(), req.params.listing_id, duration_days);
  res.json(result);
}));

router.post('/:listing_id/track', optionalAuth, catchAsync(async (req, res) => {
  const { event } = req.body;
  if (!['share', 'wa_click', 'save'].includes(event)) {
    throw ApiError.badRequest('Invalid event type');
  }

  await eventService.emit({
    listing_id: req.params.listing_id,
    event_type: event,
    user_id: req.userId || null,
  });

  res.json({ ok: true });
}));

router.get('/vendor/:vendor_id/related', catchAsync(async (req, res) => {
  const { vendor_id } = req.params;
  const { exclude_listing_id } = req.query;
  const limit = Math.max(1, Math.min(24, parseInt(req.query.limit || 12, 10)));

  const q = {
    vendor_id,
    is_deleted: { $ne: true },
    status: 'active',
    is_takendown: { $ne: true },
    ...notTestFilter('title'),
  };

  if (exclude_listing_id) {
    q._id = { $ne: exclude_listing_id };
  }

  const docs = await Listing.find(q)
    .sort({ views_count: -1, _id: -1 })
    .limit(limit);

  res.json({
    items: docs.map(d => listingService.serialize(d)),
    vendor_id,
  });
}));

module.exports = router;
