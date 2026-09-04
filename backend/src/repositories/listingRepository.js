const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const AuditLog = require('../models/AuditLog');

function calculateDistanceInMeters(coords1, coords2) {
  if (!Array.isArray(coords1) || coords1.length < 2 || !Array.isArray(coords2) || coords2.length < 2) {
    return null;
  }
  const lng1 = parseFloat(coords1[0]);
  const lat1 = parseFloat(coords1[1]);
  const lng2 = parseFloat(coords2[0]);
  const lat2 = parseFloat(coords2[1]);
  
  if (isNaN(lng1) || isNaN(lat1) || isNaN(lng2) || isNaN(lat2)) return null;
  if (lng1 === 0 && lat1 === 0) return null;
  if (lng2 === 0 && lat2 === 0) return null;

  const R = 6371e3; // Earth radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * ListingRepository
 * Encapsulates database operations and geo-proximity search pipelines for Products/Services.
 */
class ListingRepository {
  async createListing(listingData) {
    return Listing.create(listingData);
  }

  async findListingById(id) {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const listing = await Listing.findById(id).populate('vendor', 'name avatarUrl profile_pic activeRole phone email vendorProfile location kyc_status is_subscribed_verified isPhoneVerified isVerified is_verified rating_avg rating_count');
      if (listing) return listing;
    }
    return Listing.findOne({
      $or: [{ slug: id }, { listing_id: id }],
      is_deleted: { $ne: true }
    }).populate('vendor', 'name avatarUrl profile_pic activeRole phone email vendorProfile location kyc_status is_subscribed_verified isPhoneVerified isVerified is_verified rating_avg rating_count');
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
    verified,
    uploadDate,
    sort,
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
    if (condition && condition !== 'all') match.condition = condition;
    if (status) match.status = status;

    // Price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      match.price = {};
      if (minPrice !== undefined) match.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) match.price.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (rating !== undefined && parseFloat(rating) > 0) {
      match.$or = [
        { rating: { $gte: parseFloat(rating) } },
        { rating_avg: { $gte: parseFloat(rating) } },
      ];
    }

    // Upload Date filter
    if (uploadDate && uploadDate !== 'all') {
      const now = new Date();
      if (uploadDate === 'today') {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        match.createdAt = { $gte: startOfDay };
      } else if (uploadDate === 'this_week') {
        const pastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        match.createdAt = { $gte: pastWeek };
      } else if (uploadDate === 'this_month') {
        const pastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        match.createdAt = { $gte: pastMonth };
      }
    }

    // Search query match (regex across multiple fields)
    if (search) {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedSearch, 'i');
      match.$or = [
        { title: regex },
        { description: regex },
        { category: regex },
        { subcategory: regex },
        { brand: regex },
        { tags: regex },
        { 'labels.key': regex },
        { 'labels.value': regex }
      ];
    }

    const pipeline = [];

    // Geolocation sorting first if coordinates [lng, lat] provided and not [0, 0]
    const hasCoordinates = coordinates && coordinates.length === 2 && (parseFloat(coordinates[0]) !== 0 || parseFloat(coordinates[1]) !== 0);
    if (hasCoordinates) {
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

    // Dynamic Relevance score calculation
    if (search) {
      pipeline.push({
        $addFields: {
          relevanceScore: {
            $add: [
              // 1. Exact title match (case-insensitive) -> 1000 points
              {
                $cond: [
                  { $eq: [{ $toLower: '$title' }, search.toLowerCase()] },
                  1000,
                  0
                ]
              },
              // 2. Title partial match -> 500 points
              {
                $cond: [
                  { $regexMatch: { input: '$title', regex: search, options: 'i' } },
                  500,
                  0
                ]
              },
              // 3. Category/brand match -> 300 points
              {
                $cond: [
                  {
                    $or: [
                      { $regexMatch: { input: { $ifNull: ['$category', ''] }, regex: search, options: 'i' } },
                      { $regexMatch: { input: { $ifNull: ['$subcategory', ''] }, regex: search, options: 'i' } },
                      { $regexMatch: { input: { $ifNull: ['$brand', ''] }, regex: search, options: 'i' } }
                    ]
                  },
                  300,
                  0
                ]
              },
              // 4. Description match -> 200 points
              {
                $cond: [
                  { $regexMatch: { input: { $ifNull: ['$description', ''] }, regex: search, options: 'i' } },
                  200,
                  0
                ]
              },
              // 5. Specification/label match -> 100 points
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: {
                        $reduce: {
                          input: { $ifNull: ['$labels', []] },
                          initialValue: '',
                          in: { $concat: ['$$value', ' ', '$$this.key', ' ', '$$this.value'] }
                        }
                      },
                      regex: search,
                      options: 'i'
                    }
                  },
                  100,
                  0
                ]
              },
              // 6. Tags match -> 50 points
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: {
                        $reduce: {
                          input: { $ifNull: ['$tags', []] },
                          initialValue: '',
                          in: { $concat: ['$$value', ' ', '$$this'] }
                        }
                      },
                      regex: search,
                      options: 'i'
                    }
                  },
                  50,
                  0
                ]
              }
            ]
          }
        }
      });
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
              return { $eq: ['$category', i.category] };
            } else {
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

      const sortSpec = {};
      if (sort === 'price_low') {
        sortSpec.price = 1;
      } else if (sort === 'price_high') {
        sortSpec.price = -1;
      } else if (sort === 'rating_high') {
        sortSpec.rating = -1;
        sortSpec.rating_avg = -1;
      } else if (sort === 'popular') {
        sortSpec.viewsCount = -1;
        sortSpec.likesCount = -1;
      } else if (search) {
        sortSpec.relevanceScore = -1;
      }
      if (currentUserId) {
        sortSpec.followedVendor = -1;
        sortSpec.interestMatch = -1;
      }
      if (hasCoordinates && sort === 'nearest') {
        sortSpec.distance = 1;
      }
      sortSpec.isBoosted = -1;
      sortSpec.createdAt = -1;

      pipeline.push({ $sort: sortSpec });
    } else {
      const sortSpec = {};
      if (sort === 'price_low') {
        sortSpec.price = 1;
      } else if (sort === 'price_high') {
        sortSpec.price = -1;
      } else if (sort === 'rating_high') {
        sortSpec.rating = -1;
        sortSpec.rating_avg = -1;
      } else if (sort === 'popular') {
        sortSpec.viewsCount = -1;
        sortSpec.likesCount = -1;
      } else if (search) {
        sortSpec.relevanceScore = -1;
      }
      if (hasCoordinates && sort === 'nearest') {
        sortSpec.distance = 1;
      }
      sortSpec.isBoosted = -1;
      sortSpec.createdAt = -1;

      pipeline.push({ $sort: sortSpec });
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
        description: 1,
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
        sku: 1,
        brand: 1,
        unit: 1,
        minOrderQty: 1,
        warranty: 1,
        returnPolicy: 1,
        shippingDetails: 1,
        gst: 1,
        tags: 1,
        views: { $ifNull: ['$views', 0] },
        likes: { $ifNull: ['$likes', '$likes_count', 0] },
        likes_count: { $ifNull: ['$likes_count', '$likes', 0] },
        saves_count: { $ifNull: ['$saves_count', 0] },
        orders_count: { $ifNull: ['$orders_count', 0] },
        vendor: {
          _id: '$vendorDetails._id',
          name: '$vendorDetails.name',
          avatarUrl: '$vendorDetails.avatarUrl',
          profile_pic: '$vendorDetails.profile_pic',
          phone: '$vendorDetails.phone',
          kyc_status: '$vendorDetails.kyc_status',
          is_subscribed_verified: '$vendorDetails.is_subscribed_verified',
          isVerified: { $ifNull: ['$vendorDetails.isVerified', '$vendorDetails.is_verified', '$vendorDetails.vendorProfile.isVerified'] },
          is_verified: '$vendorDetails.is_verified',
          isPhoneVerified: '$vendorDetails.isPhoneVerified',
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

    const limitNum = parseInt(limit, 10) || 10;
    const pageNum = parseInt(page, 10) || 1;

    const [listings, rawCount] = await Promise.all([
      Listing.aggregate(pipeline),
      pageNum > 1 ? Listing.countDocuments(match) : Promise.resolve(null),
    ]);

    // Calculate/override distance based on vendor's actual profile location coordinates
    if (coordinates && coordinates.length === 2 && (parseFloat(coordinates[0]) !== 0 || parseFloat(coordinates[1]) !== 0)) {
      listings.forEach(listing => {
        const vendorCoords = listing.vendor?.location?.coordinates;
        if (vendorCoords && vendorCoords.length === 2) {
          const dist = calculateDistanceInMeters(coordinates, vendorCoords);
          if (dist !== null) {
            listing.distance = dist;
          } else {
            listing.distance = undefined;
          }
        } else {
          listing.distance = undefined;
        }
      });
    } else {
      listings.forEach(listing => {
        listing.distance = undefined;
      });
    }

    let total = rawCount;
    if (pageNum === 1) {
      if (listings.length < limitNum) {
        total = listings.length;
      } else {
        total = await Listing.countDocuments(match);
      }
    }

    // Populate user interaction state (likes, saves)
    if (currentUserId && listings.length > 0) {
      try {
        const interactionService = require('../services/interaction.service');
        const listingIds = listings.map(l => l._id?.toString() || l.id).filter(Boolean);
        const state = await interactionService.userInteractionState(currentUserId, listingIds);
        for (const l of listings) {
          const lid = l._id?.toString() || l.id;
          const s = state[lid] || { liked: false, saved: false };
          l.viewer_state = s;
          l.isLiked = Boolean(s.liked);
          l.is_liked = Boolean(s.liked);
          l.hasLiked = Boolean(s.liked);
          l.isSaved = Boolean(s.saved);
          l.is_saved = Boolean(s.saved);
          l.hasSaved = Boolean(s.saved);
        }
      } catch (err) {
        console.error('Error populating user interaction state for listings:', err);
      }
    } else {
      for (const l of listings) {
        l.viewer_state = { liked: false, saved: false };
        l.isLiked = false;
        l.is_liked = false;
        l.hasLiked = false;
        l.isSaved = false;
        l.is_saved = false;
        l.hasSaved = false;
      }
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