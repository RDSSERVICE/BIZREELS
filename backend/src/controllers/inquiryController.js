const Inquiry = require('../models/Inquiry');
const Listing = require('../models/Listing');
const Notification = require('../models/Notification');
const { emitToUser } = require('../sockets');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

class InquiryController {
  create = asyncHandler(async (req, res) => {
    const { listingId, reelId, vendorId: requestedVendorId, message } = req.body;

    if (!message || !message.trim()) {
      throw ApiError.badRequest('Inquiry message is required.');
    }

    let listing = null;
    let reel = null;
    let targetVendorId = requestedVendorId;

    if (listingId) {
      listing = await Listing.findById(listingId).populate('vendor');
      if (listing) {
        targetVendorId = listing.vendor?._id || listing.vendor;
      }
    }

    if (reelId) {
      const Reel = require('../models/Reel');
      reel = await Reel.findById(reelId).populate('creator');
      if (reel) {
        if (!targetVendorId) {
          targetVendorId = reel.creator?._id || reel.creator;
        }
      }
    }

    if (!targetVendorId) {
      throw ApiError.badRequest('Vendor not found for this listing or reel.');
    }

    // Ensure the customer is not sending an inquiry to themselves
    if (targetVendorId.toString() === req.user._id.toString()) {
      throw ApiError.badRequest('You cannot send an enquiry to your own listing or reel.');
    }

    const inquiry = await Inquiry.create({
      customer: req.user._id,
      listing: listing?._id || null,
      reel: reel?._id || null,
      vendor: targetVendorId,
      message: message.trim(),
      status: 'sent',
    });

    // Notify ONLY the specific vendor who owns this listing/reel
    try {
      const itemTitle = listing?.title || reel?.caption || 'your post/listing';
      const notifyVendor = await Notification.create({
        recipient: targetVendorId,
        sender: req.user._id,
        type: 'message',
        title: 'New Customer Inquiry',
        message: `${req.user.name || 'A customer'} sent an enquiry regarding "${itemTitle}": "${message.trim()}"`,
        data: { inquiryId: inquiry._id, url: '/vendor/leads?tab=all-enquiries' },
      });
      emitToUser(targetVendorId.toString(), 'notification', notifyVendor);
      emitToUser(targetVendorId.toString(), 'inquiry:created', inquiry);
    } catch (notifErr) {
      console.error('Failed to notify vendor of new inquiry:', notifErr);
    }

    return ApiResponse.created(res, 'Inquiry sent successfully to vendor.', { inquiry });
  });

  getInquiries = asyncHandler(async (req, res) => {
    const { search, status, role, page = 1, limit = 50 } = req.query;

    const activeRole = role || req.user.current_role || req.user.activeRole;
    const baseQuery = { isDeleted: { $ne: true } };

    // Role-specific isolation:
    // Vendor ONLY sees inquiries sent to them as a vendor
    // Customer ONLY sees inquiries they submitted as a customer
    if (activeRole === 'vendor') {
      baseQuery.vendor = req.user._id;
    } else if (activeRole === 'customer') {
      baseQuery.customer = req.user._id;
    } else {
      baseQuery.$or = [{ customer: req.user._id }, { vendor: req.user._id }];
    }

    if (status) {
      baseQuery.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchedListings = await Listing.find({
        $or: [{ title: searchRegex }, { category: searchRegex }]
      }).select('_id');
      const listingIds = matchedListings.map(l => l._id);

      const User = require('../models/User');
      const matchedUsers = await User.find({
        $or: [{ name: searchRegex }, { 'vendorProfile.shopName': searchRegex }]
      }).select('_id');
      const userIds = matchedUsers.map(u => u._id);

      baseQuery.$and = [
        {
          $or: [
            { message: searchRegex },
            { listing: { $in: listingIds } },
            { vendor: { $in: userIds } },
            { customer: { $in: userIds } }
          ]
        }
      ];
    }

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 50;
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, inquiries] = await Promise.all([
      Inquiry.countDocuments(baseQuery),
      Inquiry.find(baseQuery)
        .populate('customer', 'name email avatarUrl phone profile_pic')
        .populate('vendor', 'name email avatarUrl phone businessName vendorProfile profile_pic')
        .populate('listing', 'title images type category actualPrice sellingPrice price discount status')
        .populate('reel', 'title caption videoUrl thumbnail views likesCount mediaType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
    ]);

    return ApiResponse.paginated(res, 'Inquiries retrieved successfully.', inquiries, {
      page: parsedPage,
      limit: parsedLimit,
      total,
    });
  });

