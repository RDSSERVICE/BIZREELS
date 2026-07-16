const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const AuditLog = require('../models/AuditLog');

/**
 * ListingRepository
 * Encapsulates database operations and geo-proximity search pipelines for Products/Services.
 */
class ListingRepository {
  async createListing(listingData) {
    return Listing.create(listingData);
  }

  async findListingById(id) {
    return Listing.findById(id).populate('vendor', 'name avatarUrl activeRole phone email vendorProfile');
  }

  async updateListing(id, vendorId, updateData) {
    return Listing.findOneAndUpdate(
      { _id: id, vendor: vendorId },
      updateData,
      { new: true }
    );
  }

  async softDeleteListing(id, vendorId) {
    return Listing.findOneAndUpdate(
      { _id: id, vendor: vendorId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Complex query support for listings with pagination and aggregation.
   */
  async queryListings({
    type,
    category,
    subcategory,
    minPrice,
    maxPrice,
    condition,
    rating,
    coordinates,
    distanceKm = 10,
    search,
    page = 1,
    limit = 10,
  }) {
    const skip = (page - 1) * limit;
    const match = { isDeleted: false };

    if (type) match.type = type;
    if (category) match.category = category;
    if (subcategory) match.subcategory = subcategory;
    if (condition) match.condition = condition;

    // Price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      match.price = {};
      if (minPrice !== undefined) match.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) match.price.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (rating !== undefined) {
      match.rating = { $gte: parseFloat(rating) };
    }

    // Search query match (regex)
    if (search) {
      match.title = { $regex: search, $options: 'i' };
    }

    const pipeline = [];

    // Geolocation sorting first if coordinates [lng, lat] provided
    if (coordinates && coordinates.length === 2) {
      pipeline.push({
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])] },
          distanceField: 'distance',
          maxDistance: distanceKm * 1000, // convert to meters
          query: match,
          spherical: true,
        },
      });
    } else {
      pipeline.push({ $match: match });
      pipeline.push({ $sort: { isBoosted: -1, createdAt: -1 } });
    }

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit, 10) });

    // Populate Vendor details
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'vendor',
        foreignField: '_id',
        as: 'vendorDetails',
      },
    });

    pipeline.push({ $unwind: '$vendorDetails' });

    // Project output fields
    pipeline.push({
      $project: {
        type: 1,
        title: 1,
        description: 1,
        category: 1,
        subcategory: 1,
        price: 1,
        salePrice: 1,
        discount: 1,
        condition: 1,
        images: 1,
        videos: 1,
        variants: 1,
        serviceAvailability: 1,
        location: 1,
        rating: 1,
        totalReviews: 1,
        isBoosted: 1,
        distance: 1,
        createdAt: 1,
        vendor: {
          _id: '$vendorDetails._id',
          name: '$vendorDetails.name',
          avatarUrl: '$vendorDetails.avatarUrl',
          businessName: '$vendorDetails.vendorProfile.businessName',
          rating: '$vendorDetails.vendorProfile.rating',
        },
      },
    });

    const listings = await Listing.aggregate(pipeline);
    const total = await Listing.countDocuments(match);

    return { listings, total };
  }

  async logListingAction({ userId, action, entityId, description, ip, agent }) {
    try {
      await AuditLog.create({
        userId,
        action,
        entity: 'Listing',
        entityId,
        description,
        ipAddress: ip,
        userAgent: agent,
      });
    } catch (err) {
      // safe bypass
    }
  }
}

module.exports = new ListingRepository();
