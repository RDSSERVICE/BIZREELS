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
    const orders = await Order.find({
      $or: [{ customer: req.user._id }, { vendor: req.user._id }]
    })
    .populate('customer', 'name email avatarUrl phone')
    .populate('vendor', 'name email avatarUrl phone businessName')
    .populate('listing', 'title images type category')
    .sort({ createdAt: -1 });

    return ApiResponse.ok(res, 'Orders retrieved successfully.', { orders });
  });
}

module.exports = new OrderController();
