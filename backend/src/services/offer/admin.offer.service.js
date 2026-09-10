const Offer = require('../../models/Offer');
const User = require('../../models/User');
const { AuditLog } = require('../../models/Misc');
const ApiError = require('../../utils/ApiError');
const { emitToRole, emitToAdmin } = require('../../sockets');
const { activateOfferAndNotify } = require('../../jobs/offerScheduler');

/**
 * Admin Offer Subservice
 * Encapsulates administrative statistics, listings, mutations, batch actions, and analytics.
 */
class AdminOfferService {
  /**
   * Aggregate high-level platform campaign telemetry
   */
  async getAdminOfferStats() {
    const baseMatch = { isDeleted: { $ne: true } };

    const [statusCounts, metricsAgg, vendorCount] = await Promise.all([
      Offer.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Offer.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalOffers: { $sum: 1 },
            totalRedemptions: { $sum: { $ifNull: ['$usedCount', 0] } },
            totalViews: { $sum: { $ifNull: ['$analytics.viewsCount', 0] } },
            totalClicks: { $sum: { $ifNull: ['$analytics.clicksCount', 0] } },
            totalDiscountDisbursed: {
              $sum: {
                $reduce: {
                  input: { $ifNull: ['$redemptions', []] },
                  initialValue: 0,
                  in: { $add: ['$$value', { $ifNull: ['$$this.discountAmount', 0] }] }
                }
              }
            }
          }
        }
      ]),
      Offer.countDocuments({ ...baseMatch, isVendorOffer: true })
    ]);

    const statusMap = {
      Active: 0,
      Scheduled: 0,
      Draft: 0,
      Expired: 0,
      Disabled: 0
    };

    statusCounts.forEach(s => {
      if (s._id && statusMap[s._id] !== undefined) {
        statusMap[s._id] = s.count;
      }
    });

    const metrics = metricsAgg[0] || {
      totalOffers: 0,
      totalRedemptions: 0,
      totalViews: 0,
      totalClicks: 0,
      totalDiscountDisbursed: 0
    };

    const views = metrics.totalViews || 0;
    const clicks = metrics.totalClicks || 0;
    const redemptions = metrics.totalRedemptions || 0;

    const ctrPercentage = views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : 0;
    const conversionRate = clicks > 0 ? Number(((redemptions / clicks) * 100).toFixed(1)) : 0;

    return {
      totalOffers: metrics.totalOffers || 0,
      activeOffers: statusMap.Active,
      scheduledOffers: statusMap.Scheduled,
      draftOffers: statusMap.Draft,
      expiredOffers: statusMap.Expired,
      disabledOffers: statusMap.Disabled,
      vendorOffersCount: vendorCount,
      totalRedemptions: redemptions,
      totalDiscountDisbursed: metrics.totalDiscountDisbursed || 0,
      totalViews: views,
      totalClicks: clicks,
      ctrPercentage,
      conversionRate
    };
  }

  /**
   * Paginated, filterable offer lists for admin view
   */
  async listAdminOffers(queryParams = {}) {
    const { q, role, status, type, from, to } = queryParams;
    const page = Math.max(1, parseInt(queryParams.page || 1, 10));
    const limit = Math.max(1, Math.min(100, parseInt(queryParams.limit || 20, 10)));
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

    // 4. Filter by Offer Type (Platform vs Vendor Store Offer)
    if (type === 'vendor') {
      queryConditions.isVendorOffer = true;
    } else if (type === 'platform') {
      queryConditions.isVendorOffer = { $ne: true };
    }

    // 5. Filter by Date Range
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
      Offer.find(queryConditions)
        .populate('vendorId', 'name email phone vendorProfile.storeName')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Offer.countDocuments(queryConditions)
    ]);

    return {
      items: items.map(o => ({
        ...o,
        id: o._id.toString(),
        vendor: o.vendorId ? {
          id: o.vendorId._id,
          name: o.vendorId.name,
          email: o.vendorId.email,
          phone: o.vendorId.phone,
          storeName: o.vendorId.vendorProfile?.storeName || o.vendorId.name
        } : null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create a new campaign
   */
  async createOffer(body, adminUser) {
    const {
      title, description, code, targetRoles, discountType, discountValue,
      minOrderAmount, maxDiscountLimit, usageLimit, perUserLimit,
      startTime, endTime, timezone, priority, terms, image,
      applicableCategories, applicableProducts, applicableServices, status
    } = body;

    if (!title || !description || !discountType || discountValue === undefined || !startTime || !endTime) {
      throw ApiError.badRequest('Required fields: title, description, discountType, discountValue, startTime, endTime.');
    }

    const numDiscount = Number(discountValue);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      throw ApiError.badRequest('Discount value must be greater than 0.');
    }

    if (discountType === 'percentage' && (numDiscount < 1 || numDiscount > 100)) {
      throw ApiError.badRequest('Percentage discount must be between 1% and 100%.');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw ApiError.badRequest('Invalid start or end date format.');
    }
    if (end <= start) {
      throw ApiError.badRequest('End time must be after the start time.');
    }

    const cleanCode = code ? String(code).trim().toUpperCase() : undefined;
    if (cleanCode) {
      const duplicateCode = await Offer.findOne({
        code: cleanCode,
        isDeleted: { $ne: true },
        status: { $in: ['Active', 'Scheduled'] }
      });
      if (duplicateCode) {
        throw ApiError.badRequest(`Promo code "${cleanCode}" is already active on another campaign.`);
      }
    }

    const offerData = {
      title: title.trim(),
      description: description.trim(),
      code: cleanCode,
      targetRoles: targetRoles && targetRoles.length > 0 ? targetRoles : ['customer'],
      discountType,
      discountValue: numDiscount,
      minOrderAmount: Math.max(0, Number(minOrderAmount) || 0),
      maxDiscountLimit: maxDiscountLimit ? Number(maxDiscountLimit) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perUserLimit: Math.max(1, Number(perUserLimit) || 1),
      startTime: start,
      endTime: end,
      timezone: timezone || 'Asia/Kolkata',
      priority: Number(priority) || 0,
      terms: terms || '',
      image: image || null,
      applicableCategories: applicableCategories || [],
      applicableProducts: applicableProducts || [],
      applicableServices: applicableServices || [],
      status: status || 'Draft',
      createdBy: adminUser._id
    };

    const offer = new Offer(offerData);
    await offer.save();

    if (offer.status === 'Active') {
      await activateOfferAndNotify(offer);
    } else {
      emitToAdmin('offer:created', offer);
    }

    await AuditLog.create({
      user_id: adminUser._id.toString(),
      action: 'ADMIN_ACTION',
      meta: {
        type: 'OFFER_CREATE',
        offerId: offer._id.toString(),
        title: offer.title,
        code: offer.code
      }
    });

    return offer;
  }

  /**
   * Update existing campaign
   */
  async updateOffer(id, body, adminUser) {
    const offer = await Offer.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!offer) {
      throw ApiError.notFound('Offer campaign not found.');
    }

    const allowedUpdates = [
      'title', 'description', 'code', 'targetRoles', 'discountType', 'discountValue',
      'minOrderAmount', 'maxDiscountLimit', 'usageLimit', 'perUserLimit',
      'startTime', 'endTime', 'timezone', 'priority', 'terms', 'image',
      'applicableCategories', 'applicableProducts', 'applicableServices', 'status'
    ];

    if (body.discountType === 'percentage' && body.discountValue !== undefined) {
      const numVal = Number(body.discountValue);
      if (numVal < 1 || numVal > 100) {
        throw ApiError.badRequest('Percentage discount must be between 1% and 100%.');
      }
    }

    if (body.code !== undefined) {
      const cleanCode = body.code ? String(body.code).trim().toUpperCase() : undefined;
      if (cleanCode && cleanCode !== offer.code) {
        const duplicateCode = await Offer.findOne({
          _id: { $ne: offer._id },
          code: cleanCode,
          isDeleted: { $ne: true },
          status: { $in: ['Active', 'Scheduled'] }
        });
        if (duplicateCode) {
          throw ApiError.badRequest(`Promo code "${cleanCode}" is already active on another campaign.`);
        }
      }
      offer.code = cleanCode;
    }

    const oldStatus = offer.status;

    allowedUpdates.forEach(field => {
      if (body[field] !== undefined && field !== 'code') {
        if (field === 'startTime' || field === 'endTime') {
          offer[field] = new Date(body[field]);
        } else {
          offer[field] = body[field];
        }
      }
    });

    await offer.save();

    if (offer.status === 'Active' && oldStatus !== 'Active') {
      await activateOfferAndNotify(offer);
    } else {
      (offer.targetRoles || []).forEach(role => {
        emitToRole(role, 'offer:updated', offer);
      });
      emitToAdmin('offer:updated', offer);
    }

    await AuditLog.create({
      user_id: adminUser._id.toString(),
      action: 'ADMIN_ACTION',
      meta: {
        type: 'OFFER_UPDATE',
        offerId: offer._id.toString(),
        title: offer.title
      }
    });

    return offer;
  }

  /**
   * Soft delete single campaign
   */
  async deleteOffer(id, adminUser) {
    const offer = await Offer.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!offer) {
      throw ApiError.notFound('Offer not found.');
    }

    offer.isDeleted = true;
    await offer.save();

    (offer.targetRoles || []).forEach(role => {
      emitToRole(role, 'offer:deleted', { id: offer._id.toString() });
    });
    emitToAdmin('offer:deleted', { id: offer._id.toString() });

    await AuditLog.create({
      user_id: adminUser._id.toString(),
      action: 'ADMIN_ACTION',
      meta: {
        type: 'OFFER_DELETE',
        offerId: offer._id.toString(),
        title: offer.title
      }
    });

    return { ok: true, id };
  }

  /**
   * Bulk status update (Active / Disabled)
   */
  async bulkStatusOffers(ids = [], status, adminUser) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw ApiError.badRequest('Please provide an array of offer IDs.');
    }
    if (!['Active', 'Disabled'].includes(status)) {
      throw ApiError.badRequest('Target status must be "Active" or "Disabled".');
    }

    const offers = await Offer.find({ _id: { $in: ids }, isDeleted: { $ne: true } });
    if (offers.length === 0) {
      throw ApiError.notFound('No matching offers found for bulk update.');
    }

    const updatedIds = [];
    for (const offer of offers) {
      offer.status = status;
      await offer.save();
      updatedIds.push(offer._id.toString());

      if (status === 'Active') {
        await activateOfferAndNotify(offer);
      } else {
        (offer.targetRoles || []).forEach(role => {
          emitToRole(role, 'offer:expired', { id: offer._id.toString(), title: offer.title });
        });
        emitToAdmin('offer:updated', offer);
      }
    }

    await AuditLog.create({
      user_id: adminUser._id.toString(),
      action: 'ADMIN_ACTION',
      meta: {
        type: 'OFFER_BULK_STATUS',
        count: updatedIds.length,
        status,
        ids: updatedIds
      }
    });

    return { ok: true, updatedCount: updatedIds.length, status, ids: updatedIds };
  }

  /**
   * Bulk soft delete
   */
  async bulkDeleteOffers(ids = [], adminUser) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw ApiError.badRequest('Please provide an array of offer IDs.');
    }

    const result = await Offer.updateMany(
      { _id: { $in: ids }, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } }
    );

    ids.forEach(id => {
      emitToAdmin('offer:deleted', { id: id.toString() });
    });

    await AuditLog.create({
      user_id: adminUser._id.toString(),
      action: 'ADMIN_ACTION',
      meta: {
        type: 'OFFER_BULK_DELETE',
        count: result.modifiedCount,
        ids
      }
    });

    return { ok: true, deletedCount: result.modifiedCount };
  }

  /**
   * Manual activation
   */
  async activateOffer(id, adminUser) {
    const offer = await Offer.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!offer) {
      throw ApiError.notFound('Offer not found.');
    }

    offer.status = 'Active';
    await offer.save();
    await activateOfferAndNotify(offer);

    await AuditLog.create({
      user_id: adminUser._id.toString(),
      action: 'ADMIN_ACTION',
      meta: { type: 'OFFER_ACTIVATE', offerId: offer._id.toString(), title: offer.title }
    });

    return offer;
  }

  /**
   * Manual deactivation
   */
  async deactivateOffer(id, adminUser) {
    const offer = await Offer.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!offer) {
      throw ApiError.notFound('Offer not found.');
    }

    offer.status = 'Disabled';
    await offer.save();

    (offer.targetRoles || []).forEach(role => {
      emitToRole(role, 'offer:expired', { id: offer._id.toString(), title: offer.title });
    });
    emitToAdmin('offer:updated', offer);

    await AuditLog.create({
      user_id: adminUser._id.toString(),
      action: 'ADMIN_ACTION',
      meta: { type: 'OFFER_DEACTIVATE', offerId: offer._id.toString(), title: offer.title }
    });

    return offer;
  }

  /**
   * Duplicate existing offer campaign as Draft
   */
  async duplicateOffer(id, adminUser) {
    const source = await Offer.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!source) {
      throw ApiError.notFound('Source offer not found.');
    }

    const data = source.toObject();
    delete data._id;
    delete data.created_at;
    delete data.updated_at;

    data.title = `${data.title} (Copy)`;
    if (data.code) {
      data.code = `${data.code}_COPY`.slice(0, 20);
    }
    data.status = 'Draft';
    data.usedCount = 0;
    data.recipientCount = 0;
    data.analytics = { viewsCount: 0, clicksCount: 0, totalSales: 0 };
    data.redemptions = [];
    data.notificationStatus = { sent: false, sentAt: null, deliveryRate: 0 };

    const durationMs = source.endTime.getTime() - source.startTime.getTime();
    data.startTime = new Date();
    data.endTime = new Date(Date.now() + Math.max(durationMs, 86400000));
    data.createdBy = adminUser._id;

    const duplicate = new Offer(data);
    await duplicate.save();

    emitToAdmin('offer:created', duplicate);

    await AuditLog.create({
      user_id: adminUser._id.toString(),
      action: 'ADMIN_ACTION',
      meta: {
        type: 'OFFER_DUPLICATE',
        sourceId: source._id.toString(),
        newOfferId: duplicate._id.toString()
      }
    });

    return duplicate;
  }

  /**
   * Detailed analytics with CTR, conversion rate, and populated redemptions
   */
  async getOfferAnalytics(id) {
    const offer = await Offer.findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('redemptions.userId', 'name email phone')
      .lean();

    if (!offer) {
      throw ApiError.notFound('Offer not found.');
    }

    const views = offer.analytics?.viewsCount || 0;
    const clicks = offer.analytics?.clicksCount || 0;
    const redemptionsCount = offer.usedCount || (offer.redemptions || []).length || 0;

    const ctr = views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : 0;
    const conversion = clicks > 0 ? Number(((redemptionsCount / clicks) * 100).toFixed(1)) : 0;

    const totalDiscountAmount = (offer.redemptions || []).reduce(
      (acc, curr) => acc + (curr.discountAmount || 0),
      0
    );

    return {
      recipientCount: offer.recipientCount || 0,
      viewsCount: views,
      clicksCount: clicks,
      usedCount: redemptionsCount,
      ctrPercentage: ctr,
      conversionRate: conversion,
      totalDiscountAmount,
      redemptions: offer.redemptions || [],
      notification: offer.notificationStatus || { sent: false, sentAt: null, deliveryRate: 0 }
    };
  }
}

module.exports = new AdminOfferService();
