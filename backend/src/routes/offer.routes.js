const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const Offer = require('../models/Offer');
const User = require('../models/User');
const { AuditLog } = require('../models/Misc');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const { emitToRole, emitToAdmin } = require('../sockets');
const { activateOfferAndNotify } = require('../jobs/offerScheduler');

const router = express.Router();

// Auto-invalidate active offers cache on admin mutations
router.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.path.includes('/admin')) {
    try {
      const cache = require('../utils/cache');
      await cache.incrCache('offers:version');
    } catch (err) {}
  }
  next();
});

// Middleware to check for Admin role
const requireAdmin = (req, res, next) => {
  const roles = req.user.roles || [];
  if (!roles.includes('admin')) {
    return next(ApiError.forbidden('Admin authorization required.'));
  }
  next();
};

// ============================================================ CLIENT PORTAL ENDPOINTS

/**
 * GET /offers/active
 * Returns all currently active offers applicable to the logged-in user's roles.
 */
router.get('/active', requireAuth, catchAsync(async (req, res) => {
  // Use activeRole if available, fallback to roles array, default to 'customer'
  const userRoles = req.user.roles || [req.user.activeRole || 'customer'];

  const cache = require('../utils/cache');
  const version = await cache.getCache('offers:version') || 1;
  const rolesKey = [...userRoles].sort().join(',');
  const cacheKey = `offers:active:v${version}:${rolesKey}`;

  let mappedOffers = await cache.getCache(cacheKey);

  if (!mappedOffers) {
    const offers = await Offer.find({
      targetRoles: { $in: userRoles },
      status: 'Active',
      isDeleted: { $ne: true }
    }).sort({ priority: -1, created_at: -1 }).lean();

    mappedOffers = offers.map(o => ({
      id: o._id.toString(),
      title: o.title,
      description: o.description,
      code: o.code || '',
      discountType: o.discountType,
      discountValue: o.discountValue,
      minOrderAmount: o.minOrderAmount,
      maxDiscountLimit: o.maxDiscountLimit,
      endTime: o.endTime,
      image: o.image,
      terms: o.terms,
      applicableCategories: o.applicableCategories,
      applicableProducts: o.applicableProducts,
      applicableServices: o.applicableServices
    }));

    await cache.setCache(cacheKey, mappedOffers, 1800); // cache active offers for 30 minutes

    // Update viewsCount in analytics asynchronously in background
    if (offers.length > 0) {
      const offerIds = offers.map(o => o._id);
      Offer.updateMany(
        { _id: { $in: offerIds } },
        { $inc: { 'analytics.viewsCount': 1 } }
      ).catch(err => console.error('Non-blocking offer views count update failed:', err));
    }
  }

  res.json({
    success: true,
    items: mappedOffers
  });
}));

/**
 * POST /offers/:id/click
 * Registers a click on an offer card for analytics.
 */
router.post('/:id/click', requireAuth, catchAsync(async (req, res) => {
  const offer = await Offer.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    { $inc: { 'analytics.clicksCount': 1 } },
    { returnDocument: 'after' }
  );

  if (!offer) {
    throw ApiError.notFound('Offer not found.');
  }

  res.json({ success: true });
}));


/**
 * POST /offers/validate-coupon
 * Validates a coupon code against active platform and vendor offers.
 */
