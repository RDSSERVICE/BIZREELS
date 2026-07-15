const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const aiService = require('../services/ai.service');
const Category = require('../models/Category');
const Requirement = require('../models/Requirement');
const { checkAndRecord } = require('../utils/rateLimit');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const AI_RATE_LIMIT = 10;
const LIGHT_LIMIT = 20;
const HEAVY_LIMIT = 10;
const WINDOW = 3600; // 1 hour

const requireVendor = (req, res, next) => {
  const roles = req.user.roles || [];
  if (!roles.includes('vendor') && !roles.includes('admin')) {
    return next(ApiError.forbidden('Vendor role required'));
  }
  next();
};

const enforceRateLimit = (userId, bucket, limit) => {
  const { allowed, remaining } = checkAndRecord(`ai:${bucket}:${userId}`, limit, WINDOW);
  if (!allowed) {
    throw new ApiError(429, `AI rate limit hit (${bucket}) — try again in ${remaining}s`);
  }
};

// ============================================================ CONTENT GENERATION
router.post('/generate-listing-content', requireAuth, requireVendor, catchAsync(async (req, res) => {
  const { title, category_id, sub_category_id, type, hints, video_url, audio_url, image_urls } = req.body;
  if (!title || title.length < 3 || title.length > 140) {
    throw ApiError.badRequest('Title must be between 3 and 140 characters');
  }
  if (!['new_product', 'old_product', 'service'].includes(type)) {
    throw ApiError.badRequest('Invalid listing type');
  }

  enforceRateLimit(req.user._id.toString(), 'gen-content', AI_RATE_LIMIT);

  let catName = null;
  let subName = null;

  if (category_id) {
    const c = await Category.findById(category_id).select('name');
    if (c) catName = c.name;
  }
  if (sub_category_id) {
    const sc = await Category.findById(sub_category_id).select('name');
    if (sc) subName = sc.name;
  }

  const result = await aiService.generateListingContent(
    String(title).trim(),
    catName,
    subName,
    type,
    hints ? String(hints).trim() : null,
    (video_url || audio_url || (image_urls && image_urls.length > 0)) ? {
      video_url: video_url || null,
      audio_url: audio_url || null,
      image_urls: image_urls || [],
    } : null
  );

  res.json(result);
}));

router.post('/transcribe-audio', requireAuth, catchAsync(async (req, res) => {
  const { audio_url } = req.body;
  if (!audio_url || audio_url.length > 800) {
    throw ApiError.badRequest('Invalid audio_url');
  }

  enforceRateLimit(req.user._id.toString(), 'transcribe', HEAVY_LIMIT);
  const result = await aiService.transcribeAudio(audio_url);
  res.json(result);
}));

router.post('/improve-description', requireAuth, requireVendor, catchAsync(async (req, res) => {
  const { listing_id, current_description, title, tone = 'friendly' } = req.body;
  if (!title || title.length < 1 || title.length > 200) {
    throw ApiError.badRequest('Title must be between 1 and 200 characters');
  }

  enforceRateLimit(req.user._id.toString(), 'improve', AI_RATE_LIMIT);

  let current = String(current_description || '').trim();
  let finalTitle = String(title).trim();

  if (listing_id) {
    const Listing = require('../models/Listing');
    const li = await Listing.findOne({ _id: listing_id, is_deleted: { $ne: true } });
    if (!li) {
      throw ApiError.notFound('Listing not found');
    }
    const roles = req.user.roles || [];
    if (!roles.includes('admin') && li.vendor_id.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('Not your listing');
    }
    current = current || li.description || '';
    finalTitle = finalTitle || li.title || '';
  }

  if (!current) {
    throw ApiError.badRequest('No description provided or found on listing');
  }

  const result = await aiService.improveDescription(current, finalTitle, tone);
  res.json(result);
}));

// ============================================================ SMART FEATURES
router.post('/generate-title', requireAuth, requireVendor, catchAsync(async (req, res) => {
  const { listing_type, description, category_hint, image_urls } = req.body;
  if (!['new_product', 'old_product', 'service'].includes(listing_type)) {
    throw ApiError.badRequest('Invalid listing type');
  }

  enforceRateLimit(req.user._id.toString(), 'title', LIGHT_LIMIT);

  const result = await aiService.generateTitles(
    description ? String(description).trim() : null,
    category_hint ? String(category_hint).trim() : null,
    listing_type,
    image_urls || null
  );
  res.json(result);
}));

