const Offer = require('../../models/Offer');
const ApiError = require('../../utils/ApiError');
const shiprocketService = require('../shiprocket.service');

/**
 * Client Offer Subservice
 * Encapsulates client-facing queries: active offers, coupon validation, applicable offers, and shipping calculations.
 */
class ClientOfferService {
  /**
   * Retrieves currently active offers matching user roles with 30-minute caching.
   */
  async getActiveOffers(userRoles = ['customer']) {
    const cache = require('../../utils/cache');
    const version = (await cache.getCache('offers:version')) || 1;
    const rolesKey = [...userRoles].sort().join(',');
    const cacheKey = `offers:active:v${version}:${rolesKey}`;

    let mappedOffers = await cache.getCache(cacheKey);

    if (!mappedOffers) {
      const offers = await Offer.find({
        targetRoles: { $in: userRoles },
        status: 'Active',
        isDeleted: { $ne: true }
      })
        .sort({ priority: -1, created_at: -1 })
        .lean();

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

      await cache.setCache(cacheKey, mappedOffers, 1800);

      // Asynchronously increment view counts
      if (offers.length > 0) {
        const offerIds = offers.map(o => o._id);
        Offer.updateMany(
          { _id: { $in: offerIds } },
          { $inc: { 'analytics.viewsCount': 1 } }
        ).catch(err => console.error('Non-blocking offer views count update failed:', err));
      }
    }

    return mappedOffers;
  }

  /**
   * Registers a click on an offer card.
   */
  async recordClick(offerId) {
    const offer = await Offer.findOneAndUpdate(
      { _id: offerId, isDeleted: { $ne: true } },
      { $inc: { 'analytics.clicksCount': 1 } },
      { returnDocument: 'after' }
    );

    if (!offer) {
      throw ApiError.notFound('Offer not found.');
    }

    return { success: true };
  }

  /**
   * Validates a coupon code against active platform and vendor offers.
   */
  async validateCoupon({ couponCode, orderAmount = 0, vendorId, listingId, user }) {
    if (!couponCode || typeof couponCode !== 'string' || !couponCode.trim()) {
      return { success: false, valid: false, message: 'Please enter a coupon code.' };
    }

    const cleanCode = couponCode.trim().toUpperCase();
    const parsedAmount = Math.max(0, parseFloat(orderAmount) || 0);
    const now = new Date();

    const query = {
      $or: [
        { code: { $regex: new RegExp(`^${cleanCode}$`, 'i') } },
        { 'config.couponCode': { $regex: new RegExp(`^${cleanCode}$`, 'i') } }
      ],
      status: 'Active',
      isDeleted: { $ne: true },
      startTime: { $lte: now },
      endTime: { $gte: now }
    };

    const candidateOffers = await Offer.find(query).lean();

    if (!candidateOffers || candidateOffers.length === 0) {
      return { success: false, valid: false, message: `Coupon "${cleanCode}" is invalid or has expired.` };
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
    const maxLimit = config.maxDiscountLimit
      ? Number(config.maxDiscountLimit)
      : matchedOffer.maxDiscountLimit
      ? Number(matchedOffer.maxDiscountLimit)
      : null;
    const totalLimit = config.totalUsageLimit || matchedOffer.usageLimit;
    const perUser = config.usagePerCustomer || matchedOffer.perUserLimit || 1;

    // 1. Min order amount check
    if (parsedAmount > 0 && minAmount > 0 && parsedAmount < minAmount) {
      return {
        success: false,
        valid: false,
        message: `Minimum order amount of ₹${minAmount} required to apply "${cleanCode}".`
      };
    }

    // 2. Total usage limit check
    if (totalLimit && (matchedOffer.usedCount || 0) >= totalLimit) {
      return {
        success: false,
        valid: false,
        message: `Coupon "${cleanCode}" has reached its maximum usage limit.`
      };
    }

    // 3. Per-user usage limit check
    if (user && user._id) {
      const userRedemptions = (matchedOffer.redemptions || []).filter(
        r => r.userId && r.userId.toString() === user._id.toString()
      );
      if (userRedemptions.length >= perUser) {
        return {
          success: false,
          valid: false,
          message: `You have already used coupon "${cleanCode}" the maximum allowed number of times.`
        };
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

    return {
      success: true,
      valid: true,
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
        savings: calculatedDiscount
      }
    };
  }

  /**
   * Retrieves list of available and active coupons for user selection.
   */
  async getApplicableCoupons({ vendorId, orderAmount = 0 }) {
    const now = new Date();
    const parsedAmount = Math.max(0, parseFloat(orderAmount) || 0);

    const query = {
      $or: [{ targetRoles: { $in: ['customer', 'all'] } }, { targetRoles: [] }],
      status: 'Active',
      isDeleted: { $ne: true },
      startTime: { $lte: now },
      endTime: { $gte: now }
    };

    const offers = await Offer.find(query).sort({ priority: -1, created_at: -1 }).limit(15).lean();

    const applicable = [];
    for (const o of offers) {
      const code = o.code || o.config?.couponCode;
      if (!code) continue;

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
        isEligible: parsedAmount === 0 || parsedAmount >= minAmount
      });
    }

    // Default fallback coupons if none found
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
          isEligible: true
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
          isEligible: parsedAmount >= 299 || parsedAmount === 0
        }
      );
    }

    return applicable;
  }

  /**
   * Calculates shipping rate using Shiprocket service.
   */
  async calculateShipping({ deliveryPincode, pickupPincode, orderAmount = 0, weight = 0.5, isCod = false }) {
    return await shiprocketService.calculateShippingRate({
      deliveryPincode: deliveryPincode ? String(deliveryPincode).trim() : '',
      pickupPincode: pickupPincode ? String(pickupPincode).trim() : '110001',
      weight: parseFloat(weight) || 0.5,
      orderAmount: parseFloat(orderAmount) || 0,
      isCod: Boolean(isCod)
    });
  }
}

module.exports = new ClientOfferService();
