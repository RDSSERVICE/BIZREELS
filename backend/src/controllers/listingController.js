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
      currentUserId: req.userId || null,
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
    try {
      await listingService.incrementViews(id);
    } catch (err) {
      console.error('Failed to auto-increment listing view count:', err);
    }
    const listing = await listingService.getListingDetails(id);
    return ApiResponse.ok(res, 'Listing details retrieved.', { listing });
  });

  // ── AI Generator Copy ───────────────────────────────────
  generateAICopy = asyncHandler(async (req, res) => {
    const { title, category, type } = req.body;
    const copy = await listingService.generateAICopy({ userId: req.user._id, title, category, type });
    return ApiResponse.ok(res, 'AI content synthesized.', copy);
  });

  // ── Duplicate Listing ──────────────────────────────────
  duplicate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const duplicated = await listingService.duplicateListing(id, req.user._id, req);
    return ApiResponse.created(res, 'Listing duplicated successfully.', { listing: duplicated });
  });

  // ── Bulk Update Listings ───────────────────────────────
  bulkUpdate = asyncHandler(async (req, res) => {
    const { ids, action, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return ApiResponse.badRequest(res, 'Listing IDs array is required.');
    }
    const result = await listingService.bulkUpdateListings(ids, action || 'status', { status }, req.user._id, req);
    return ApiResponse.ok(res, result.message, { updated: result.updated });
  });

  // ── Get Listing Analytics ──────────────────────────────
  getAnalytics = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const analytics = await listingService.getListingAnalytics(id, req.user._id);
    return ApiResponse.ok(res, 'Listing analytics retrieved.', analytics);
  });

  // ── Update Stock ───────────────────────────────────────
  updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
    const listing = await listingService.updateStock(id, req.user._id, stock, req);
    return ApiResponse.ok(res, 'Stock updated successfully.', { listing });
  });

  // ── Save Listing ────────────────────────────────────────
  save = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userModel = require('../models/User');
    const Interaction = require('../models/Interaction');
    const Listing = require('../models/Listing');

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

    // Sync with Interaction collection and Listing saves_count
    const existing = await Interaction.findOne({ user_id: req.user._id.toString(), listing_id: id, type: 'save' });
    if (!existing) {
      await Interaction.create({
        user_id: req.user._id.toString(),
        listing_id: id,
        type: 'save',
      });
      await Listing.updateOne({ _id: id }, { $inc: { saves_count: 1 } });

      // Emit listing event for analytics!
      try {
        const eventService = require('../services/event.service');
        await eventService.emit({
          listing_id: id,
          event_type: 'save',
          user_id: req.user._id,
        });
      } catch (err) {
        console.error('Failed to emit listing save event:', err);
      }
    }

    const updatedListing = await Listing.findById(id);
    return ApiResponse.ok(res, 'Listing saved successfully.', {
      user,
      active: true,
      count: updatedListing ? (updatedListing.saves_count || 0) : 0
    });
  });

  // ── Unsave Listing ──────────────────────────────────────
  unsave = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userModel = require('../models/User');
    const Interaction = require('../models/Interaction');
    const Listing = require('../models/Listing');

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

    // Sync with Interaction collection and Listing saves_count
    const existing = await Interaction.findOne({ user_id: req.user._id.toString(), listing_id: id, type: 'save' });
    if (existing) {
      await Interaction.deleteOne({ _id: existing._id });
      await Listing.updateOne({ _id: id }, { $inc: { saves_count: -1 } });
    }

    const updatedListing = await Listing.findById(id);
    return ApiResponse.ok(res, 'Listing unsaved successfully.', {
      user,
      active: false,
      count: updatedListing ? (updatedListing.saves_count || 0) : 0
    });
  });

  // ── Save Image Post ──────────────────────────────────────
  saveImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userModel = require('../models/User');
    const Interaction = require('../models/Interaction');
    const Listing = require('../models/Listing');

    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { 'customerProfile.savedListings': id } },
      { returnDocument: 'after' }
    ).select('-password -__v');

    const existing = await Interaction.findOne({ user_id: req.user._id.toString(), listing_id: id, type: 'save_image' });
    if (!existing) {
      await Interaction.create({
        user_id: req.user._id.toString(),
        listing_id: id,
        type: 'save_image',
      });
      await Listing.updateOne({ _id: id }, { $inc: { saves_count: 1 } });
    }

    const updatedListing = await Listing.findById(id);
    return ApiResponse.ok(res, 'Image post saved successfully.', {
      user,
      active: true,
      count: updatedListing ? (updatedListing.saves_count || 0) : 0
    });
  });

  // ── Unsave Image Post ────────────────────────────────────
  unsaveImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userModel = require('../models/User');
    const Interaction = require('../models/Interaction');
    const Listing = require('../models/Listing');

    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { $pull: { 'customerProfile.savedListings': id } },
      { returnDocument: 'after' }
    ).select('-password -__v');

    const existing = await Interaction.findOne({ user_id: req.user._id.toString(), listing_id: id, type: 'save_image' });
    if (existing) {
      await Interaction.deleteOne({ _id: existing._id });
      await Listing.updateOne({ _id: id }, { $inc: { saves_count: -1 } });
    }

    const updatedListing = await Listing.findById(id);
    return ApiResponse.ok(res, 'Image post unsaved successfully.', {
      user,
      active: false,
      count: updatedListing ? (updatedListing.saves_count || 0) : 0
    });
  });
}

module.exports = new ListingController();