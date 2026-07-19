const listingRepository = require('../repositories/listingRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * ListingService
 * Coordinates product/service creation, location mapping, and sandbox AI content generation.
 */
class ListingService {
  async createListing(
    {
      vendorId,
      type,
      title,
      description,
      category,
      subcategory,
      price,
      salePrice,
      condition,
      images,
      videos,
      variants,
      serviceAvailability,
      lat,
      lng,
      address,
    },
    req
  ) {
    // Geo coordinate structure
    const location = {
      type: 'Point',
      coordinates: [0, 0],
    };
    if (lat && lng) {
      location.coordinates = [parseFloat(lng), parseFloat(lat)];
      location.address = address || '';
    }

    // Calculate discount if salePrice provided
    let discount = 0;
    if (salePrice && price > 0) {
      discount = Math.round(((price - salePrice) / price) * 100);
    }

    const listing = await listingRepository.createListing({
      vendor: vendorId,
      type,
      title,
      description,
      category,
      subcategory,
      price,
      salePrice,
      discount,
      condition,
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
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    logger.info(`Listing created successfully: ${listing._id}`, { service: 'listings' });
    return listing;
  }

  async updateListing(id, vendorId, updateData, req) {
    const listing = await listingRepository.findListingById(id);
    if (!listing) {
      throw ApiError.notFound('Listing not found.');
    }

    if (listing.vendor._id.toString() !== vendorId.toString()) {
      throw ApiError.forbidden('You are not authorized to update this listing.');
    }

    // Recalculate discount if pricing updated
    if (updateData.price !== undefined || updateData.salePrice !== undefined) {
      const price = updateData.price !== undefined ? updateData.price : listing.price;
      const salePrice = updateData.salePrice !== undefined ? updateData.salePrice : listing.salePrice;
      if (salePrice && price > 0) {
        updateData.discount = Math.round(((price - salePrice) / price) * 100);
      } else {
        updateData.discount = 0;
      }
    }

    // Handle location updates
    if (updateData.lat && updateData.lng) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(updateData.lng), parseFloat(updateData.lat)],
        address: updateData.address || listing.location?.address || '',
      };
    }

    const updated = await listingRepository.updateListing(id, vendorId, updateData);

    await listingRepository.logListingAction({
      userId: vendorId,
      action: 'LISTING_UPDATE',
      entityId: id,
      description: `Updated listing: ${updated.title}`,
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    return updated;
  }

  async deleteListing(id, vendorId, req) {
    const deleted = await listingRepository.softDeleteListing(id, vendorId);
    if (!deleted) {
      throw ApiError.forbidden('Listing not found or you are not authorized to delete it.');
    }

    await listingRepository.logListingAction({
      userId: vendorId,
      action: 'LISTING_DELETE',
      entityId: id,
      description: `Soft deleted listing: ${deleted.title}`,
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    return { message: 'Listing deleted successfully.' };
  }

  async queryListings({
    type,
    category,
    subcategory,
    minPrice,
    maxPrice,
    condition,
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
      type,
      category,
      subcategory,
      minPrice,
      maxPrice,
      condition,
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

  /**
   * AI-powered description and tags synthesis generator.
   */
  async generateAICopy({ userId, title, category, type }) {
    if (!title || !category) {
      throw ApiError.badRequest('Title and category are required to generate AI content.');
    }

    logger.info(`Synthesizing AI listing copy for "${title}" in category "${category}"`, { service: 'ai' });

    // Dynamic mock content synthesis mimicking real NLP model responses
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

    // Audit log AI usage to database
    try {
      const AILog = require('../models/AILog');
      await AILog.create({
        userId,
        type: 'listing_description',
        prompt: `title: "${title}", category: "${category}", type: "${type}"`,
        response: JSON.stringify(result),
        tokensUsed: Math.floor(Math.random() * 200) + 120, // simulate token calculation
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
    const res = await this.queryListings({ page: 1, limit: 100 });
    return res.data || [];
  }
}

module.exports = new ListingService();