  reply = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    if (!message || !message.trim()) {
      throw ApiError.badRequest('Reply message is required.');
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid inquiry ID format.');
    }

    const inquiry = await Inquiry.findById(id)
      .populate('listing', 'title')
      .populate('reel', 'caption title')
      .populate('customer', 'name email');

    if (!inquiry) {
      // Check if it was soft-deleted
      const deletedInquiry = await Inquiry.findOne({ _id: id, isDeleted: true }).setOptions({ includeSoftDeleted: true });
      if (deletedInquiry) {
        throw ApiError.notFound('Inquiry has already been deleted or removed.');
      }
      throw ApiError.notFound('Inquiry not found.');
    }

    const isAuthorizedVendor = inquiry.vendor && inquiry.vendor.toString() === req.user._id.toString();
    const isAdmin = req.user.roles?.includes('admin');

    if (!isAuthorizedVendor && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to reply to this inquiry.');
    }

    inquiry.status = 'replied';
    inquiry.replyMessage = message.trim();
    inquiry.repliedAt = new Date();
    await inquiry.save();

    // Create Notification for customer with direct link to view their inquiries
    try {
      if (inquiry.customer?._id) {
        const itemTitle = inquiry.listing?.title || inquiry.reel?.caption || inquiry.reel?.title || 'your inquiry';
        const notifyCustomer = await Notification.create({
          recipient: inquiry.customer._id,
          sender: req.user._id,
          type: 'message',
          title: 'Seller Replied to Your Inquiry',
          message: `${req.user.vendorProfile?.shopName || req.user.name || 'Seller'} replied regarding "${itemTitle}": "${message.trim()}"`,
          data: { inquiryId: inquiry._id, url: '/customer/activities?tab=inquiries' },
        });
        emitToUser(inquiry.customer._id.toString(), 'notification', notifyCustomer);
      }
    } catch (notifErr) {
      console.error('Failed to create customer notification for inquiry reply:', notifErr);
    }

    if (inquiry.customer?._id) {
      emitToUser(inquiry.customer._id.toString(), 'inquiry:updated', inquiry);
    }
    emitToUser(req.user._id.toString(), 'inquiry:updated', inquiry);

    return ApiResponse.ok(res, 'Reply sent successfully.', { inquiry });
  });

  close = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid inquiry ID format.');
    }

    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      const deletedInquiry = await Inquiry.findOne({ _id: id, isDeleted: true }).setOptions({ includeSoftDeleted: true });
      if (deletedInquiry) {
        throw ApiError.notFound('Inquiry has already been closed or deleted.');
      }
      throw ApiError.notFound('Inquiry not found.');
    }

    const isCustomer = inquiry.customer && inquiry.customer.toString() === req.user._id.toString();
    const isVendor = inquiry.vendor && inquiry.vendor.toString() === req.user._id.toString();
    const isAdmin = req.user.roles?.includes('admin');

    if (!isCustomer && !isVendor && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to close this inquiry.');
    }

    inquiry.status = 'closed';
    await inquiry.save();

    // Socket updates
    if (inquiry.customer) emitToUser(inquiry.customer.toString(), 'inquiry:updated', inquiry);
    if (inquiry.vendor) emitToUser(inquiry.vendor.toString(), 'inquiry:updated', inquiry);

    return ApiResponse.ok(res, 'Inquiry closed successfully.', { inquiry });
  });

  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid inquiry ID format.');
    }

    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      const deletedInquiry = await Inquiry.findOne({ _id: id, isDeleted: true }).setOptions({ includeSoftDeleted: true });
      if (deletedInquiry) {
        return ApiResponse.ok(res, 'Inquiry already deleted.');
      }
      throw ApiError.notFound('Inquiry not found.');
    }

    const isCustomer = inquiry.customer && inquiry.customer.toString() === req.user._id.toString();
    const isVendor = inquiry.vendor && inquiry.vendor.toString() === req.user._id.toString();
    const isAdmin = req.user.roles?.includes('admin');

    if (!isCustomer && !isVendor && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to delete this inquiry.');
    }

    inquiry.isDeleted = true;
    inquiry.deletedAt = new Date();
    await inquiry.save();

    // Socket updates
    if (inquiry.customer) emitToUser(inquiry.customer.toString(), 'inquiry:deleted', { id });
    if (inquiry.vendor) emitToUser(inquiry.vendor.toString(), 'inquiry:deleted', { id });

    return ApiResponse.ok(res, 'Inquiry deleted successfully.');
  });
}

module.exports = new InquiryController();
