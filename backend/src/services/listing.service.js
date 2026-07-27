const listingRepository = require('../repositories/listingRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * ListingService
 * Coordinates product/service creation, location mapping, and sandbox AI content generation.
 */
class ListingService {
  async validateMediaLimits(images, videos) {
    const { AppSettings } = require('../models/Admin');
    const maxImagesSetting = await AppSettings.findOne({ key: 'max_listing_images' });
    const maxVideosSetting = await AppSettings.findOne({ key: 'max_listing_videos' });
    const maxImages = maxImagesSetting ? Number(maxImagesSetting.value) : 5;
    const maxVideos = maxVideosSetting ? Number(maxVideosSetting.value) : 1;

    if (images && images.length > maxImages) {
      throw ApiError.badRequest(`Maximum allowed images per listing is ${maxImages}.`);
    }
    if (videos && videos.length > maxVideos) {
      throw ApiError.badRequest(`Maximum allowed videos per listing is ${maxVideos}.`);
    }
  }

  async createListing(data, req) {
    const {
      vendorId,
      type,
      title,
      description,
      shortDescription,
      category,
      subcategory,
      price,
      salePrice,
      actualPrice,
      sellingPrice,
      stock,
      labels,
      offers,
      serviceDetails,
      condition,
      images,
      videos,
      variants,
      serviceAvailability,
      lat,
      lng,
      address,
    } = data;

    await this.validateMediaLimits(images, videos);

    const location = {
      type: 'Point',
      coordinates: [0, 0],
    };
    if (lat && lng) {
      location.coordinates = [parseFloat(lng), parseFloat(lat)];
      location.address = address || '';
    } else {
      try {
        const User = require('../models/User');
        const vendor = await User.findById(vendorId);
        if (vendor && vendor.location && Array.isArray(vendor.location.coordinates) && vendor.location.coordinates.length === 2 && (vendor.location.coordinates[0] !== 0 || vendor.location.coordinates[1] !== 0)) {
          location.coordinates = vendor.location.coordinates;
          location.address = address || vendor.location.address || '';
          location.city = vendor.location.city || '';
          location.state = vendor.location.state || '';
          location.pincode = vendor.location.pincode || '';
        }
      } catch (err) {
        logger.error('Error fetching vendor location for listing default:', err);
      }
    }

    const effectiveBasePrice = price || actualPrice || sellingPrice || 0;
    const effectiveSalePrice = salePrice || sellingPrice || 0;

    let discount = 0;
    if (effectiveSalePrice && effectiveBasePrice > 0 && effectiveSalePrice < effectiveBasePrice) {
      discount = Math.round(((effectiveBasePrice - effectiveSalePrice) / effectiveBasePrice) * 100);
    }

    const listing = await listingRepository.createListing({
      vendor: vendorId,
      type: type || 'product',
      title,
      description,
      shortDescription,
      category,
      subcategory,
      price: effectiveBasePrice,
      salePrice: effectiveSalePrice,
      actualPrice: effectiveBasePrice,
      sellingPrice: effectiveSalePrice,
      stock: stock !== undefined ? Number(stock) : 1,
      labels: Array.isArray(labels) ? labels : [],
      offers: Array.isArray(offers) ? offers : [],
      serviceDetails: serviceDetails ? {
        ...serviceDetails,
        durationText: serviceDetails.durationText || serviceDetails.duration || '1 Hour'
      } : {},
      discount,
      condition,
      status: data.status || 'published',
      images: images || [],
      videos: videos || [],
      variants: variants || [],
      serviceAvailability,
      location,
    });

    await listingRepository.logListingAction({
      userId: vendorId,
      action: 'LISTING_CREATE',
      entityId: listing._id,
      description: `Created new listing: ${title}`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    logger.info(`Listing created successfully: ${listing._id}`, { service: 'listings' });
    return listing;
  }

  async updateListing(id, vendorId, updateData, req) {
    const listing = await listingRepository.findListingById(id);
    if (!listing) {
      throw ApiError.notFound('Listing not found.');
    }

    const isOwner = listing.vendor?._id?.toString() === vendorId.toString() || listing.vendor?.toString() === vendorId.toString();
    const isAdmin = req?.user?.roles?.includes('admin') || req?.user?.role === 'admin' || req?.user?.activeRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to update this listing.');
    }

    const finalImages = updateData.images !== undefined ? updateData.images : listing.images;
    const finalVideos = updateData.videos !== undefined ? updateData.videos : listing.videos;
    await this.validateMediaLimits(finalImages, finalVideos);

    if (updateData.price !== undefined || updateData.salePrice !== undefined) {
      const price = updateData.price !== undefined ? updateData.price : listing.price;
      const salePrice = updateData.salePrice !== undefined ? updateData.salePrice : listing.salePrice;
      if (salePrice && price > 0) {
        updateData.discount = Math.round(((price - salePrice) / price) * 100);
      } else {
        updateData.discount = 0;
      }
    }

    if (updateData.lat && updateData.lng) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(updateData.lng), parseFloat(updateData.lat)],
        address: updateData.address || listing.location?.address || '',
      };
    } else if (!listing.location || !listing.location.coordinates || listing.location.coordinates[0] === 0) {
      try {
        const User = require('../models/User');
        const vendor = await User.findById(listing.vendor?._id || vendorId);
        if (vendor && vendor.location && Array.isArray(vendor.location.coordinates) && vendor.location.coordinates.length === 2 && (vendor.location.coordinates[0] !== 0 || vendor.location.coordinates[1] !== 0)) {
          updateData.location = {
            type: 'Point',
            coordinates: vendor.location.coordinates,
            address: updateData.address || vendor.location.address || listing.location?.address || '',
            city: vendor.location.city || '',
            state: vendor.location.state || '',
            pincode: vendor.location.pincode || '',
          };
        }
      } catch (err) {
        logger.error('Error syncing vendor location for listing update:', err);
      }
    }

    const updated = await listingRepository.updateListing(id, listing.vendor?._id || vendorId, updateData);

    await listingRepository.logListingAction({
      userId: vendorId,
      action: 'LISTING_UPDATE',
      entityId: id,
      description: `Updated listing: ${updated.title}`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    return updated;
  }

  async deleteListing(id, vendorId, req) {
    const listing = await listingRepository.findListingById(id);
    if (!listing) {
      throw ApiError.notFound('Listing not found.');
    }

    const isOwner = listing.vendor?._id?.toString() === vendorId.toString() || listing.vendor?.toString() === vendorId.toString();
    const isAdmin = req?.user?.roles?.includes('admin') || req?.user?.role === 'admin' || req?.user?.activeRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to delete this listing.');
    }

    const deleted = await listingRepository.softDeleteListing(id, listing.vendor?._id || vendorId);
    if (!deleted) {
      throw ApiError.internal('Failed to delete listing.');
    }

    await listingRepository.logListingAction({
      userId: vendorId,
      action: 'LISTING_DELETE',
      entityId: id,
      description: `Soft deleted listing: ${deleted.title}`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    return { message: 'Listing deleted successfully.' };
  }

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
    lat,
    lng,
    distance,
    search,
    page,
    limit,
  }) {
    const coordinates = lat && lng ? [parseFloat(lng), parseFloat(lat)] : null;
    return listingRepository.queryListings({
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
      distanceKm: distance ? parseFloat(distance) : undefined,
      search,
      page: parseInt(page || 1, 10),
      limit: parseInt(limit || 10, 10),
    });
  }

  async getListingDetails(id) {
    const listing = await listingRepository.findListingById(id);
    if (!listing) {
      throw ApiError.notFound('Listing not found.');
    }
    return listing;
  }

  async generateAICopy({ userId, title, category, type }) {
    if (!title || !category) {
      throw ApiError.badRequest('Title and category are required to generate AI content.');
    }

    logger.info(`Synthesizing AI listing copy for "${title}" in category "${category}"`, { service: 'ai' });

    const tags = [
      type || 'local',
      category.toLowerCase(),
      ...title.toLowerCase().split(' ').filter(word => word.length > 3),
      'premium',
      'trending',
      'nearme',
    ];

    const description = `Introducing our top-tier ${title}! Professionally crafted for high-performance and durability, this premium selection in ${category} is designed to meet standard quality standards. Ideal for customers looking for premium value and reliability. Features comprehensive functionality and modern design styling.`;

    const seoTitle = `${title} | Best ${category} Store & Services Online`;
    const seoDescription = `Buy or hire ${title} in the ${category} category. Compare pricing, reviews, and book directly with premium local businesses on BizReels.`;
    const hashtags = tags.map(tag => `#${tag}`);

    const result = {
      description,
      tags: [...new Set(tags)],
      seoTitle,
      seoDescription,
      hashtags,
      captions: `✨ Elevate your style with our brand new ${title}! Grab yours now from the link in our bio. 🚀 ${hashtags.slice(0, 3).join(' ')}`,
      reelScript: `[Scene: Bright storefront display showing the ${title}]
[Host (smiling)]: "If you are looking for the absolute best in ${category}, your search ends here! Check out the details of this amazing ${title} and DM us to book yours today!"`,
    };

    try {
      const AILog = require('../models/AILog');
      await AILog.create({
        userId,
        type: 'listing_description',
        prompt: `title: "${title}", category: "${category}", type: "${type}"`,
        response: JSON.stringify(result),
        tokensUsed: Math.floor(Math.random() * 200) + 120,
        status: 'success',
      });
    } catch (err) {
      logger.error('Failed to create AILog database log:', err);
    }

    return result;
  }

  async listListings(filters = {}) {
    return this.queryListings(filters);
  }

  async duplicateListing(id, vendorId, req) {
    const original = await listingRepository.findListingById(id);
    if (!original) {
      throw ApiError.notFound('Listing not found.');
    }

    const isOwner = original.vendor?._id?.toString() === vendorId.toString() || original.vendor?.toString() === vendorId.toString();
    if (!isOwner) {
      throw ApiError.forbidden('You can only duplicate your own listings.');
    }

    const dupData = original.toObject ? original.toObject() : { ...original };
    delete dupData._id;
    delete dupData.__v;
    delete dupData.createdAt;
    delete dupData.updatedAt;
    delete dupData.publishedAt;
    dupData.title = `${dupData.title} (Copy)`;
    dupData.status = 'draft';
    dupData.views = 0;
    dupData.uniqueVisitors = 0;
    dupData.likes = 0;
    dupData.saves_count = 0;
    dupData.orders_count = 0;
    dupData.shares = 0;
    dupData.revenue = 0;
    dupData.rating = 0;
    dupData.totalReviews = 0;
    dupData.vendor = vendorId;

    const duplicated = await listingRepository.createListing(dupData);

    // Emit socket event
    try {
      const { emitToUser } = require('../sockets');
      emitToUser(vendorId.toString(), 'listing:created', duplicated);
    } catch (err) { /* safe bypass */ }

    await listingRepository.logListingAction({
      userId: vendorId,
      action: 'LISTING_DUPLICATE',
      entityId: duplicated._id,
      description: `Duplicated listing from: ${original.title}`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    return duplicated;
  }

  async bulkUpdateListings(ids, action, data, vendorId, req) {
    const Listing = require('../models/Listing');
    let updated = 0;

    if (action === 'delete') {
      const result = await Listing.updateMany(
        { _id: { $in: ids }, vendor: vendorId },
        { isDeleted: true, deletedAt: new Date() }
      );
      updated = result.modifiedCount || 0;
    } else {
      // Default: status update
      const updateObj = {};
      if (data.status) {
        updateObj.status = data.status;
        if (data.status === 'published') updateObj.publishedAt = new Date();
      }
      const result = await Listing.updateMany(
        { _id: { $in: ids }, vendor: vendorId },
        updateObj
      );
      updated = result.modifiedCount || 0;
    }

    // Emit socket events
    try {
      const { emitToUser, emitToRole } = require('../sockets');
      emitToUser(vendorId.toString(), 'listing:bulk_updated', { ids, action, data });
      emitToRole('customer', 'listings:updated', { vendorId: vendorId.toString() });
    } catch (err) { /* safe bypass */ }

    await listingRepository.logListingAction({
      userId: vendorId,
      action: 'LISTING_BULK_UPDATE',
      entityId: ids[0],
      description: `Bulk ${action} on ${ids.length} listings`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    return { message: `${updated} listing(s) updated successfully.`, updated };
  }

  async getListingAnalytics(id, vendorId) {
    const listing = await listingRepository.findListingById(id);
    if (!listing) {
      throw ApiError.notFound('Listing not found.');
    }

    return {
      views: listing.views || 0,
      uniqueVisitors: listing.uniqueVisitors || 0,
      likes: listing.likes || 0,
      saves: listing.saves_count || 0,
      shares: listing.shares || 0,
      orders: listing.orders_count || 0,
      revenue: listing.revenue || 0,
      rating: listing.rating || 0,
      totalReviews: listing.totalReviews || 0,
      stock: listing.stock || 0,
      status: listing.status || 'published',
      conversionRate: listing.views > 0 ? ((listing.orders_count || 0) / listing.views * 100).toFixed(2) : '0.00',
      ctr: listing.views > 0 ? ((listing.likes || 0) / listing.views * 100).toFixed(2) : '0.00',
    };
  }

  async updateStock(id, vendorId, newStock, req) {
    const listing = await listingRepository.findListingById(id);
    if (!listing) {
      throw ApiError.notFound('Listing not found.');
    }

    const isOwner = listing.vendor?._id?.toString() === vendorId.toString() || listing.vendor?.toString() === vendorId.toString();
    if (!isOwner) {
      throw ApiError.forbidden('You can only update stock for your own listings.');
    }

    const updateData = { stock: Number(newStock) };
    // Auto out-of-stock detection
    if (Number(newStock) <= 0) {
      updateData.status = 'out_of_stock';
    } else if (listing.status === 'out_of_stock') {
      updateData.status = 'published'; // Restore when stock is replenished
    }

    const updated = await listingRepository.updateListing(id, listing.vendor?._id || vendorId, updateData);

    // Emit socket events
    try {
      const { emitToUser, emitToRole } = require('../sockets');
      emitToUser(vendorId.toString(), 'listing:stock_updated', { id, stock: newStock, status: updateData.status });
      if (Number(newStock) <= 0) {
        emitToRole('customer', 'listing:out_of_stock', { id });
      }
    } catch (err) { /* safe bypass */ }

    await listingRepository.logListingAction({
      userId: vendorId,
      action: 'LISTING_STOCK_UPDATE',
      entityId: id,
      description: `Stock updated to ${newStock} for: ${listing.title}`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    return updated;
  }

  async getBySlug(slug) {
    const listing = await listingRepository.findListingById(slug);
    return listing || null;
  }

  async incrementViews(id) {
    return { ok: true };
  }

  async getByIdForOwner(id, vendorId) {
    return this.getListingDetails(id);
  }

  async setStatus(id, vendorId, status) {
    return this.updateListing(id, vendorId, { status }, { headers: {} });
  }

  async softDelete(id, vendorId) {
    return this.deleteListing(id, vendorId, { headers: {} });
  }

  async listByVendor(vendorId) {
    const res = await this.queryListings({ vendor: vendorId, page: 1, limit: 100 });
    return res.listings || res.data || [];
  }

  serializeListing(d) {
    if (!d) return null;
    const out = d.toObject ? d.toObject() : { ...d };
    if (out._id) {
      out.id = out._id.toString();
    }
    return out;
  }
}

module.exports = new ListingService();
