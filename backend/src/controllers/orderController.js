const Order = require('../models/Order');
const Listing = require('../models/Listing');
const walletRepository = require('../repositories/walletRepository');
const Notification = require('../models/Notification');
const { emitToUser } = require('../sockets');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');

const ALLOWED_ORDER_TRANSITIONS = {
  pending: ['accepted', 'cancelled', 'rejected'],
  accepted: ['processing', 'shipped', 'completed', 'cancelled', 'rejected'],
  processing: ['shipped', 'completed', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['completed', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  rejected: [],
  refunded: [],
};

const ALLOWED_BOOKING_TRANSITIONS = {
  pending: ['accepted', 'cancelled', 'rejected'],
  accepted: ['processing', 'completed', 'cancelled', 'rejected'],
  processing: ['completed', 'cancelled'],
  completed: ['refunded'],
  cancelled: [],
  rejected: [],
  refunded: [],
};

function attachSnapshotFallback(order) {
  if (!order) return order;
  if (!order.listing || typeof order.listing !== 'object' || !order.listing.title) {
    if (order.itemSnapshot && order.itemSnapshot.title) {
      order.listing = {
        _id: order.listing || order.itemSnapshot.vendorId || null,
        title: order.itemSnapshot.title,
        images: order.itemSnapshot.images || [],
        type: order.itemSnapshot.listingType || 'product',
        category: order.itemSnapshot.category || '',
        price: order.itemSnapshot.unitPrice || 0,
        sellingPrice: order.itemSnapshot.unitPrice || 0,
        sku: order.itemSnapshot.sku || '',
        isSnapshotFallback: true,
      };
    }
  }
  return order;
}

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

    const idempotencyKey = (req.headers['idempotency-key'] || req.body.idempotencyKey || '').trim() || null;
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ customer: req.user._id, idempotencyKey })
        .populate('listing')
        .populate('vendor');
      if (existingOrder) {
        logger.info('[Order Lifecycle] Idempotent order replay detected', {
          orderId: existingOrder._id,
          idempotencyKey,
          customerId: req.user._id,
        });
        return ApiResponse.ok(res, 'Order already placed (idempotent replay).', {
          order: attachSnapshotFallback(existingOrder),
          isReplay: true,
        });
      }
    }

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
    // Compute scheduled visit time if bookingDate/time provided
    const effectiveBookingDate = bookingDate || req.body.paymentDetails?.bookingDate || '';
    const effectiveBookingTime = bookingTime || req.body.paymentDetails?.bookingTime || '';
    let computedVisitTime = null;
    if (scheduledVisitTime) {
      computedVisitTime = new Date(scheduledVisitTime);
    } else if (effectiveBookingDate) {
      try {
        if (effectiveBookingTime) {
          const startTime = effectiveBookingTime.includes('-')
            ? effectiveBookingTime.split('-')[0].trim()
            : effectiveBookingTime.trim();
          computedVisitTime = new Date(`${effectiveBookingDate} ${startTime}`);
          if (isNaN(computedVisitTime.getTime())) computedVisitTime = new Date(effectiveBookingDate);
        } else {
          computedVisitTime = new Date(effectiveBookingDate);
        }
      } catch (e) {
        computedVisitTime = new Date(effectiveBookingDate);
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

    const isServiceBooking = isService || !!computedVisitTime;
    let finalPaymentStatus = 'unpaid';
    let order = null;

    // Wrap slot locking / stock decrement, wallet operations, and Order.create in a single MongoDB transaction
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // 1. Service Slot Locking: Prevent double-booking on same service listing and slot
        if (isServiceBooking && computedVisitTime && !isNaN(computedVisitTime.getTime())) {
          const existingBooking = await Order.findOne({
            listing: listingId,
            scheduledVisitTime: computedVisitTime,
            status: { $nin: ['cancelled', 'rejected'] },
          }).session(session);

          if (existingBooking) {
            throw ApiError.badRequest(
              `This time slot (${computedVisitTime.toLocaleString('en-IN')}) is already booked for this service. Please select another slot.`
            );
          }
        }

        // 2. Inventory Concurrency: Atomic conditional stock decrement for product listings
        if (!isServiceBooking) {
          const updatedListing = await Listing.findOneAndUpdate(
            { _id: listingId, stock: { $gte: effectiveQty } },
            { $inc: { stock: -effectiveQty } },
            { session, new: true }
          );

          if (!updatedListing) {
            throw ApiError.badRequest(
              `Insufficient stock available for "${listing.title}". Please reduce your quantity or choose another item.`
            );
          }
        }

        // 3. If wallet payment is explicitly chosen, check and debit wallet
        if (paymentMethod === 'wallet') {
          const User = require('../models/User');
          const freshUser = await User.findById(req.user._id).session(session);
          if (!freshUser || (freshUser.walletBalance || 0) < finalPayable) {
            throw ApiError.badRequest('Insufficient wallet balance to place this order with Wallet. You can choose Vendor UPI/QR/Cash payment.');
          }

          await walletRepository.updateWalletBalance(
            req.user._id,
            -finalPayable,
            'payment',
            null,
            `Ordered: "${listing.title}"`,
            session
          );

          await walletRepository.updateWalletBalance(
            listing.vendor._id,
            finalPayable,
            'deposit',
            null,
            `Received payment for order: "${listing.title}"`,
            session
          );

          finalPaymentStatus = 'paid';
        }

        const itemSnapshot = {
          title: listing.title || 'Product/Service',
          sku: listing.sku || '',
          unitPrice: unitPrice,
          images: Array.isArray(listing.images) && listing.images.length > 0
            ? listing.images
            : (listing.media?.url ? [listing.media.url] : (listing.thumbnail ? [listing.thumbnail] : [])),
          variantDetails: req.body.variantDetails || req.body.selectedVariant || null,
          vendorShopName: listing.vendor?.vendorProfile?.shopName || listing.vendor?.shopName || listing.vendor?.businessName || listing.vendor?.name || 'Vendor',
          vendorId: listing.vendor?._id || listing.vendor,
          category: listing.category || '',
          listingType: isServiceBooking ? 'service' : 'product',
        };

        const [createdOrder] = await Order.create([{
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
          itemSnapshot,
          idempotencyKey,
          shiprocketDetails: {
            syncStatus: isServiceBooking ? 'not_applicable' : 'pending',
          },
        }], { session });

        order = createdOrder;
      });
    } finally {
      await session.endSession();
    }

    // Notify vendor using centralized notificationService
    const methodLabel = paymentMethod === 'wallet' ? 'Wallet' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Vendor UPI / QR / Bank Transfer';
    const notifTitle = isServiceBooking ? 'New Service Booking Received' : 'New Product Order Received';
    const notifMsg = `${req.user.name} placed order for ${effectiveQty}x "${listing.title}" (Total: ₹${finalPayable}${validatedCouponDiscount > 0 ? ` with ₹${validatedCouponDiscount} coupon discount` : ''}) via ${methodLabel}.`;

    try {
      await notificationService.create(
        listing.vendor._id.toString(),
        'order',
        notifTitle,
        notifMsg,
        { orderId: order._id, isService: isServiceBooking },
        '/vendor/orders',
        'vendor'
      ).catch(() => {});
    } catch (notifErr) {
      console.warn('Notification error on order creation:', notifErr?.message);
    }

    logger.info('[Order Lifecycle] Order created successfully', {
      orderId: order._id,
      customerId: req.user._id,
      vendorId: listing.vendor._id,
      price: finalPayable,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      isService: isServiceBooking,
      idempotencyKey,
    });

    try {
      const { emitToAdmin } = require('../sockets');
      emitToAdmin('admin:update', { tags: ['AdminOrders', 'AdminOverview', 'AdminUsers'] });
    } catch (err) {}

    // Asynchronously trigger Shiprocket fulfillment in background for prepaid/COD product orders
    if (!isServiceBooking && (finalPaymentStatus === 'paid' || paymentMethod === 'cod')) {
      const shiprocketService = require('../services/shiprocket.service');
      shiprocketService.fulfillOrder(order._id).catch(err => {
        console.warn('Non-blocking Shiprocket fulfillment error in create:', err?.message);
      });
    }

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

    const formattedOrders = orders.map(attachSnapshotFallback);

    return ApiResponse.paginated(res, 'Orders retrieved successfully.', formattedOrders, {
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

    // Customer-initiated cancellation status gate
    if (isCustomer && !isVendor && !isAdmin) {
      if (['shipped', 'out_for_delivery', 'delivered'].includes(order.status)) {
        throw ApiError.badRequest(
          `Cannot cancel order: The order has already been ${order.status.replace(/_/g, ' ')}. It cannot be cancelled once dispatched.`
        );
      }
      if (!['pending', 'accepted'].includes(order.status)) {
        throw ApiError.badRequest(
          `Customer cancellation is only allowed while the order is pending or accepted. Current status: "${order.status}".`
        );
      }
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

    const formattedOrders = orders.map(attachSnapshotFallback);

    return ApiResponse.paginated(res, 'Vendor orders retrieved successfully.', formattedOrders, {
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

    attachSnapshotFallback(order);

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

    // Explicit State Machine Transition Rules
    if (status && previousStatus !== newStatus) {
      const isService = !!order.scheduledVisitTime ||
        order.itemSnapshot?.listingType === 'service' ||
        order.listing?.type === 'service' ||
        order.listing?.postType === 'service' ||
        order.listing?.postType === 'services';

      const transitionMap = isService ? ALLOWED_BOOKING_TRANSITIONS : ALLOWED_ORDER_TRANSITIONS;
      const allowedTargets = transitionMap[previousStatus] || [];

      if (!allowedTargets.includes(newStatus)) {
        if (isAdmin) {
          logger.warn('[Order Lifecycle] Admin override state transition', {
            orderId: order._id,
            previousStatus,
            newStatus,
            adminId: req.user._id,
          });
        } else {
          throw ApiError.badRequest(
            `Invalid status transition: Cannot change ${isService ? 'booking' : 'order'} from "${previousStatus}" to "${newStatus}". Allowed transitions: ${allowedTargets.length > 0 ? allowedTargets.map(s => `"${s}"`).join(', ') : 'None (terminal state)'}.`
          );
        }
      }
    }

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

    logger.info('[Order Lifecycle] State transition completed', {
      orderId: order._id,
      previousStatus,
      newStatus,
      actorId: req.user._id,
      role: req.user.activeRole || req.user.role,
      deliveryStatus: order.deliveryStatus,
      trackingNumber: order.trackingNumber,
    });

    // Trigger Shiprocket fulfillment for product orders if becoming paid or accepted/processing
    const isService = !!order.scheduledVisitTime ||
      order.itemSnapshot?.listingType === 'service' ||
      order.listing?.type === 'service' ||
      order.listing?.postType === 'service' ||
      order.listing?.postType === 'services';

    const isSyncNeeded = !isService &&
      order.shiprocketDetails?.syncStatus !== 'synced' &&
      (order.paymentStatus === 'paid' || ['accepted', 'processing'].includes(newStatus));

    if (isSyncNeeded) {
      const shiprocketService = require('../services/shiprocket.service');
      shiprocketService.fulfillOrder(order._id).catch(err => {
        console.warn('Non-blocking Shiprocket fulfillment error in updateStatus:', err?.message);
      });
    }

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
      if (customerId && previousStatus !== newStatus) {
        const notifTitle = newStatus === 'accepted' ? (isService ? 'Service Booking Confirmed! 🎉' : 'Order Accepted! 🎉') : `Order Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`;
        const notifMsg = `Your order for "${order.itemSnapshot?.title || order.listing?.title || 'Item'}" has been ${actionText}.${trackingNumber ? ` (Tracking #: ${trackingNumber})` : ''}`;

        await notificationService.create(
          customerId,
          'order',
          notifTitle,
          notifMsg,
          { orderId: order._id, status: newStatus, trackingNumber, isService },
          '/customer/activities?tab=orders',
          'customer'
        ).catch(() => {});

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

  syncShiprocket = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id).populate('listing').populate('customer').populate('vendor');
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    const vendorId = (order.vendor?._id || order.vendor || '').toString();
    const userId = (req.user?._id || '').toString();
    const isAdmin = (req.user.roles && req.user.roles.includes('admin')) || req.user.role === 'admin' || req.user.activeRole === 'admin';

    if (vendorId !== userId && !isAdmin) {
      throw ApiError.forbidden('Only the vendor or admin can trigger Shiprocket fulfillment sync.');
    }

    const shiprocketService = require('../services/shiprocket.service');
    const updatedOrder = await shiprocketService.fulfillOrder(order._id);

    return ApiResponse.ok(res, 'Shiprocket sync completed.', {
      order: updatedOrder || order,
      shiprocketDetails: updatedOrder?.shiprocketDetails || order.shiprocketDetails,
    });
  });

  trackOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    const customerId = (order.customer?._id || order.customer || '').toString();
    const vendorId = (order.vendor?._id || order.vendor || '').toString();
    const userId = (req.user?._id || '').toString();
    const isAdmin = (req.user.roles && req.user.roles.includes('admin')) || req.user.role === 'admin' || req.user.activeRole === 'admin';

    if (customerId !== userId && vendorId !== userId && !isAdmin) {
      throw ApiError.forbidden('Unauthorized to track this order.');
    }

    const shiprocketService = require('../services/shiprocket.service');
    let trackingInfo = null;
    try {
      trackingInfo = await shiprocketService.syncShipmentTracking(order._id);
    } catch (trackErr) {
      console.warn('Live Shiprocket track warning:', trackErr?.message);
    }

    return ApiResponse.ok(res, 'Tracking details retrieved successfully.', {
      orderId: order._id,
      trackingNumber: order.trackingNumber || order.shiprocketDetails?.awbCode,
      shiprocketDetails: order.shiprocketDetails,
      liveTracking: trackingInfo?.trackingData || null,
      deliveryStatus: order.deliveryStatus,
      status: order.status,
    });
  });

  handleShiprocketWebhook = asyncHandler(async (req, res) => {
    const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    if (secret) {
      const incomingSecret = req.headers['x-api-key'] || req.headers['x-shiprocket-token'] || req.query.secret;
      if (incomingSecret !== secret) {
        return res.status(401).json({ success: false, message: 'Invalid webhook signature or secret.' });
      }
    }

    const shiprocketService = require('../services/shiprocket.service');
    const result = await shiprocketService.handleTrackingWebhook(req.body);

    return res.status(200).json({
      success: true,
      message: 'Shiprocket tracking webhook processed successfully.',
      result,
    });
  });
}

module.exports = new OrderController();
