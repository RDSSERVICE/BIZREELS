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
  const { title, category_id, sub_category_id, category_name, sub_category_name, type, hints, video_url, audio_url, image_urls } = req.body;
  if (!title || title.length < 3 || title.length > 140) {
    throw ApiError.badRequest('Title must be between 3 and 140 characters');
  }
  if (!['new_product', 'old_product', 'service'].includes(type)) {
    throw ApiError.badRequest('Invalid listing type');
  }

  enforceRateLimit(req.user._id.toString(), 'gen-content', AI_RATE_LIMIT);

  let catName = category_name ? String(category_name).trim() : null;
  let subName = sub_category_name ? String(sub_category_name).trim() : null;

  if (category_id && typeof category_id === 'string' && category_id.match(/^[0-9a-fA-F]{24}$/)) {
    const c = await Category.findById(category_id).select('name');
    if (c) catName = c.name;
  }
  if (sub_category_id && typeof sub_category_id === 'string' && sub_category_id.match(/^[0-9a-fA-F]{24}$/)) {
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

// ============================================================ IMAGE GENERATION
router.post('/generate-image', requireAuth, requireVendor, catchAsync(async (req, res) => {
  const { prompt, width = 800, height = 800 } = req.body;
  if (!prompt || prompt.trim().length < 3) {
    throw ApiError.badRequest('Prompt must be at least 3 characters');
  }

  // 1. Fetch dynamic credit rate
  const { AppSettings } = require('../models/Admin');
  const walletService = require('../services/wallet.service');
  const logger = require('../utils/logger');
  let cost = 2;
  try {
    const rateSetting = await AppSettings.findOne({ key: 'credit_rates' }).lean();
    if (rateSetting && rateSetting.value && rateSetting.value.aiImage !== undefined) {
      cost = Number(rateSetting.value.aiImage);
    }
  } catch (err) {
    logger.error('Failed to fetch credit rates for AI Image check:', err);
  }

  // 2. Check vendor balance
  const wallet = await walletService.getOrCreateWallet(req.user._id);
  const balance = parseInt(wallet.credits || 0, 10);
  if (balance < cost) {
    throw new ApiError(
      402,
      `Insufficient credits (${balance} available; ${cost} needed) to generate an AI Image.`
    );
  }

  enforceRateLimit(req.user._id.toString(), 'gen-image', AI_RATE_LIMIT);

  // 3. Generate image
  const result = await aiService.generateAiImage(prompt, width, height);

  // 4. Debit credits on success
  try {
    await walletService.debit({
      userId: req.user._id,
      amount: cost,
      transactionType: 'ai_image_generation',
      reason: `${cost} Credits deducted for AI Image generation`,
      source: 'ai',
      meta: { prompt }
    });
  } catch (err) {
    logger.error('Error updating wallet credits for AI Image generation:', err);
  }

  res.json(result);
}));

router.post('/generate-reel', requireAuth, requireVendor, catchAsync(async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || prompt.trim().length < 3) {
    throw ApiError.badRequest('Prompt must be at least 3 characters');
  }

  // 1. Fetch dynamic credit rate
  const { AppSettings } = require('../models/Admin');
  const walletService = require('../services/wallet.service');
  const logger = require('../utils/logger');
  let cost = 15;
  try {
    const rateSetting = await AppSettings.findOne({ key: 'credit_rates' }).lean();
    if (rateSetting && rateSetting.value && rateSetting.value.aiVideo30s !== undefined) {
      cost = Number(rateSetting.value.aiVideo30s);
    }
  } catch (err) {
    logger.error('Failed to fetch credit rates for AI Reel check:', err);
  }

  // 2. Check vendor balance
  const wallet = await walletService.getOrCreateWallet(req.user._id);
  const balance = parseInt(wallet.credits || 0, 10);
  if (balance < cost) {
    throw new ApiError(
      402,
      `Insufficient credits (${balance} available; ${cost} needed) to generate an AI Reel.`
    );
  }

  enforceRateLimit(req.user._id.toString(), 'gen-reel', AI_RATE_LIMIT);

  // 3. Generate AI Reel script & image
  const result = await aiService.generateAiReel(prompt.trim());

  // 4. Debit credits on success
  try {
    await walletService.debit({
      userId: req.user._id,
      amount: cost,
      transactionType: 'ai_reel_generation',
      reason: `${cost} Credits deducted for AI Reel generation`,
      source: 'ai',
      meta: { prompt }
    });
  } catch (err) {
    logger.error('Error updating wallet credits for AI Reel generation:', err);
  }

  res.json(result);
}));

router.post('/generate-specifications', requireAuth, catchAsync(async (req, res) => {
  const { title, category, subcategory, requirementType, budget_min, budget_max, otherConditions } = req.body;
  if (!title || title.trim().length < 3) {
    throw ApiError.badRequest('Title must be at least 3 characters');
  }

  enforceRateLimit(req.user._id.toString(), 'gen-specs', AI_RATE_LIMIT);

  const result = await aiService.generateSpecifications(
    String(title).trim(),
    category ? String(category).trim() : 'General',
    subcategory ? String(subcategory).trim() : '',
    requirementType || 'product',
    budget_min ? Number(budget_min) : null,
    budget_max ? Number(budget_max) : null,
    otherConditions ? String(otherConditions).trim() : ''
  );

  res.json(result);
}));

router.post('/generate-description', requireAuth, catchAsync(async (req, res) => {
  const { prompt, type = 'service', category, subcategory, context = {} } = req.body;

  enforceRateLimit(req.user._id.toString(), 'gen-desc', LIGHT_LIMIT);

  const result = await aiService.generateDescription({
    prompt: prompt ? String(prompt).trim() : '',
    type: type || 'service',
    category: category ? String(category).trim() : '',
    subcategory: subcategory ? String(subcategory).trim() : '',
    context: typeof context === 'object' && context !== null ? context : {},
  });

  res.json({
    success: true,
    data: result,
    ...result,
  });
}));

module.exports = router;

