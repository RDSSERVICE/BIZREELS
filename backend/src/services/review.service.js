const reviewRepository = require('../repositories/reviewRepository');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * ReviewService
 * Coordinates validation rules and calculations when creating or deleting store reviews.
 */
class ReviewService {
  async postReview(authorId, { targetUserId, targetListingId, rating, comment }, req) {
    if (!targetUserId && !targetListingId) {
      throw ApiError.badRequest('Either a target user or listing must be provided for a review.');
    }

    if (targetListingId) {
      let listing = await Listing.findById(targetListingId);
      if (!listing) {
        const Reel = require('../models/Reel');
        const reel = await Reel.findById(targetListingId);
        if (!reel) {
          throw ApiError.notFound('Listing target not found.');
        }
        if (!targetUserId && reel.creator) {
          targetUserId = reel.creator;
        }
      } else {
        if (!targetUserId && listing.vendor) {
          targetUserId = listing.vendor?._id || listing.vendor;
        }
      }
      
      const queryCheck = await Review.findOne({ author: authorId, targetListing: targetListingId, isDeleted: false });
      if (queryCheck) {
        queryCheck.rating = parseInt(rating, 10);
        queryCheck.comment = comment;
        if (targetUserId && !queryCheck.targetUser) {
          queryCheck.targetUser = targetUserId;
        }
        await queryCheck.save();
        await this.updateStats(targetListingId, targetUserId);
        await queryCheck.populate('author', 'name avatarUrl activeRole');
        logger.info(`Review updated successfully: ${queryCheck._id}`, { service: 'reviews' });
        return queryCheck;
      }
    }

    if (targetUserId) {
      const targetUserDoc = await User.findById(targetUserId);
      if (!targetUserDoc) {
        throw ApiError.notFound('Target user not found.');
      }
      if (targetUserId.toString() === authorId.toString()) {
        throw ApiError.badRequest('You cannot submit reviews for your own profile workspace.');
      }
    }

    const review = await reviewRepository.createReview({
      author: authorId,
      targetUser: targetUserId,
      targetListing: targetListingId,
      rating: parseInt(rating, 10),
      comment,
    });

    await this.updateStats(targetListingId, targetUserId);

    await reviewRepository.logReviewAction({
      userId: authorId,
      action: 'ADMIN_ACTION',
      entityId: review._id,
      description: `Posted a review rating of ${rating} for entity.`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    await review.populate('author', 'name avatarUrl activeRole');
    logger.info(`Review created successfully: ${review._id}`, { service: 'reviews' });
    return review;
  }

  async updateStats(targetListingId, targetUserId) {
    try {
      if (targetListingId) {
        const stats = await Review.aggregate([
          { $match: { targetListing: targetListingId, isDeleted: false } },
          { $group: { _id: '$targetListing', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
        ]);
        await Listing.findByIdAndUpdate(targetListingId, {
          rating: stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
          totalReviews: stats.length > 0 ? stats[0].totalReviews : 0,
        });
      }

      if (targetUserId) {
        const stats = await Review.aggregate([
          { $match: { targetUser: targetUserId, isDeleted: false } },
          { $group: { _id: '$targetUser', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
        ]);
        const targetUserDoc = await User.findById(targetUserId);
        if (targetUserDoc) {
          const avg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
          const total = stats.length > 0 ? stats[0].totalReviews : 0;
          if (targetUserDoc.roles?.includes('vendor') && targetUserDoc.vendorProfile) {
            targetUserDoc.vendorProfile.rating = avg;
            targetUserDoc.vendorProfile.totalReviews = total;
          }
          if (targetUserDoc.roles?.includes('creator') && targetUserDoc.creatorProfile) {
            targetUserDoc.creatorProfile.rating = avg;
            targetUserDoc.creatorProfile.totalReviews = total;
          }
          await targetUserDoc.save();
        }
      }
    } catch (err) {
      logger.error('Error updating review stats:', err);
    }
  }

  async getReviewsForUser(targetUserId, { page = 1, limit = 10 } = {}) {
    return reviewRepository.findReviewsByTargetUser(targetUserId, { page, limit });
  }

  async getReviewsForListing(targetListingId, { page = 1, limit = 10 } = {}) {
    return reviewRepository.findReviewsByTargetListing(targetListingId, { page, limit });
  }

  async deleteReview(reviewId, authorId, req) {
    const deleted = await reviewRepository.softDeleteReview(reviewId, authorId);
    if (!deleted) {
      throw ApiError.forbidden('Review not found or you are not authorized to delete this comment review.');
    }

    await reviewRepository.logReviewAction({
      userId: authorId,
      action: 'USER_DELETE',
      entityId: reviewId,
      description: `Deleted review comment: ${reviewId}`,
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    const ReviewModel = Review;
    if (deleted.targetListing) {
      const stats = await ReviewModel.aggregate([
        { $match: { targetListing: deleted.targetListing, isDeleted: false } },
        { $group: { _id: '$targetListing', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
      ]);
      await Listing.findByIdAndUpdate(deleted.targetListing, {
        rating: stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
        totalReviews: stats.length > 0 ? stats[0].totalReviews : 0,
      });
    }

    if (deleted.targetUser) {
      const stats = await ReviewModel.aggregate([
        { $match: { targetUser: deleted.targetUser, isDeleted: false } },
        { $group: { _id: '$targetUser', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
      ]);
      const targetUserDoc = await User.findById(deleted.targetUser);
      if (targetUserDoc) {
        if (targetUserDoc.roles.includes('vendor') && targetUserDoc.vendorProfile) {
          targetUserDoc.vendorProfile.rating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
          targetUserDoc.vendorProfile.totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;
        } else if (targetUserDoc.roles.includes('creator') && targetUserDoc.creatorProfile) {
          targetUserDoc.creatorProfile.rating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
          targetUserDoc.creatorProfile.totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;
        }
        await targetUserDoc.save();
      }
    }

    return { message: 'Review deleted successfully.' };
  }

  async createReview(authorId, data, req) {
    return this.postReview(authorId, data, req || { headers: {} });
  }

  async replyToReview(reviewId, replyText, vendorId) {
    return { ok: true, reviewId, reply: replyText };
  }

  async listReviews(targetType, targetId, sort, cursor, limit = 20) {
    const page = Math.max(1, parseInt(cursor || 1, 10));
    if (targetType === 'listing' || targetType === 'product' || targetType === 'service') {
      return this.getReviewsForListing(targetId, { page, limit });
    }
    return this.getReviewsForUser(targetId, { page, limit });
  }
}

module.exports = new ReviewService();
