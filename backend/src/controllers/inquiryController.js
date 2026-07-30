const Inquiry = require('../models/Inquiry');
const Listing = require('../models/Listing');
const Notification = require('../models/Notification');
const { emitToUser } = require('../sockets');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

class InquiryController {
  create = asyncHandler(async (req, res) => {
    const { listingId, message } = req.body;
    const listing = await Listing.findById(listingId).populate('vendor');
    if (!listing) {
      throw ApiError.notFound('Listing not found');
    }

    const inquiry = await Inquiry.create({
      customer: req.user._id,
      listing: listingId,
      vendor: listing.vendor._id,
      message,
      status: 'pending',
    });

    // Notify vendor
    const notifyVendor = await Notification.create({
      recipient: listing.vendor._id,
      sender: req.user._id,
      type: 'message',
      title: 'New Listing Inquiry',
      message: `${req.user.name} sent an enquiry regarding "${listing.title}": "${message}"`,
      data: { inquiryId: inquiry._id },
    });
    emitToUser(listing.vendor._id.toString(), 'notification', notifyVendor);

    return ApiResponse.created(res, 'Inquiry sent successfully.', { inquiry });
  });

  getInquiries = asyncHandler(async (req, res) => {
    const { search, status, page = 1, limit = 10 } = req.query;

    const baseQuery = {
      $or: [{ customer: req.user._id }, { vendor: req.user._id }],
      isDeleted: { $ne: true }
    };

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
        { $or: baseQuery.$or },
        {
          $or: [
            { message: searchRegex },
            { listing: { $in: listingIds } },
            { vendor: { $in: userIds } },
            { customer: { $in: userIds } }
          ]
        }
      ];
      delete baseQuery.$or;
    }

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, inquiries] = await Promise.all([
      Inquiry.countDocuments(baseQuery),
      Inquiry.find(baseQuery)
        .populate('customer', 'name email avatarUrl phone')
        .populate('vendor', 'name email avatarUrl phone businessName vendorProfile')
        .populate('listing', 'title images type category actualPrice sellingPrice price discount status')
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

  close = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const inquiry = await Inquiry.findOne({
      _id: id,
      $or: [{ customer: req.user._id }, { vendor: req.user._id }]
    });

    if (!inquiry) {
      throw ApiError.notFound('Inquiry not found');
    }

    inquiry.status = 'closed';
    await inquiry.save();

    // Socket updates
    emitToUser(inquiry.customer.toString(), 'inquiry:updated', inquiry);
    emitToUser(inquiry.vendor.toString(), 'inquiry:updated', inquiry);

    return ApiResponse.ok(res, 'Inquiry closed successfully.', { inquiry });
  });

  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const inquiry = await Inquiry.findOne({
      _id: id,
      $or: [{ customer: req.user._id }, { vendor: req.user._id }]
    });

    if (!inquiry) {
      throw ApiError.notFound('Inquiry not found');
    }

    inquiry.isDeleted = true;
    inquiry.deletedAt = new Date();
    await inquiry.save();

    // Socket updates
    emitToUser(inquiry.customer.toString(), 'inquiry:deleted', { id });
    emitToUser(inquiry.vendor.toString(), 'inquiry:deleted', { id });

    return ApiResponse.ok(res, 'Inquiry deleted successfully.');
  });
}

module.exports = new InquiryController();