router.post('/validate-coupon', requireAuth, catchAsync(async (req, res) => {
  const { couponCode, orderAmount = 0, vendorId, listingId } = req.body;

  if (!couponCode || typeof couponCode !== 'string' || !couponCode.trim()) {
    throw ApiError.badRequest('Please enter a coupon code.');
  }

  const cleanCode = couponCode.trim().toUpperCase();
  const parsedAmount = Math.max(0, parseFloat(orderAmount) || 0);
  const now = new Date();

  // Find active offer matching code (case-insensitive)
  const query = {
    $or: [
      { code: { $regex: new RegExp(`^${cleanCode}$`, 'i') } },
      { 'config.couponCode': { $regex: new RegExp(`^${cleanCode}$`, 'i') } },
    ],
    status: 'Active',
    isDeleted: { $ne: true },
    startTime: { $lte: now },
    endTime: { $gte: now },
  };

  const candidateOffers = await Offer.find(query).lean();

  if (!candidateOffers || candidateOffers.length === 0) {
    throw ApiError.badRequest(`Coupon "${cleanCode}" is invalid or has expired.`);
  }

  // Pick best matching offer (vendor-specific first if vendorId provided, otherwise platform-wide)
  let matchedOffer = null;
  if (vendorId) {
    matchedOffer = candidateOffers.find(o => o.vendorId && o.vendorId.toString() === vendorId.toString());
  }
  if (!matchedOffer) {
    matchedOffer = candidateOffers.find(o => !o.vendorId || !o.isVendorOffer);
  }
  if (!matchedOffer) {
    matchedOffer = candidateOffers[0];
  }

  const config = matchedOffer.config || {};
  const discountType = config.couponType || config.discountType || matchedOffer.discountType || 'percentage';
  const discountVal = Number(config.discountValue || matchedOffer.discountValue || 0);
  const minAmount = Number(config.minOrderAmount || matchedOffer.minOrderAmount || 0);
  const maxLimit = config.maxDiscountLimit ? Number(config.maxDiscountLimit) : (matchedOffer.maxDiscountLimit ? Number(matchedOffer.maxDiscountLimit) : null);
  const totalLimit = config.totalUsageLimit || matchedOffer.usageLimit;
  const perUser = config.usagePerCustomer || matchedOffer.perUserLimit || 1;

  // 1. Min order amount check
  if (parsedAmount > 0 && minAmount > 0 && parsedAmount < minAmount) {
    throw ApiError.badRequest(`Minimum order amount of ₹${minAmount} required to apply "${cleanCode}".`);
  }

  // 2. Total usage limit check
  if (totalLimit && (matchedOffer.usedCount || 0) >= totalLimit) {
    throw ApiError.badRequest(`Coupon "${cleanCode}" has reached its maximum usage limit.`);
  }

  // 3. Per-user usage limit check
  if (req.user && req.user._id) {
    const userRedemptions = (matchedOffer.redemptions || []).filter(
      r => r.userId && r.userId.toString() === req.user._id.toString()
    );
    if (userRedemptions.length >= perUser) {
      throw ApiError.badRequest(`You have already used coupon "${cleanCode}" the maximum allowed number of times.`);
    }
  }

  // Calculate discount amount
  let calculatedDiscount = 0;
  if (discountType === 'percentage' || discountType === 'percent') {
    calculatedDiscount = Math.round((parsedAmount * discountVal) / 100);
    if (maxLimit && calculatedDiscount > maxLimit) {
      calculatedDiscount = maxLimit;
    }
  } else {
    // Fixed / Flat discount
    calculatedDiscount = Math.min(parsedAmount, discountVal);
  }

  calculatedDiscount = Math.max(0, calculatedDiscount);
  const finalAmount = Math.max(0, parsedAmount - calculatedDiscount);

  res.json({
    success: true,
    message: `Coupon "${cleanCode}" applied successfully! You save ₹${calculatedDiscount}.`,
    data: {
      offerId: matchedOffer._id.toString(),
      couponCode: cleanCode,
      title: matchedOffer.title,
      discountType,
      discountValue: discountVal,
      discountAmount: calculatedDiscount,
      minOrderAmount: minAmount,
      maxDiscountLimit: maxLimit,
      finalAmount,
      savings: calculatedDiscount,
    }
  });
}));

/**
 * GET /offers/applicable
 * Retrieves list of available and active coupons for the user to pick from.
 */
