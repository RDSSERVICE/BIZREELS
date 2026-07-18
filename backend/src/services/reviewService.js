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

    // 1. Verify target listing exists if provided
    if (targetListingId) {
      const listing = await Listing.findById(targetListingId);
      if (!listing) {
        throw ApiError.notFound('Listing target not found.');
      }
      
      // Enforce duplicate check
      const existingReview = await reviewRepository.findReviewById(targetListingId); // check spare sparse index trigger
      // To be safe, run a direct query check
      const queryCheck = await Review.findOne({ author: authorId, targetListing: targetListingId, isDeleted: false });
      if (queryCheck) {
        throw ApiError.badRequest('You have already submitted a review for this catalog listing.');
      }
    }

    // 2. Verify target user exists if provided
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

    await reviewRepository.logReviewAction({
      userId: authorId,
      action: 'ADMIN_ACTION', // using generic audit tags or matching review tags if defined
      entityId: review._id,
      description: `Posted a review rating of ${rating} for entity.`,
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    logger.info(`Review created successfully: ${review._id}`, { service: 'reviews' });
    return review;
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
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    // Dynamically recalculate ratings after deleting reviews
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
}

// Helper reference
const mongoose = require('mongoose');

module.exports = new ReviewService();
