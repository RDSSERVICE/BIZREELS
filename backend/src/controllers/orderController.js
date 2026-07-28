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
    const { listingId, quantity, address } = req.body;
    const listing = await Listing.findById(listingId).populate('vendor');
    if (!listing) {
      throw ApiError.notFound('Listing not found');
    }

    const price = (listing.salePrice || listing.price) * (quantity || 1);
    
    // Check wallet balance
    if (req.user.walletBalance < price) {
      throw ApiError.badRequest('Insufficient wallet balance to place this order.');
    }

    // Debit customer, credit vendor
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

    const order = await Order.create({
      customer: req.user._id,
      listing: listingId,
      vendor: listing.vendor._id,
      quantity: quantity || 1,
      price,
      status: 'pending',
      paymentStatus: 'paid',
      address,
    });

    // Notify vendor
    const notifyVendor = await Notification.create({
      recipient: listing.vendor._id,
      sender: req.user._id,
      type: 'payment',
      title: 'New Product Order Received',
      message: `${req.user.name} ordered ${quantity || 1}x "${listing.title}" for ₹${price}. Paid successfully.`,
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
      const matchedListings = await Listing.find({
        $or: [{ title: searchRegex }, { category: searchRegex }]
      }).select('_id').lean();
      const listingIds = matchedListings.map(l => l._id);

      const User = require('../models/User');
      const matchedUsers = await User.find({
        $or: [{ name: searchRegex }, { 'vendorProfile.shopName': searchRegex }]
      }).select('_id').lean();
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

    const total = await Order.countDocuments(baseQuery);
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const orders = await Order.find(baseQuery)
      .populate('customer', 'name email avatarUrl phone')
      .populate('vendor', 'name email avatarUrl phone businessName vendorProfile')
      .populate('listing', 'title images type category actualPrice sellingPrice price discount stock status')
      .sort(sort)
      .skip(skip)
      .limit(parsedLimit)
      .lean();

    return ApiResponse.paginated(res, 'Orders retrieved successfully.', orders, {
      page: parsedPage,
      limit: parsedLimit,
      total,
    });
  });

  cancel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id).populate('listing').populate('customer').populate('vendor');
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.customer._id.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('Unauthorized to cancel this order.');
    }

    if (order.status !== 'pending') {
      throw ApiError.badRequest('Only pending orders can be cancelled.');
    }

    // Refund customer wallet and debit vendor
    await walletRepository.updateWalletBalance(
      order.customer._id,
      order.price,
      'refund',
      order._id,
      `Refund for cancelled order: "${order.listing?.title || 'Order Item'}"`
    );

    await walletRepository.updateWalletBalance(
      order.vendor._id,
      -order.price,
      'payment',
      order._id,
      `Debit for cancelled order: "${order.listing?.title || 'Order Item'}"`
    );

    order.status = 'cancelled';
    order.deliveryStatus = 'cancelled';
    await order.save();

    // Notify vendor
    const notifyVendor = await Notification.create({
      recipient: order.vendor._id,
      sender: req.user._id,
      type: 'payment',
      title: 'Order Cancelled by Customer',
      message: `${req.user.name} has cancelled the order for "${order.listing?.title || 'Order Item'}". Wallet amount ₹${order.price} has been refunded.`,
      data: { orderId: order._id },
    });
    emitToUser(order.vendor._id.toString(), 'notification', notifyVendor);

    // Notify customer
    const notifyCustomer = await Notification.create({
      recipient: order.customer._id,
      sender: req.user._id,
      type: 'payment',
      title: 'Order Cancelled Successfully',
      message: `Your order for "${order.listing?.title || 'Order Item'}" has been cancelled. Wallet amount ₹${order.price} refunded.`,
      data: { orderId: order._id },
    });
    emitToUser(order.customer._id.toString(), 'notification', notifyCustomer);

    // Socket updates
    emitToUser(order.vendor._id.toString(), 'order:updated', order);
    emitToUser(order.customer._id.toString(), 'order:updated', order);

    try {
      const { emitToAdmin } = require('../sockets');
      emitToAdmin('admin:update', { tags: ['AdminOrders', 'AdminOverview'] });
    } catch (err) {}

    return ApiResponse.ok(res, 'Order cancelled and refunded successfully.', { order });
  });
}

module.exports = new OrderController();
