const Order = require('../models/Order');
const Listing = require('../models/Listing');
const walletRepository = require('../repositories/walletRepository');
const Notification = require('../models/Notification');
const { emitToUser } = require('../sockets');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

class OrderController {
  create = asyncHandler(async (req, res) => {
    const {
      listingId,
      quantity,
      address,
      bookingDate,
      bookingTime,
      scheduledVisitTime,
      bookingNotes,
      paymentMethod = 'vendor_upi',
      paymentDetails = null,
      couponCode = null,
      couponDiscount = 0,
      shippingCharges = 0,
      shippingDetails = null,
      pincode = '',
    } = req.body;

    let listing = await Listing.findById(listingId).populate('vendor');
    if (!listing) {
      const Reel = require('../models/Reel');
      const reel = await Reel.findById(listingId).populate('creator');
      if (reel) {
        listing = {
          _id: reel._id,
          id: reel._id.toString(),
          title: reel.caption || 'Reel Promotion',
          type: reel.postType === 'service' || reel.postType === 'services' ? 'service' : 'product',
          vendor: reel.creator,
          salePrice: Number(reel.targetListing?.salePrice || reel.salePrice || reel.price || 0),
          price: Number(reel.targetListing?.price || reel.price || 0),
          serviceDetails: {},
        };
      } else {
        throw ApiError.notFound('Listing or product not found');
      }
    }

    // Verify supplier identity and KYC status
    const identityService = require('../services/identity.service');
    const vendorId = listing.vendor?._id || listing.vendor;
    const isVerified = await identityService.hasVerifiedIdentity(vendorId);
    if (!isVerified) {
      throw ApiError.badRequest('Orders cannot be placed with unverified suppliers. Supplier business verification (KYC) is pending approval.');
    }

    const unitPriceCandidates = [
      listing.salePrice,
      listing.sellingPrice,
      listing.offer_price,
      listing.price,
      listing.rate,
      listing.pricing?.amount,
      listing.pricing?.price,
      listing.actualPrice,
      listing.regularPrice,
      listing.originalPrice,
      listing.cost,
    ];
    const validUnitPrice = unitPriceCandidates.map(p => parseFloat(p)).find(p => !isNaN(p) && p > 0);
    const unitPrice = validUnitPrice || 0;
    const isService = listing.type === 'service' || listing.postType === 'service' || listing.postType === 'services';
    const effectiveQty = isService ? 1 : (quantity || 1);
    const itemTotal = unitPrice * effectiveQty;

    // Process coupon if supplied
    let validatedCouponDiscount = 0;
    let validatedCouponCode = null;
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const Offer = require('../models/Offer');
      const now = new Date();
      const offerDoc = await Offer.findOne({
        $or: [
          { code: { $regex: new RegExp(`^${cleanCode}$`, 'i') } },
          { 'config.couponCode': { $regex: new RegExp(`^${cleanCode}$`, 'i') } },
        ],
        status: 'Active',
        isDeleted: { $ne: true },
        startTime: { $lte: now },
        endTime: { $gte: now },
      });

      if (offerDoc) {
        const config = offerDoc.config || {};
        const dType = config.couponType || config.discountType || offerDoc.discountType || 'percentage';
        const dVal = Number(config.discountValue || offerDoc.discountValue || 0);
        const maxLim = config.maxDiscountLimit || offerDoc.maxDiscountLimit;
        const minAmt = Number(config.minOrderAmount || offerDoc.minOrderAmount || 0);

        if (itemTotal >= minAmt) {
          if (dType === 'percentage' || dType === 'percent') {
            validatedCouponDiscount = Math.round((itemTotal * dVal) / 100);
            if (maxLim && validatedCouponDiscount > maxLim) {
              validatedCouponDiscount = maxLim;
            }
          } else {
            validatedCouponDiscount = Math.min(itemTotal, dVal);
          }
          validatedCouponCode = cleanCode;

          // Record redemption in offer asynchronously
          Offer.updateOne(
            { _id: offerDoc._id },
            {
              $inc: { usedCount: 1, 'analytics.totalSales': itemTotal },
              $push: {
                redemptions: {
                  userId: req.user._id,
                  redeemedAt: new Date(),
                  discountAmount: validatedCouponDiscount,
                }
              }
            }
          ).catch(e => console.warn('Non-blocking offer redemption recording error:', e));
        }
      } else if (Number(couponDiscount) > 0) {
        validatedCouponDiscount = Math.min(itemTotal, Number(couponDiscount));
        validatedCouponCode = cleanCode;
      }
    }

    const validShipping = Math.max(0, parseFloat(shippingCharges) || 0);
    const finalPayable = Math.max(0, itemTotal - validatedCouponDiscount + (isService ? 0 : validShipping));
    let finalPaymentStatus = 'unpaid';

    // If wallet payment is explicitly chosen, check and debit wallet
    if (paymentMethod === 'wallet') {
      if (req.user.walletBalance < finalPayable) {
        throw ApiError.badRequest('Insufficient wallet balance to place this order with Wallet. You can choose Vendor UPI/QR/Cash payment.');
      }

      await walletRepository.updateWalletBalance(
        req.user._id,
        -finalPayable,
        'payment',
        null,
        `Ordered: "${listing.title}"`
      );

      await walletRepository.updateWalletBalance(
        listing.vendor._id,
        finalPayable,
        'deposit',
        null,
        `Received payment for order: "${listing.title}"`
      );

      finalPaymentStatus = 'paid';
    }

    // Compute scheduled visit time if bookingDate/time provided
    let computedVisitTime = null;
    if (scheduledVisitTime) {
      computedVisitTime = new Date(scheduledVisitTime);
    } else if (bookingDate) {
      try {
        if (bookingTime) {
          computedVisitTime = new Date(`${bookingDate} ${bookingTime}`);
          if (isNaN(computedVisitTime.getTime())) computedVisitTime = new Date(bookingDate);
        } else {
          computedVisitTime = new Date(bookingDate);
        }
      } catch (e) {
        computedVisitTime = new Date(bookingDate);
      }
    }

    const policies = listing.serviceDetails?.policies || {};
    const cancellationPolicySnapshot = {
      freeCancellationHours: typeof policies.freeCancellationHours === 'number' ? policies.freeCancellationHours : 24,
      withinWindowHours: typeof policies.withinWindowHours === 'number' ? policies.withinWindowHours : 24,
      withinWindowRefundPercent: typeof policies.withinWindowRefundPercent === 'number' ? policies.withinWindowRefundPercent : 50,
      afterVisitRefundPercent: typeof policies.afterVisitRefundPercent === 'number' ? policies.afterVisitRefundPercent : 0,
      cancellationPolicy: policies.cancellationPolicy || 'Free cancellation up to 24 hours before visit.',
    };

    const order = await Order.create({
      customer: req.user._id,
      listing: listingId,
      vendor: listing.vendor._id,
      quantity: effectiveQty,
      itemTotal,
      couponCode: validatedCouponCode,
      couponDiscount: validatedCouponDiscount,
      shippingCharges: isService ? 0 : validShipping,
      shippingDetails,
      pincode: pincode || '',
      price: finalPayable,
      status: 'pending',
      paymentStatus: finalPaymentStatus,
      paymentMethod,
      paymentDetails,
      address: address || 'Customer Address',
      bookingDate: bookingDate || '',
      bookingTime: bookingTime || '',
      scheduledVisitTime: computedVisitTime && !isNaN(computedVisitTime.getTime()) ? computedVisitTime : null,
      cancellationPolicySnapshot,
    });

    // Notify vendor
    const isServiceBooking = isService || !!computedVisitTime;
    const methodLabel = paymentMethod === 'wallet' ? 'Wallet' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Vendor UPI / QR / Bank Transfer';
    const notifyVendor = await Notification.create({
      recipient: listing.vendor._id,
      sender: req.user._id,
      type: 'payment',
      title: isServiceBooking ? 'New Service Booking Received' : 'New Product Order Received',
      message: `${req.user.name} placed order for ${effectiveQty}x "${listing.title}" (Total: ₹${finalPayable}${validatedCouponDiscount > 0 ? ` with ₹${validatedCouponDiscount} coupon discount` : ''}) via ${methodLabel}.`,
      data: { orderId: order._id },
    });
    emitToUser(listing.vendor._id.toString(), 'notification', notifyVendor);

    try {
      const { emitToAdmin } = require('../sockets');
      emitToAdmin('admin:update', { tags: ['AdminOrders', 'AdminOverview', 'AdminUsers'] });
    } catch (err) {}

    return ApiResponse.created(res, 'Order placed successfully.', { order });
  });

  getVendorOrders = asyncHandler(async (req, res) => {
    req.query.role = 'vendor';
    return this.getOrders(req, res);
  });

  getOrders = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const { search, status, paymentStatus, sortBy, role, page = 1, limit = 10 } = req.query;

    const activeRole = role || req.user.activeRole || req.user.current_role;
    const baseQuery = {};

    if (activeRole === 'vendor') {
      const Listing = require('../models/Listing');
      const myListings = await Listing.find({ vendor: req.user._id }).select('_id').lean();
      const listingIds = myListings.map(l => l._id);
      baseQuery.$or = [{ vendor: req.user._id }, { listing: { $in: listingIds } }];
    } else if (activeRole === 'customer') {
      baseQuery.customer = req.user._id;
    } else if (activeRole === 'creator') {
      baseQuery.vendor = req.user._id;
    } else if (req.user.roles?.includes('admin') || req.user.role === 'admin' || req.user.activeRole === 'admin') {
      // Admin sees all
    } else {
      baseQuery.$or = [{ customer: req.user._id }, { vendor: req.user._id }];
    }

    // Filters
    if (status) {
      if (status === 'active') {
        baseQuery.status = { $nin: ['cancelled', 'rejected', 'refunded', 'completed', 'delivered'] };
      } else {
        baseQuery.status = status;
      }
    }
    if (paymentStatus) {
      baseQuery.paymentStatus = paymentStatus;
    }

    // Search query mapping listing title, vendor name, or order ID
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const User = require('../models/User');
      const [matchedListings, matchedUsers] = await Promise.all([
        Listing.find({ $or: [{ title: searchRegex }, { category: searchRegex }] }).select('_id').lean(),
        User.find({ $or: [{ name: searchRegex }, { 'vendorProfile.shopName': searchRegex }] }).select('_id').lean()
      ]);
      const listingIds = matchedListings.map(l => l._id);
      const userIds = matchedUsers.map(u => u._id);

      const orConditions = [
        { listing: { $in: listingIds } },
        { vendor: { $in: userIds } },
        { customer: { $in: userIds } }
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(search) });
      }

      baseQuery.$and = [
        { $or: baseQuery.$or },
        { $or: orConditions }
      ];
      delete baseQuery.$or;
    }

    // Sorting options
    let sort = { createdAt: -1 };
    if (sortBy) {
      if (sortBy === 'latest') sort = { createdAt: -1 };
      else if (sortBy === 'oldest') sort = { createdAt: 1 };
      else if (sortBy === 'price_low_high') sort = { price: 1 };
      else if (sortBy === 'price_high_low') sort = { price: -1 };
    }

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, orders] = await Promise.all([
      Order.countDocuments(baseQuery),
      Order.find(baseQuery)
        .populate('customer', 'name email avatarUrl phone')
        .populate('vendor', 'name email avatarUrl phone businessName vendorProfile')
        .populate('listing', 'title images type category actualPrice sellingPrice price discount stock status')
        .sort(sort)
        .skip(skip)
        .limit(parsedLimit)
        .lean()
    ]);

    return ApiResponse.paginated(res, 'Orders retrieved successfully.', orders, {
      page: parsedPage,
      limit: parsedLimit,
      total,
    });
  });

  cancel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body || {};
    const order = await Order.findById(id).populate('listing').populate('customer').populate('vendor');
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const customerId = (order.customer?._id || order.customer || '').toString();
    const vendorId = (order.vendor?._id || order.vendor || '').toString();
    const userId = (req.user?._id || '').toString();

    const isCustomer = customerId === userId;
    const isVendor = vendorId === userId;
    const isAdmin = (req.user.roles && req.user.roles.includes('admin')) || req.user.role === 'admin' || req.user.activeRole === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      throw ApiError.forbidden('Unauthorized to cancel this order.');
    }

    if (['cancelled', 'rejected', 'refunded'].includes(order.status)) {
      throw ApiError.badRequest('Order is already cancelled or finalized.');
    }

    const isService = order.listing?.type === 'service' || !!order.scheduledVisitTime || !!order.bookingDate;
    let refundPercent = 100;
    let policyExplanation = isVendor ? 'Order cancelled/rejected by vendor' : 'Standard 100% full cancellation';

    if (isCustomer && !isVendor && !isAdmin && isService) {
      const policy = order.cancellationPolicySnapshot || order.listing?.serviceDetails?.policies || {
        freeCancellationHours: 24,
        withinWindowHours: 24,
        withinWindowRefundPercent: 50,
        afterVisitRefundPercent: 0,
      };

      const freeHours = typeof policy.freeCancellationHours === 'number' ? policy.freeCancellationHours : 24;
      const windowHours = typeof policy.withinWindowHours === 'number' ? policy.withinWindowHours : 24;
      const windowPercent = typeof policy.withinWindowRefundPercent === 'number' ? policy.withinWindowRefundPercent : 50;
      const afterPercent = typeof policy.afterVisitRefundPercent === 'number' ? policy.afterVisitRefundPercent : 0;

      let visitTime = order.scheduledVisitTime;
      if (!visitTime && order.bookingDate) {
        try {
          visitTime = new Date(`${order.bookingDate} ${order.bookingTime || '10:00 AM'}`);
        } catch (e) {}
      }

      if (visitTime && !isNaN(new Date(visitTime).getTime())) {
        const now = new Date();
        const diffMs = new Date(visitTime).getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours >= freeHours) {
          refundPercent = 100;
          policyExplanation = `Free cancellation (${diffHours.toFixed(1)}h before visit >= ${freeHours}h free limit)`;
        } else if (diffHours > 0) {
          refundPercent = Math.max(0, Math.min(100, windowPercent));
          policyExplanation = `Cancellation within ${windowHours}h before visit (${diffHours.toFixed(1)}h remaining): ${refundPercent}% refund`;
        } else {
          refundPercent = Math.max(0, Math.min(100, afterPercent));
          policyExplanation = `Cancellation after scheduled visit time: ${refundPercent}% refund`;
        }
      } else {
        refundPercent = 100;
        policyExplanation = '100% full refund applied';
      }
    }

    // Wallet refund is ONLY applicable if money was actually paid upfront (paymentStatus === 'paid')
    const isPaid = order.paymentStatus === 'paid';
    const refundAmount = isPaid ? Math.round((order.price * refundPercent) / 100) : 0;

    if (isPaid && refundAmount > 0) {
      try {
        await walletRepository.updateWalletBalance(
          customerId,
          refundAmount,
          'refund',
          order._id,
          `Refund (${refundPercent}%) for cancelled ${isService ? 'service booking' : 'order'}: "${order.listing?.title || 'Order Item'}"`
        );
      } catch (err) {
        console.warn('Customer wallet refund error (non-fatal):', err?.message);
      }

      try {
        await walletRepository.updateWalletBalance(
          vendorId,
          -refundAmount,
          'payment',
          order._id,
          `Debit (${refundPercent}% refund) for cancelled ${isService ? 'service booking' : 'order'}: "${order.listing?.title || 'Order Item'}"`
        );
      } catch (err) {
        console.warn('Vendor wallet debit error (non-fatal):', err?.message);
      }
    }

    order.status = isVendor ? 'rejected' : 'cancelled';
    order.deliveryStatus = 'cancelled';
    order.refundAmount = refundAmount;
    order.refundPercentage = isPaid ? refundPercent : 0;
    order.cancelledAt = new Date();
    if (reason) order.cancellationReason = reason;
    await order.save();

    // Notify vendor
    if (vendorId) {
      try {
        const notifyVendor = await Notification.create({
          recipient: vendorId,
          sender: req.user._id,
          recipientRole: 'vendor',
          type: 'order',
          title: `${isService ? 'Service Booking' : 'Order'} ${isVendor ? 'Rejected' : 'Cancelled'}`,
          message: `${isVendor ? 'You' : req.user.name || 'Customer'} cancelled "${order.listing?.title || 'Item'}". ${policyExplanation}.${refundAmount > 0 ? ` Wallet refund: ₹${refundAmount} (${refundPercent}%).` : ''}`,
          body: `${isVendor ? 'You' : req.user.name || 'Customer'} cancelled "${order.listing?.title || 'Item'}". ${policyExplanation}.${refundAmount > 0 ? ` Wallet refund: ₹${refundAmount} (${refundPercent}%).` : ''}`,
          actionUrl: '/vendor/orders',
          data: { orderId: order._id, refundAmount, refundPercent },
        });
        emitToUser(vendorId, 'notification:new', notifyVendor);
        emitToUser(vendorId, 'notification', notifyVendor);
        emitToUser(vendorId, 'order:updated', order);
      } catch (notifyErr) {
        console.warn('Vendor notification error in cancel:', notifyErr?.message);
      }
    }

    // Notify customer
    if (customerId) {
      try {
        const notifyCustomer = await Notification.create({
          recipient: customerId,
          sender: req.user._id,
          recipientRole: 'customer',
          type: 'order',
          title: isVendor ? 'Order Rejected by Vendor' : `${isService ? 'Booking' : 'Order'} Cancelled`,
          message: `Your order for "${order.listing?.title || 'Item'}" has been ${isVendor ? 'rejected by the vendor' : 'cancelled'}.${refundAmount > 0 ? ` ₹${refundAmount} (${refundPercent}%) credited to your wallet.` : ''}`,
          body: `Your order for "${order.listing?.title || 'Item'}" has been ${isVendor ? 'rejected by the vendor' : 'cancelled'}.${refundAmount > 0 ? ` ₹${refundAmount} (${refundPercent}%) credited to your wallet.` : ''}`,
          actionUrl: '/customer/activities?tab=orders',
          data: { orderId: order._id, refundAmount, refundPercent },
        });
        emitToUser(customerId, 'notification:new', notifyCustomer);
        emitToUser(customerId, 'notification', notifyCustomer);
        emitToUser(customerId, 'order:updated', order);
      } catch (notifyErr) {
        console.warn('Customer notification error in cancel:', notifyErr?.message);
      }
    }

    try {
      const { emitToAdmin } = require('../sockets');
      if (typeof emitToAdmin === 'function') {
        emitToAdmin('admin:update', { tags: ['AdminOrders', 'AdminOverview'] });
      }
    } catch (err) {}

    return ApiResponse.ok(res, `Cancellation processed successfully. ${policyExplanation}${refundAmount > 0 ? ` (₹${refundAmount} refunded)` : ''}.`, {
      order,
    });
  });

  getVendorOrders = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 50 } = req.query;
    const query = { vendor: req.user._id };
    if (status && status !== 'all') {
      query.status = status;
    }
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 50;
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate('customer', 'name email phone avatarUrl')
        .populate('listing', 'title images type category actualPrice sellingPrice price discount stock status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean()
    ]);

    return ApiResponse.paginated(res, 'Vendor orders retrieved successfully.', orders, {
      page: parsedPage,
      limit: parsedLimit,
      total,
    });
  });

  getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('customer', 'name email phone avatarUrl')
      .populate('vendor', 'name email phone avatarUrl vendorProfile businessName')
      .populate('listing', 'title images type category actualPrice sellingPrice price discount stock status')
      .lean();

    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    const isCustomer = order.customer && order.customer._id.toString() === req.user._id.toString();
    const isVendor = order.vendor && order.vendor._id.toString() === req.user._id.toString();
    const isAdmin = (req.user.roles && req.user.roles.includes('admin')) || req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to view this order.');
    }

    return ApiResponse.ok(res, 'Order details retrieved successfully.', { order });
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      status,
      deliveryStatus,
      trackingNumber,
      expectedDeliveryDate,
      notes,
      rejectionReason,
      cancellationReason,
      paymentStatus,
    } = req.body || {};

    if (!status && !deliveryStatus && !trackingNumber && !paymentStatus) {
      throw ApiError.badRequest('Status, deliveryStatus, trackingNumber, or paymentStatus is required.');
    }

    const order = await Order.findById(id)
      .populate('listing')
      .populate('customer', 'name email phone avatarUrl')
      .populate('vendor', 'name email phone avatarUrl vendorProfile');

    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    const customerId = (order.customer?._id || order.customer || '').toString();
    const vendorId = (order.vendor?._id || order.vendor || '').toString();
    const listingVendorId = (order.listing?.vendor?._id || order.listing?.vendor || '').toString();
    const userId = (req.user?._id || '').toString();

    const isDirectVendor = vendorId === userId || (listingVendorId && listingVendorId === userId);
    const isDirectCustomer = customerId === userId;
    const isAdmin = (req.user.roles && req.user.roles.includes('admin')) || req.user.role === 'admin' || req.user.activeRole === 'admin';
    const isVendor = isDirectVendor || isAdmin;
    const isCustomer = isDirectCustomer;

    if (!isVendor && !isCustomer && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to update this order.');
    }

    // A pure customer (who is NOT the vendor/owner of this order and NOT an admin) can only cancel
    const isPureCustomer = isCustomer && !isVendor && !isAdmin;
    if (isPureCustomer) {
      if (status === 'cancelled') {
        req.params.id = id;
        return this.cancel(req, res);
      }
      throw ApiError.forbidden('Customers can only cancel pending orders.');
    }

    const validStatuses = [
      'pending',
      'accepted',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled',
      'rejected',
      'refunded',
    ];

    if (status && !validStatuses.includes(status.toLowerCase())) {
      throw ApiError.badRequest(`Invalid status: "${status}". Valid statuses: ${validStatuses.join(', ')}`);
    }

    const previousStatus = order.status;
    const newStatus = status ? status.toLowerCase() : order.status;

    // Handle cancellation / rejection reasons
    if ((newStatus === 'cancelled' || newStatus === 'rejected') && previousStatus !== newStatus) {
      if (rejectionReason || cancellationReason || notes) {
        order.cancellationReason = rejectionReason || cancellationReason || notes;
      }
      order.cancelledAt = new Date();
    }

    order.status = newStatus;

    // Synchronize delivery status if not explicitly given
    if (deliveryStatus) {
      order.deliveryStatus = deliveryStatus;
    } else if (['shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(newStatus)) {
      order.deliveryStatus = newStatus;
    } else if (newStatus === 'completed') {
      order.deliveryStatus = 'delivered';
    }

    // Update tracking info
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
      if (!order.shippingDetails) order.shippingDetails = {};
      if (typeof order.shippingDetails === 'object') {
        order.shippingDetails.trackingNumber = trackingNumber;
      }
    }

    if (expectedDeliveryDate) {
      order.expectedDeliveryDate = new Date(expectedDeliveryDate);
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    } else if (newStatus === 'completed' || newStatus === 'delivered') {
      if (order.paymentMethod === 'cod' || order.paymentMethod === 'cash') {
        order.paymentStatus = 'paid';
      }
    }

    await order.save();

    // Notify customer on status progression
    const statusLabels = {
      accepted: 'accepted and is being prepared',
      processing: 'now being processed',
      shipped: 'shipped and on its way',
      out_for_delivery: 'out for delivery',
      delivered: 'delivered successfully',
      completed: 'marked as completed',
      cancelled: 'cancelled',
      rejected: 'rejected by vendor',
    };

    const actionText = statusLabels[newStatus] || `updated to ${newStatus}`;

    try {
      if (customerId) {
        const notifyCustomer = await Notification.create({
          recipient: customerId,
          sender: req.user._id,
          recipientRole: 'customer',
          type: 'order',
          title: newStatus === 'accepted' ? 'Order Accepted! 🎉' : `Order Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
          message: `Your order for "${order.listing?.title || 'Item'}" has been ${actionText}.${trackingNumber ? ` (Tracking #: ${trackingNumber})` : ''}`,
          body: `Your order for "${order.listing?.title || 'Item'}" has been ${actionText}.${trackingNumber ? ` (Tracking #: ${trackingNumber})` : ''}`,
          actionUrl: '/customer/activities?tab=orders',
          data: { orderId: order._id, status: newStatus, trackingNumber },
        });
        emitToUser(customerId, 'notification:new', notifyCustomer);
        emitToUser(customerId, 'notification', notifyCustomer);
        emitToUser(customerId, 'order:updated', order);
      }

      if (vendorId) {
        emitToUser(vendorId, 'order:updated', order);
      }

      const { emitToAdmin } = require('../sockets');
      if (typeof emitToAdmin === 'function') {
        emitToAdmin('admin:update', { tags: ['AdminOrders', 'AdminOverview'] });
      }
    } catch (notifyErr) {
      console.warn('Non-blocking notification error in updateStatus:', notifyErr?.message);
    }

    return ApiResponse.ok(res, `Order status updated to ${newStatus}.`, { order });
  });
}

module.exports = new OrderController();