router.get('/applicable', requireAuth, catchAsync(async (req, res) => {
  const { vendorId, orderAmount } = req.query;
  const now = new Date();
  const parsedAmount = Math.max(0, parseFloat(orderAmount) || 0);

  const orConditions = [
    { targetRoles: { $in: ['customer', 'all'] } },
    { targetRoles: [] },
  ];

  const query = {
    $or: orConditions,
    status: 'Active',
    isDeleted: { $ne: true },
    startTime: { $lte: now },
    endTime: { $gte: now },
  };

  const offers = await Offer.find(query).sort({ priority: -1, created_at: -1 }).limit(10).lean();

  const applicable = [];
  for (const o of offers) {
    const code = o.code || o.config?.couponCode;
    if (!code) continue;

    // Filter by vendor if specified
    if (o.vendorId && vendorId && o.vendorId.toString() !== vendorId.toString()) {
      continue;
    }

    const minAmount = o.minOrderAmount || o.config?.minOrderAmount || 0;
    const discountType = o.discountType || o.config?.couponType || 'percentage';
    const discountValue = o.discountValue || o.config?.discountValue || 0;
    const maxLimit = o.maxDiscountLimit || o.config?.maxDiscountLimit || null;

    applicable.push({
      id: o._id.toString(),
      code: code.toUpperCase(),
      title: o.title,
      description: o.description,
      discountType,
      discountValue,
      minOrderAmount: minAmount,
      maxDiscountLimit: maxLimit,
      endTime: o.endTime,
      isEligible: parsedAmount === 0 || parsedAmount >= minAmount,
    });
  }

  // Fallback default coupons if none found in DB
  if (applicable.length === 0) {
    applicable.push(
      {
        id: 'promo_welcome10',
        code: 'WELCOME10',
        title: 'Welcome Offer',
        description: 'Get 10% instant discount on your order up to ₹200.',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 0,
        maxDiscountLimit: 200,
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isEligible: true,
      },
      {
        id: 'promo_bizreels50',
        code: 'BIZREELS50',
        title: 'Flat ₹50 Super Saver',
        description: 'Flat ₹50 OFF on orders above ₹299.',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 299,
        maxDiscountLimit: 50,
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isEligible: parsedAmount >= 299 || parsedAmount === 0,
      }
    );
  }

  res.json({
    success: true,
    data: applicable,
  });
}));

/**
 * POST /offers/calculate-shipping
 * Dynamic shipping rate calculation using Shiprocket service.
 */
router.post('/calculate-shipping', requireAuth, catchAsync(async (req, res) => {
  const { deliveryPincode, pickupPincode, orderAmount = 0, weight = 0.5, isCod = false } = req.body;
  const shiprocketService = require('../services/shiprocket.service');

  const rateDetails = await shiprocketService.calculateShippingRate({
    deliveryPincode: deliveryPincode ? String(deliveryPincode).trim() : '',
    pickupPincode: pickupPincode ? String(pickupPincode).trim() : '110001',
    weight: parseFloat(weight) || 0.5,
    orderAmount: parseFloat(orderAmount) || 0,
    isCod: Boolean(isCod),
  });

  res.json({
    success: true,
    data: rateDetails,
  });
}));

// ============================================================ ADMIN OPERATION ENDPOINTS

/**
 * GET /offers/admin
 * Paginated, filterable offer lists for admin view.
 */
router.get('/admin', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { q, role, status, from, to } = req.query;
  const page = Math.max(1, parseInt(req.query.page || 1, 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 20, 10)));
  const skip = (page - 1) * limit;

  const queryConditions = { isDeleted: { $ne: true } };

  // 1. Search Query
  if (q) {
    queryConditions.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { code: { $regex: q, $options: 'i' } }
    ];
  }

  // 2. Filter by Role
  if (role && role !== 'all') {
    queryConditions.targetRoles = role;
  }

  // 3. Filter by Status
  if (status && status !== 'all') {
    queryConditions.status = status;
  }

  // 4. Filter by Date Range (overlapping with start/end time)
  if (from || to) {
    queryConditions.$and = [];
    if (from) {
      queryConditions.$and.push({ endTime: { $gte: new Date(from) } });
    }
    if (to) {
      queryConditions.$and.push({ startTime: { $lte: new Date(to) } });
    }
  }

  const [items, total] = await Promise.all([
    Offer.find(queryConditions).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Offer.countDocuments(queryConditions)
  ]);

  res.json({
    success: true,
    items: items.map(o => ({ ...o, id: o._id.toString() })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}));

