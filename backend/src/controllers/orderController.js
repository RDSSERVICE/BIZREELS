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
      paymentDetails = null
    } = req.body;

    const listing = await Listing.findById(listingId).populate('vendor');
    if (!listing) {
      throw ApiError.notFound('Listing not found');
    }

    const unitPrice = parseFloat(listing.salePrice || listing.sellingPrice || listing.offer_price || listing.price || listing.actualPrice || 0);
    const price = unitPrice * (quantity || 1);
    let finalPaymentStatus = 'unpaid';

    // If wallet payment is explicitly chosen, check and debit wallet
    if (paymentMethod === 'wallet') {
      if (req.user.walletBalance < price) {
        throw ApiError.badRequest('Insufficient wallet balance to place this order with Wallet. You can choose Vendor UPI/QR/Cash payment.');
      }

      await walletRepository.updateWalletBalance(
        req.user._id,
        -price,
        'payment',
        null,
        `Ordered: "${listing.title}"`
      );

      await walletRepository.updateWalletBalance(
        listing.vendor._id,
        price,
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
      quantity: quantity || 1,
      price,
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
    const isService = listing.type === 'service' || !!computedVisitTime;
    const methodLabel = paymentMethod === 'wallet' ? 'Wallet' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Vendor UPI / QR / Bank Transfer';
    const notifyVendor = await Notification.create({
      recipient: listing.vendor._id,
      sender: req.user._id,
      type: 'payment',
      title: isService ? 'New Service Booking Received' : 'New Product Order Received',
      message: `${req.user.name} placed order for ${quantity || 1}x "${listing.title}" (₹${price}) via ${methodLabel}.`,
      data: { orderId: order._id },
    });
    emitToUser(listing.vendor._id.toString(), 'notification', notifyVendor);

    try {
      const { emitToAdmin } = require('../sockets');
      emitToAdmin('admin:update', { tags: ['AdminOrders', 'AdminOverview', 'AdminUsers'] });
    } catch (err) {}

    return ApiResponse.created(res, 'Order placed successfully.', { order });
  });

  getOrders = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const { search, status, paymentStatus, sortBy, page = 1, limit = 10 } = req.query;

    const baseQuery = {
      $or: [{ customer: req.user._id }, { vendor: req.user._id }]
    };

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

    if (order.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('Unauthorized to cancel this order.');
    }

    if (['cancelled', 'rejected', 'refunded'].includes(order.status)) {
      throw ApiError.badRequest('Order is already cancelled or finalized.');
    }

    const isService = order.listing?.type === 'service' || !!order.scheduledVisitTime || !!order.bookingDate;
    let refundPercent = 100;
    let policyExplanation = 'Standard 100% full refund';

    if (isService) {
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
          // Free cancellation (>= freeHours before visit)
          refundPercent = 100;
          policyExplanation = `Free cancellation (${diffHours.toFixed(1)}h before visit >= ${freeHours}h free limit)`;
        } else if (diffHours > 0) {
          // Within X hours before visit
          refundPercent = Math.max(0, Math.min(100, windowPercent));
          policyExplanation = `Cancellation within ${windowHours}h before visit (${diffHours.toFixed(1)}h remaining): ${refundPercent}% refund`;
        } else {
          // After scheduled visit time
          refundPercent = Math.max(0, Math.min(100, afterPercent));
          policyExplanation = `Cancellation after scheduled visit time: ${refundPercent}% refund`;
        }
      } else {
        refundPercent = 100;
        policyExplanation = '100% full refund applied';
      }
    }

    const refundAmount = Math.round((order.price * refundPercent) / 100);

    // Refund customer wallet if applicable
    if (refundAmount > 0) {
      await walletRepository.updateWalletBalance(
        order.customer._id,
        refundAmount,
        'refund',
        order._id,
        `Refund (${refundPercent}%) for cancelled ${isService ? 'service booking' : 'order'}: "${order.listing?.title || 'Order Item'}"`
      );
    }

    // Debit vendor wallet for refunded amount (vendor retains non-refunded portion)
    if (refundAmount > 0) {
      await walletRepository.updateWalletBalance(
        order.vendor._id,
        -refundAmount,
        'payment',
        order._id,
        `Debit (${refundPercent}% refund) for cancelled ${isService ? 'service booking' : 'order'}: "${order.listing?.title || 'Order Item'}"`
      );
    }

    order.status = 'cancelled';
    order.deliveryStatus = 'cancelled';
    order.refundAmount = refundAmount;
    order.refundPercentage = refundPercent;
    order.cancelledAt = new Date();
    if (reason) order.cancellationReason = reason;
    await order.save();

    // Notify vendor
    const notifyVendor = await Notification.create({
      recipient: order.vendor._id,
      sender: req.user._id,
      type: 'payment',
      title: `${isService ? 'Service Booking' : 'Order'} Cancelled`,
      message: `${req.user.name} has cancelled "${order.listing?.title || 'Item'}". ${policyExplanation}. Wallet refund: ₹${refundAmount} (${refundPercent}%).`,
      data: { orderId: order._id, refundAmount, refundPercent },
    });
    emitToUser(order.vendor._id.toString(), 'notification', notifyVendor);

    // Notify customer
    const notifyCustomer = await Notification.create({
      recipient: order.customer._id,
      sender: req.user._id,
      type: 'payment',
      title: `${isService ? 'Booking' : 'Order'} Cancelled & Refunded`,
      message: `Your cancellation for "${order.listing?.title || 'Item'}" is processed. ${policyExplanation}. ₹${refundAmount} (${refundPercent}%) credited to wallet.`,
      data: { orderId: order._id, refundAmount, refundPercent },
    });
    emitToUser(order.customer._id.toString(), 'notification', notifyCustomer);

    // Socket updates
    emitToUser(order.vendor._id.toString(), 'order:updated', order);
    emitToUser(order.customer._id.toString(), 'order:updated', order);

    try {
      const { emitToAdmin } = require('../sockets');
      emitToAdmin('admin:update', { tags: ['AdminOrders', 'AdminOverview'] });
    } catch (err) {}

    return ApiResponse.ok(res, `Cancellation processed successfully. ${policyExplanation} (₹${refundAmount} refunded).`, {
      order,
      refundAmount,
      refundPercentage: refundPercent,
      policyExplanation,
    });
  });
}

module.exports = new OrderController();
