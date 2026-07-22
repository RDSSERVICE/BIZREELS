const listingService = require('../services/listing.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * ListingController
 * Handles endpoint routes for Product/Service listings management and discovery.
 */
class ListingController {
  // ── Create Listing ──────────────────────────────────────
  create = asyncHandler(async (req, res) => {
    const payload = {
      ...req.body,
      vendorId: req.user._id,
      price: req.body.price ? parseFloat(req.body.price) : req.body.actualPrice ? parseFloat(req.body.actualPrice) : 0,
      salePrice: req.body.salePrice ? parseFloat(req.body.salePrice) : req.body.sellingPrice ? parseFloat(req.body.sellingPrice) : undefined,
    };

    const listing = await listingService.createListing(payload, req);
    return ApiResponse.created(res, 'Listing posted successfully.', { listing });
  });

  // ── Update Listing ──────────────────────────────────────
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await listingService.updateListing(id, req.user._id, req.body, req);
    return ApiResponse.ok(res, 'Listing updated successfully.', { listing: updated });
  });

  // ── Delete Listing ──────────────────────────────────────
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await listingService.deleteListing(id, req.user._id, req);
    return ApiResponse.ok(res, result.message);
  });

  // ── Get Listings (Discovery Feed) ──────────────────────
  getListings = asyncHandler(async (req, res) => {
    const {
      vendor,
      type,
      category,
      subcategory,
      minPrice,
      maxPrice,
      condition,
      status,
      rating,
      lat,
      lng,
      distance,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const result = await listingService.queryListings({
      vendor,
      type,
      category,
      subcategory,
      minPrice,
      maxPrice,
      condition,
      status,
      rating,
      lat,
      lng,
      distance,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return ApiResponse.paginated(res, 'Listings retrieved successfully.', result.listings, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    });
  });

  // ── Get Single Listing Details ──────────────────────────
  getListingDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const listing = await listingService.getListingDetails(id);
    return ApiResponse.ok(res, 'Listing details retrieved.', { listing });
  });

  // ── AI Generator Copy ───────────────────────────────────
  generateAICopy = asyncHandler(async (req, res) => {
    const { title, category, type } = req.body;
    const copy = await listingService.generateAICopy({ userId: req.user._id, title, category, type });
    return ApiResponse.ok(res, 'AI content synthesized.', copy);
  });

  // ── Save Listing ────────────────────────────────────────
  save = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userModel = require('../models/User');
    
    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { 'customerProfile.savedListings': id } },
      { returnDocument: 'after' }
    ).select('-password -__v')
    .populate({
      path: 'customerProfile.savedListings',
      populate: { path: 'vendor', select: 'name businessName activeRole avatarUrl' }
    })
    .populate('following', 'name avatarUrl activeRole roles vendorProfile creatorProfile');

    return ApiResponse.ok(res, 'Listing saved successfully.', { user });
  });

  // ── Unsave Listing ──────────────────────────────────────
  unsave = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userModel = require('../models/User');

    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { $pull: { 'customerProfile.savedListings': id } },
      { returnDocument: 'after' }
    ).select('-password -__v')
    .populate({
      path: 'customerProfile.savedListings',
      populate: { path: 'vendor', select: 'name businessName activeRole avatarUrl' }
    })
    .populate('following', 'name avatarUrl activeRole roles vendorProfile creatorProfile');

    return ApiResponse.ok(res, 'Listing unsaved successfully.', { user });
  });
}

module.exports = new ListingController();