/**
 * POST /offers/admin
 * Creates a new offer campaign.
 */
router.post('/admin', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const {
    title, description, code, targetRoles, discountType, discountValue,
    minOrderAmount, maxDiscountLimit, usageLimit, perUserLimit,
    startTime, endTime, timezone, priority, terms, image,
    applicableCategories, applicableProducts, applicableServices, status
  } = req.body;

  if (!title || !description || !discountType || !discountValue || !startTime || !endTime) {
    throw ApiError.badRequest('Required fields: title, description, discountType, discountValue, startTime, endTime.');
  }

  const offerData = {
    title, description, code: code || undefined,
    targetRoles: targetRoles || ['customer'],
    discountType, discountValue,
    minOrderAmount: minOrderAmount || 0,
    maxDiscountLimit: maxDiscountLimit || null,
    usageLimit: usageLimit || null,
    perUserLimit: perUserLimit || 1,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    timezone: timezone || 'Asia/Kolkata',
    priority: priority || 0,
    terms: terms || '',
    image: image || null,
    applicableCategories: applicableCategories || [],
    applicableProducts: applicableProducts || [],
    applicableServices: applicableServices || [],
    status: status || 'Draft',
    createdBy: req.user._id
  };

  const offer = new Offer(offerData);
  await offer.save();

  // If set to Active directly on creation, launch notifications and socket broadcasts immediately
  if (offer.status === 'Active') {
    await activateOfferAndNotify(offer);
  } else {
    // Notify admin clients that an offer has been added/updated
    emitToAdmin('offer:created', offer);
  }

  // Create audit log
  await AuditLog.create({
    user_id: req.user._id.toString(),
    action: 'ADMIN_ACTION',
    meta: {
      type: 'OFFER_CREATE',
      offerId: offer._id.toString(),
      title: offer.title
    }
  });

  res.status(201).json({ success: true, offer });
}));

/**
 * PUT /offers/admin/:id
 * Updates an offer campaign details.
 */
router.put('/admin/:id', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const offer = await Offer.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!offer) {
    throw ApiError.notFound('Offer not found.');
  }

  const allowedUpdates = [
    'title', 'description', 'code', 'targetRoles', 'discountType', 'discountValue',
    'minOrderAmount', 'maxDiscountLimit', 'usageLimit', 'perUserLimit',
    'startTime', 'endTime', 'timezone', 'priority', 'terms', 'image',
    'applicableCategories', 'applicableProducts', 'applicableServices', 'status'
  ];

  const oldStatus = offer.status;

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'startTime' || field === 'endTime') {
        offer[field] = new Date(req.body[field]);
      } else {
        offer[field] = req.body[field];
      }
    }
  });

  await offer.save();

  // If status transitioned to Active, run activation logic
  if (offer.status === 'Active' && oldStatus !== 'Active') {
    await activateOfferAndNotify(offer);
  } else {
    // Otherwise emit regular update socket events to keep clients synced
    offer.targetRoles.forEach(role => {
      emitToRole(role, 'offer:updated', offer);
    });
    emitToAdmin('offer:updated', offer);
  }

  // Log action
  await AuditLog.create({
    user_id: req.user._id.toString(),
    action: 'ADMIN_ACTION',
    meta: {
      type: 'OFFER_UPDATE',
      offerId: offer._id.toString(),
      title: offer.title
    }
  });

  res.json({ success: true, offer });
}));

