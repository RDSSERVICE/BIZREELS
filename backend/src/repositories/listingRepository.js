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
    return Listing.findById(id).populate('vendor', 'name avatarUrl activeRole phone email vendorProfile location');
  }

  async updateListing(id, vendorId, updateData) {
    return Listing.findOneAndUpdate(
      { _id: id, vendor: vendorId },
      updateData,
      { returnDocument: 'after' }
    );
  }

  async softDeleteListing(id, vendorId) {
    return Listing.findOneAndUpdate(
      { _id: id, vendor: vendorId },
      { isDeleted: true, deletedAt: new Date() },
      { returnDocument: 'after' }
    );
  }

  /**
   * Complex query support for listings with pagination and aggregation.
   */
  async queryListings({
    currentUserId,
    vendor,
    type,
    category,
    subcategory,
    minPrice,
    maxPrice,
    condition,
    status,
    rating,
    coordinates,
    distanceKm,
    search,
    page = 1,
    limit = 10,
  }) {
    const skip = (page - 1) * limit;
    const match = { isDeleted: false };

    if (vendor) {
      if (mongoose.Types.ObjectId.isValid(vendor)) {
        match.vendor = new mongoose.Types.ObjectId(vendor);
      } else {
        match.vendor = vendor;
      }
    }
    if (type) match.type = type;
    if (category) match.category = category;
    if (subcategory) match.subcategory = subcategory;
    if (condition) match.condition = condition;
    if (status) match.status = status;

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
      const geoNear = {
        near: { type: 'Point', coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])] },
        distanceField: 'distance',
        query: match,
        spherical: true,
      };
      if (distanceKm !== undefined && distanceKm !== null) {
        geoNear.maxDistance = distanceKm * 1000; // convert to meters
      }
      pipeline.push({
        $geoNear: geoNear,
      });
    } else {
      pipeline.push({ $match: match });
    }

    // Personalization sorting: followedVendor desc, user interests match
    let followedIds = [];
    let interestCond = 0;
    if (currentUserId) {
      try {
        const followService = require('../services/follow.service');
        const ids = await followService.followingIds(currentUserId);
        followedIds = ids.map(id => new mongoose.Types.ObjectId(id));
      } catch (err) {
        console.error('Error fetching followed IDs for listing feed:', err);
      }
      try {
        const User = require('../models/User');
        const user = await User.findById(currentUserId).select('customerProfile.interests').lean();
        if (user && user.customerProfile && Array.isArray(user.customerProfile.interests) && user.customerProfile.interests.length > 0) {
          const orConditions = user.customerProfile.interests.map(i => {
            if (!i.subcategory) {
              // Only category selected: match any subcategory under this category
              return { $eq: ['$category', i.category] };
            } else {
              // Both category and subcategory must match
              return {
                $and: [
                  { $eq: ['$category', i.category] },
                  { $eq: ['$subcategory', i.subcategory] }
                ]
              };
            }
          });
          interestCond = {
            $cond: [{ $or: orConditions }, 1, 0]
          };
        }
      } catch (err) {
        console.error('Error fetching user interests for listing feed:', err);
      }
    }

    if (currentUserId) {
      pipeline.push({
        $addFields: {
          followedVendor: {
            $cond: [{ $in: ['$vendor', followedIds] }, 1, 0]
          },
          interestMatch: interestCond
        }
      });
      pipeline.push({ $sort: { followedVendor: -1, interestMatch: -1, isBoosted: -1, createdAt: -1 } });
    } else if (!coordinates) {
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
        shortDescription: 1,
        category: 1,
        subcategory: 1,
        price: 1,
        salePrice: 1,
        actualPrice: 1,
        sellingPrice: 1,
        stock: 1,
        discount: 1,
        condition: 1,
        status: { $ifNull: ['$status', 'published'] },
        labels: 1,
        offers: 1,
        serviceDetails: 1,
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
          phone: '$vendorDetails.phone',
          vendorProfile: '$vendorDetails.vendorProfile',
          businessName: { $ifNull: ['$vendorDetails.vendorProfile.businessName', '$vendorDetails.name'] },
          rating: '$vendorDetails.vendorProfile.rating',
          offers: '$vendorDetails.vendorProfile.offers',
          location: '$vendorDetails.location',
          city: { $ifNull: ['$vendorDetails.location.city', '$vendorDetails.city', '$vendorDetails.vendorProfile.city'] },
          pincode: { $ifNull: ['$vendorDetails.location.pincode', '$vendorDetails.vendorProfile.pincode'] },
          address: { $ifNull: ['$vendorDetails.location.address', '$vendorDetails.vendorProfile.address'] },
        },
      },
    });

    const listings = await Listing.aggregate(pipeline);
    
    let total;
    const limitNum = parseInt(limit, 10) || 10;
    const pageNum = parseInt(page, 10) || 1;
    if (pageNum === 1 && listings.length < limitNum) {
      total = listings.length;
    } else {
      total = await Listing.countDocuments(match);
    }

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