router.post('/detect-category', requireAuth, catchAsync(async (req, res) => {
  const { title, description, image_urls } = req.body;
  if (!title && !description && (!image_urls || image_urls.length === 0)) {
    throw ApiError.badRequest('Provide title, description, or image_urls');
  }

  enforceRateLimit(req.user._id.toString(), 'category', LIGHT_LIMIT);

  const result = await aiService.detectCategory(
    title ? String(title).trim() : null,
    description ? String(description).trim() : null,
    image_urls || null
  );
  res.json(result);
}));

router.post('/parse-demand', requireAuth, catchAsync(async (req, res) => {
  const { text } = req.body;
  if (!text || text.length < 3 || text.length > 1000) {
    throw ApiError.badRequest('Text must be between 3 and 1000 characters');
  }

  enforceRateLimit(req.user._id.toString(), 'demand', HEAVY_LIMIT);

  const result = await aiService.parseDemand(String(text).trim());
  res.json(result);
}));

router.post('/match-vendors', requireAuth, catchAsync(async (req, res) => {
  const { requirement_id, category_id, sub_category_id, city, price_max, must_have_features, description, limit = 10 } = req.body;

  enforceRateLimit(req.user._id.toString(), 'match', HEAVY_LIMIT);

  let catId = category_id;
  let subId = sub_category_id;
  let finalCity = city;
  let finalPriceMax = price_max;
  let mustHave = must_have_features || [];
  let finalDescription = description ? String(description).trim() : '';

  if (requirement_id) {
    const r = await Requirement.findOne({ _id: requirement_id, is_deleted: { $ne: true } });
    if (!r) {
      throw ApiError.notFound('Requirement not found');
    }
    catId = catId || r.category_id?.toString();
    subId = subId || r.sub_category_id?.toString();
    finalCity = finalCity || r.location?.city || r.city;
    finalPriceMax = finalPriceMax || r.budget_max || r.budget;
    mustHave = mustHave.length > 0 ? mustHave : (r.must_have_features || []);
    finalDescription = finalDescription || r.description || r.title || '';
  }

  if (!finalDescription) {
    throw ApiError.badRequest('description or requirement_id required');
  }

  const result = await aiService.matchVendors(
    catId,
    subId,
    finalCity,
    finalPriceMax,
    mustHave,
    finalDescription,
    Math.max(1, Math.min(20, parseInt(limit, 10)))
  );

  res.json(result);
}));

router.post('/suggest-price', requireAuth, catchAsync(async (req, res) => {
  const { title, description, category_id, sub_category_id, condition, city, listing_type } = req.body;
  if (!title || title.length < 3 || title.length > 200) {
    throw ApiError.badRequest('Title must be between 3 and 200 characters');
  }
  if (!['new_product', 'old_product', 'service'].includes(listing_type)) {
    throw ApiError.badRequest('Invalid listing type');
  }

  enforceRateLimit(req.user._id.toString(), 'price', LIGHT_LIMIT);

  const result = await aiService.suggestPrice(
    String(title).trim(),
    String(description || '').trim(),
    category_id,
    sub_category_id,
    condition,
    city,
    listing_type
  );

  res.json(result);
}));

router.post('/negotiate', requireAuth, catchAsync(async (req, res) => {
  const { deal_id, thread_id, direction = 'buyer', ask = 'write_message' } = req.body;
  if (!deal_id && !thread_id) {
    throw ApiError.badRequest('Provide deal_id or thread_id');
  }
  if (!['buyer', 'seller'].includes(direction)) {
    throw ApiError.badRequest('direction must be buyer or seller');
  }
  if (!['suggest_counter', 'write_message', 'analyze_situation'].includes(ask)) {
    throw ApiError.badRequest('Invalid ask type');
  }

  enforceRateLimit(req.user._id.toString(), 'negotiate', HEAVY_LIMIT);

  const result = await aiService.negotiationHelper(
    deal_id,
    thread_id,
    direction,
    ask,
    req.user._id.toString()
  );

  res.json(result);
}));

module.exports = router;
