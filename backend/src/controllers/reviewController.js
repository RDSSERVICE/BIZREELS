const reviewService = require('../services/review.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * ReviewController
 * Handles routes for leaving ratings/reviews and querying feedback.
 */
class ReviewController {
  // ── Create Review ──────────────────────────────────────
  create = asyncHandler(async (req, res) => {
    const { targetUserId, targetListingId, rating, comment } = req.body;
    
    const review = await reviewService.postReview(
      req.user._id,
      {
        targetUserId,
        targetListingId,
        rating,
        comment,
      },
      req
    );

    return ApiResponse.created(res, 'Review posted successfully.', { review });
  });

  // ── Get Reviews for User (Vendor or Creator) ────────────
  getReviewsForUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await reviewService.getReviewsForUser(userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return ApiResponse.paginated(res, 'Reviews retrieved.', result.reviews, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    });
  });

  // ── Get Reviews for Listing (Catalog Item) ──────────────
  getReviewsForListing = asyncHandler(async (req, res) => {
    const { listingId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await reviewService.getReviewsForListing(listingId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return ApiResponse.paginated(res, 'Reviews retrieved.', result.reviews, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    });
  });

  // ── Delete Review ──────────────────────────────────────
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await reviewService.deleteReview(id, req.user._id, req);
    return ApiResponse.ok(res, result.message);
  });
}

module.exports = new ReviewController();
