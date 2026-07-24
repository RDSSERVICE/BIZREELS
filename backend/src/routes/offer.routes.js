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

  const offers = await Offer.find({
    targetRoles: { $in: userRoles },
    status: 'Active',
    isDeleted: { $ne: true }
  }).sort({ priority: -1, created_at: -1 });

  // Update viewsCount in analytics for all returned offers in background
  if (offers.length > 0) {
    const offerIds = offers.map(o => o._id);
    await Offer.updateMany(
      { _id: { $in: offerIds } },
      { $inc: { 'analytics.viewsCount': 1 } }
    );
  }

  res.json({
    success: true,
    items: offers.map(o => ({
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
    }))
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
    { new: true }
  );

  if (!offer) {
    throw ApiError.notFound('Offer not found.');
  }

  res.json({ success: true });
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