/**
 * DELETE /offers/admin/:id
 * Soft deletes an offer campaign.
 */
router.delete('/admin/:id', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const offer = await Offer.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!offer) {
    throw ApiError.notFound('Offer not found.');
  }

  offer.isDeleted = true;
  await offer.save();

  // Socket notification
  offer.targetRoles.forEach(role => {
    emitToRole(role, 'offer:deleted', { id: offer._id.toString() });
  });
  emitToAdmin('offer:deleted', { id: offer._id.toString() });

  // Log action
  await AuditLog.create({
    user_id: req.user._id.toString(),
    action: 'ADMIN_ACTION',
    meta: {
      type: 'OFFER_DELETE',
      offerId: offer._id.toString(),
      title: offer.title
    }
  });

  res.json({ success: true, message: 'Offer deleted successfully.' });
}));

/**
 * POST /offers/admin/:id/activate
 * Manually activates an offer.
 */
router.post('/admin/:id/activate', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const offer = await Offer.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!offer) {
    throw ApiError.notFound('Offer not found.');
  }

  offer.status = 'Active';
  await offer.save();
  await activateOfferAndNotify(offer);

  res.json({ success: true, offer });
}));

/**
 * POST /offers/admin/:id/deactivate
 * Manually deactivates (disables) an offer.
 */
router.post('/admin/:id/deactivate', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const offer = await Offer.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!offer) {
    throw ApiError.notFound('Offer not found.');
  }

  offer.status = 'Disabled';
  await offer.save();

  // Socket notification to remove it from frontend
  offer.targetRoles.forEach(role => {
    emitToRole(role, 'offer:expired', { id: offer._id.toString(), title: offer.title });
  });
  emitToAdmin('offer:updated', offer);

  res.json({ success: true, offer });
}));

/**
 * POST /offers/admin/:id/duplicate
 * Duplicates an existing offer campaign.
 */
router.post('/admin/:id/duplicate', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const sourceOffer = await Offer.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!sourceOffer) {
    throw ApiError.notFound('Offer not found.');
  }

  const duplicatedData = sourceOffer.toObject();
  delete duplicatedData._id;
  delete duplicatedData.created_at;
  delete duplicatedData.updated_at;

  duplicatedData.title = `${duplicatedData.title} (Copy)`;
  duplicatedData.status = 'Draft';
  duplicatedData.usedCount = 0;
  duplicatedData.recipientCount = 0;
  duplicatedData.analytics = { viewsCount: 0, clicksCount: 0 };
  duplicatedData.redemptions = [];
  duplicatedData.notificationStatus = { sent: false, sentAt: null, deliveryRate: 0 };

  // Set fresh times starting from now
  const durationMs = sourceOffer.endTime.getTime() - sourceOffer.startTime.getTime();
  duplicatedData.startTime = new Date();
  duplicatedData.endTime = new Date(Date.now() + durationMs);
  duplicatedData.createdBy = req.user._id;

  const duplicatedOffer = new Offer(duplicatedData);
  await duplicatedOffer.save();

  emitToAdmin('offer:created', duplicatedOffer);

  res.json({ success: true, offer: duplicatedOffer });
}));

/**
 * GET /offers/admin/:id/analytics
 * Retrieves details on clicks, views, and redemption records.
 */
router.get('/admin/:id/analytics', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const offer = await Offer.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
    .populate('redemptions.userId', 'name email phone')
    .lean();

  if (!offer) {
    throw ApiError.notFound('Offer not found.');
  }

  res.json({
    success: true,
    analytics: {
      recipientCount: offer.recipientCount,
      viewsCount: offer.analytics?.viewsCount || 0,
      clicksCount: offer.analytics?.clicksCount || 0,
      usedCount: offer.usedCount || 0,
      redemptions: offer.redemptions || [],
      notification: offer.notificationStatus
    }
  });
}));

module.exports = router;
