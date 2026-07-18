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
    const inquiries = await Inquiry.find({
      $or: [{ customer: req.user._id }, { vendor: req.user._id }]
    })
    .populate('customer', 'name email avatarUrl phone')
    .populate('vendor', 'name email avatarUrl phone businessName')
    .populate('listing', 'title images type category')
    .sort({ createdAt: -1 });

    return ApiResponse.ok(res, 'Inquiries retrieved successfully.', { inquiries });
  });
}

module.exports = new InquiryController();
