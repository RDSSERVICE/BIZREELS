const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth.middleware');
const Offer = require('../models/Offer');
const User = require('../models/User');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');
const { OFFER_CATEGORIES, CATEGORY_KEYS } = require('../constants/offerCategories');
const { validateOfferConfig } = require('../validators/offers');

const router = express.Router();

// ── GET /vendors/me/offers — List vendor's offers ─────────────
router.get('/me/offers', requireAuth, catchAsync(async (req, res) => {
  const vendorId = req.user._id;
  const { category, status, page = 1, limit = 50 } = req.query;
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  const query = {
    vendorId,
    isVendorOffer: true,
    isDeleted: { $ne: true },
  };

  if (category && CATEGORY_KEYS.includes(category)) {
    query.category = category;
  }
  if (status) {
    query.status = status;
  }

  const [items, total] = await Promise.all([
    Offer.find(query).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    Offer.countDocuments(query),
  ]);

  // Also fetch legacy embedded offers for backward compat during migration
  let legacyOffers = [];
  try {
    const user = await User.findById(vendorId).select('vendorProfile.offers').lean();
    legacyOffers = user?.vendorProfile?.offers || [];
  } catch (err) { /* ignore */ }

  const mappedItems = items.map(o => ({
    ...o,
    id: o._id.toString(),
  }));

  res.json({
    success: true,
    data: mappedItems,
    legacyOffers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
}));

// ── GET /vendors/me/offers/categories — Category definitions ──
router.get('/me/offers/categories', requireAuth, catchAsync(async (req, res) => {
  res.json({
    success: true,
    data: OFFER_CATEGORIES,
    keys: CATEGORY_KEYS,
  });
}));

// ── POST /vendors/me/offers — Create offer ────────────────────
router.post('/me/offers', requireAuth, catchAsync(async (req, res) => {
  const {
    category, offerName, title, description, config,
    startTime, endTime, code, priority, image, terms,
    applicableProducts, applicableServices, applicableCategories,
    usageLimit, perUserLimit, minOrderAmount, maxDiscountLimit,
    discountType, discountValue, status, targetRoles,
  } = req.body;

  // Validate required fields
  if (!title) throw ApiError.badRequest('Offer title is required');
  if (!category) throw ApiError.badRequest('Offer category is required');
  if (!CATEGORY_KEYS.includes(category)) {
    throw ApiError.badRequest(`Invalid offer category: ${category}`);
  }
  if (!startTime || !endTime) throw ApiError.badRequest('Start time and end time are required');
  if (new Date(endTime) <= new Date(startTime)) {
    throw ApiError.badRequest('End time must be after start time');
  }

  // Validate config against category schema
  const configValidation = validateOfferConfig(category, config || {});
  if (!configValidation.valid) {
    throw ApiError.badRequest(`Config validation failed: ${configValidation.error}`);
  }

  const offerData = {
    category,
    offerName: offerName || null,
    vendorId: req.user._id,
    isVendorOffer: true,
    config: configValidation.value,
    title: String(title).trim(),
    description: String(description || '').trim(),
    code: code ? String(code).trim().toUpperCase() : undefined,
    targetRoles: targetRoles || ['customer'],
    discountType: discountType || null,
    discountValue: discountValue != null ? Number(discountValue) : null,
    minOrderAmount: Number(minOrderAmount || 0),
    maxDiscountLimit: maxDiscountLimit ? Number(maxDiscountLimit) : null,
    usageLimit: usageLimit ? Number(usageLimit) : null,
    perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    priority: Number(priority || 0),
    terms: terms || '',
    image: image || null,
    applicableCategories: applicableCategories || [],
    applicableProducts: applicableProducts || [],
    applicableServices: applicableServices || [],
    status: status || 'Active',
    createdBy: req.user._id,
  };

  const offer = new Offer(offerData);
  await offer.save();

  // Notify customers (scoped for customer_specific / private coupon)
  try {
    const notificationService = require('../services/notification.service');
    const isPrivate = category === 'customer_specific' ||
      (category === 'coupon' && config?.visibility === 'private');
    const isSelected = category === 'coupon' && config?.visibility === 'selected_customers';

    let customers;
    if (isPrivate) {
      // No public notification for private offers
      customers = [];
    } else if (isSelected && config?.selectedCustomerIds?.length > 0) {
      customers = await User.find({
        _id: { $in: config.selectedCustomerIds },
        is_deleted: { $ne: true },
      });
    } else if (category === 'customer_specific' && config?.customerSelectionIds?.length > 0) {
      customers = await User.find({
        _id: { $in: config.customerSelectionIds },
        is_deleted: { $ne: true },
      });
    } else {
      customers = await User.find({
        roles: 'customer',
        is_deleted: { $ne: true },
      });
    }

    const user = await User.findById(req.user._id).select('name vendorProfile.businessName').lean();
    const vendorDisplayName = user?.name || user?.vendorProfile?.businessName || 'a local vendor';

    const categoryLabel = OFFER_CATEGORIES[category]?.label || category;
    const notifyPromises = customers.map(cust =>
      notificationService.create(
        cust._id.toString(),
        'offers',
        `New ${categoryLabel} from ${vendorDisplayName}`,
        `${offer.title}${offer.code ? ` — Use code "${offer.code}"` : ''}`,
        {
          offerId: offer._id.toString(),
          vendorId: req.user._id.toString(),
          vendorName: vendorDisplayName,
          category,
          offerName: offerName || categoryLabel,
        },
        '/customer/notifications'
      )
    );

    await Promise.all(notifyPromises);
  } catch (err) {
    console.error('Failed to notify customers about new offer:', err.message);
  }

  res.status(201).json({
    success: true,
    message: 'Offer created successfully!',
    data: offer,
  });
}));

// ── PUT /vendors/me/offers/:offerId — Update offer ────────────
router.put('/me/offers/:offerId', requireAuth, catchAsync(async (req, res) => {
  const { offerId } = req.params;
  const offer = await Offer.findOne({
    _id: offerId,
    vendorId: req.user._id,
    isVendorOffer: true,
    isDeleted: { $ne: true },
  });

  if (!offer) throw ApiError.notFound('Offer not found');

  const {
    category, offerName, title, description, config,
    startTime, endTime, code, priority, image, terms,
    applicableProducts, applicableServices, applicableCategories,
    usageLimit, perUserLimit, minOrderAmount, maxDiscountLimit,
    discountType, discountValue, status, targetRoles,
  } = req.body;

  // If category changed, validate new config
  const effectiveCategory = category || offer.category;
  if (config !== undefined) {
    const configValidation = validateOfferConfig(effectiveCategory, config);
    if (!configValidation.valid) {
      throw ApiError.badRequest(`Config validation failed: ${configValidation.error}`);
    }
    offer.config = configValidation.value;
  }

  // Update envelope fields
  if (category !== undefined) offer.category = category;
  if (offerName !== undefined) offer.offerName = offerName;

  // Update shared fields
  if (title !== undefined) offer.title = title;
  if (description !== undefined) offer.description = description;
  if (code !== undefined) offer.code = code ? String(code).trim().toUpperCase() : null;
  if (targetRoles !== undefined) offer.targetRoles = targetRoles;
  if (discountType !== undefined) offer.discountType = discountType;
  if (discountValue !== undefined) offer.discountValue = discountValue != null ? Number(discountValue) : null;
  if (minOrderAmount !== undefined) offer.minOrderAmount = Number(minOrderAmount);
  if (maxDiscountLimit !== undefined) offer.maxDiscountLimit = maxDiscountLimit ? Number(maxDiscountLimit) : null;
  if (usageLimit !== undefined) offer.usageLimit = usageLimit ? Number(usageLimit) : null;
  if (perUserLimit !== undefined) offer.perUserLimit = perUserLimit ? Number(perUserLimit) : 1;
  if (startTime !== undefined) offer.startTime = new Date(startTime);
  if (endTime !== undefined) offer.endTime = new Date(endTime);
  if (priority !== undefined) offer.priority = Number(priority);
  if (terms !== undefined) offer.terms = terms;
  if (image !== undefined) offer.image = image;
  if (applicableCategories !== undefined) offer.applicableCategories = applicableCategories;
  if (applicableProducts !== undefined) offer.applicableProducts = applicableProducts;
  if (applicableServices !== undefined) offer.applicableServices = applicableServices;
  if (status !== undefined) offer.status = status;

  await offer.save();

  res.json({
    success: true,
    message: 'Offer updated successfully!',
    data: offer,
  });
}));

// ── DELETE /vendors/me/offers/:offerId — Soft delete ──────────
router.delete('/me/offers/:offerId', requireAuth, catchAsync(async (req, res) => {
  const { offerId } = req.params;
  const offer = await Offer.findOne({
    _id: offerId,
    vendorId: req.user._id,
    isVendorOffer: true,
    isDeleted: { $ne: true },
  });

  if (!offer) throw ApiError.notFound('Offer not found');

  offer.isDeleted = true;
  await offer.save();

  res.json({ success: true, message: 'Offer deleted successfully!' });
}));

// ── POST /vendors/me/offers/:offerId/duplicate — Duplicate ────
router.post('/me/offers/:offerId/duplicate', requireAuth, catchAsync(async (req, res) => {
  const { offerId } = req.params;
  const source = await Offer.findOne({
    _id: offerId,
    vendorId: req.user._id,
    isVendorOffer: true,
    isDeleted: { $ne: true },
  });

  if (!source) throw ApiError.notFound('Offer not found');

  const duplicatedData = source.toObject();
  delete duplicatedData._id;
  delete duplicatedData.created_at;
  delete duplicatedData.updated_at;

  duplicatedData.title = `${duplicatedData.title} (Copy)`;
  duplicatedData.status = 'Draft';
  duplicatedData.usedCount = 0;
  duplicatedData.recipientCount = 0;
  duplicatedData.analytics = { viewsCount: 0, clicksCount: 0, totalSales: 0 };
  duplicatedData.redemptions = [];
  duplicatedData.notificationStatus = { sent: false, sentAt: null, deliveryRate: 0 };

  const durationMs = source.endTime.getTime() - source.startTime.getTime();
  duplicatedData.startTime = new Date();
  duplicatedData.endTime = new Date(Date.now() + durationMs);
  duplicatedData.createdBy = req.user._id;

  const duplicatedOffer = new Offer(duplicatedData);
  await duplicatedOffer.save();

  res.json({
    success: true,
    message: 'Offer duplicated successfully!',
    data: duplicatedOffer,
  });
}));

// ── PATCH /vendors/me/offers/:offerId/status — Toggle status ──
router.patch('/me/offers/:offerId/status', requireAuth, catchAsync(async (req, res) => {
  const { offerId } = req.params;
  const { status } = req.body;
  const offer = await Offer.findOne({
    _id: offerId,
    vendorId: req.user._id,
    isVendorOffer: true,
    isDeleted: { $ne: true },
  });

  if (!offer) throw ApiError.notFound('Offer not found');

  offer.status = status === 'active' || status === 'Active' ? 'Active' : 'Disabled';
  await offer.save();

  res.json({
    success: true,
    message: `Offer ${offer.status === 'Active' ? 'activated' : 'disabled'} successfully!`,
    data: offer,
  });
}));

// ── POST /vendors/me/offers/:offerId/validate-coupon — Validate
router.post('/me/offers/:offerId/validate-coupon', catchAsync(async (req, res) => {
  const { offerId } = req.params;
  const { couponCode, customerId } = req.body;

  const offer = await Offer.findOne({
    _id: offerId,
    isDeleted: { $ne: true },
    status: 'Active',
  }).lean();

  if (!offer) throw ApiError.notFound('Offer not found or inactive');

  // Check category supports coupon codes
  if (!['coupon', 'discount', 'first_order', 'festival_seasonal'].includes(offer.category)) {
    throw ApiError.badRequest('This offer type does not support coupon codes');
  }

  const config = offer.config || {};

  // Validate code match
  const offerCode = config.couponCode || offer.code;
  if (!offerCode || offerCode.toUpperCase() !== String(couponCode).toUpperCase()) {
    throw ApiError.badRequest('Invalid coupon code');
  }

  // Check expiry
  if (new Date() > new Date(offer.endTime)) {
    throw ApiError.badRequest('This coupon has expired');
  }

  // Check total usage limit
  if (config.totalUsageLimit && offer.usedCount >= config.totalUsageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }

  // Check per-customer usage limit
  if (customerId && config.usagePerCustomer) {
    const customerRedemptions = (offer.redemptions || []).filter(
      r => r.userId?.toString() === customerId
    );
    if (customerRedemptions.length >= config.usagePerCustomer) {
      throw ApiError.badRequest('You have already used this coupon the maximum number of times');
    }
  }

  // Check visibility (for coupon category)
  if (config.visibility === 'private') {
    throw ApiError.badRequest('This coupon is not available');
  }
  if (config.visibility === 'selected_customers' && customerId) {
    const selectedIds = config.selectedCustomerIds || [];
    if (!selectedIds.includes(customerId)) {
      throw ApiError.badRequest('This coupon is not available for your account');
    }
  }

  res.json({
    success: true,
    message: 'Coupon is valid!',
    data: {
      offerId: offer._id.toString(),
      category: offer.category,
      discountType: config.couponType || offer.discountType,
      discountValue: config.discountValue || offer.discountValue,
      minOrderAmount: config.minOrderAmount || offer.minOrderAmount || 0,
      maxDiscountLimit: config.maxDiscountLimit || offer.maxDiscountLimit,
    },
  });
}));

// ── GET /vendors/me/referral-offer-stats — Referral stats ─────
router.get('/me/referral-offer-stats', requireAuth, catchAsync(async (req, res) => {
  const vendorId = req.user._id.toString();
  const { Referral } = require('../models/Misc');

  // Find active referral offer for this vendor
  const referralOffer = await Offer.findOne({
    vendorId: req.user._id,
    category: 'referral',
    isVendorOffer: true,
    isDeleted: { $ne: true },
    status: 'Active',
  }).lean();

  if (!referralOffer) {
    return res.json({
      success: true,
      data: {
        hasActiveOffer: false,
        offer: null,
        stats: null,
      },
    });
  }

  // Aggregate referral stats for this offer
  const offerId = referralOffer._id.toString();
  const [totalReferrals, convertedReferrals, couponsIssued] = await Promise.all([
    Referral.countDocuments({ offer_id: offerId, vendor_id: vendorId, is_deleted: { $ne: true } }),
    Referral.countDocuments({ offer_id: offerId, vendor_id: vendorId, offer_reward_given: true, is_deleted: { $ne: true } }),
    Referral.countDocuments({ offer_id: offerId, vendor_id: vendorId, offer_reward_given: true, 'offer_referrer_reward.type': 'coupon', is_deleted: { $ne: true } }),
  ]);

  res.json({
    success: true,
    data: {
      hasActiveOffer: true,
      offer: {
        id: referralOffer._id.toString(),
        title: referralOffer.title,
        config: referralOffer.config,
        status: referralOffer.status,
        startTime: referralOffer.startTime,
        endTime: referralOffer.endTime,
      },
      stats: {
        totalReferrals,
        convertedReferrals,
        conversionRate: totalReferrals > 0 ? Math.round((convertedReferrals / totalReferrals) * 100) : 0,
        couponsIssued,
      },
    },
  });
}));

module.exports = router;
