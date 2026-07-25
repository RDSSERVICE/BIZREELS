const express = require('express');
const requirementController = require('../controllers/requirementController');
const requirementValidation = require('../validations/requirementValidation');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * Requirements & Bidding Routes — /api/v1/requirements
 */

// ── Lead Query ──────────────────────────────────
router.get(
  '/',
  authenticate,
  requirementValidation.queryRequirements,
  validate,
  requirementController.getRequirements
);

// ── Bids / Quotations List ─────────────────────────────────────
router.get(
  '/quotes',
  authenticate,
  asyncHandler(async (req, res) => {
    const Quote = require('../models/Quote');
    const Requirement = require('../models/Requirement');
    const mongoose = require('mongoose');

    const { search, status, page = 1, limit = 10, sortBy } = req.query;
    const activeRole = req.user.activeRole || req.user.current_role || 'customer';

    let baseQuery = {};

    if (activeRole === 'vendor') {
      baseQuery = { vendor: req.user._id };
    } else {
      // Find requirements for this customer
      const myReqs = await Requirement.find({ customer: req.user._id }).select('_id');
      const reqIds = myReqs.map(r => r._id);
      baseQuery = { requirement: { $in: reqIds } };
    }

    if (status) {
      baseQuery.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      const matchedReqs = await Requirement.find({
        title: searchRegex
      }).select('_id');
      const reqIds = matchedReqs.map(r => r._id);

      const User = require('../models/User');
      const matchedUsers = await User.find({
        $or: [
          { name: searchRegex },
          { 'vendorProfile.shopName': searchRegex },
          { 'vendorProfile.businessName': searchRegex }
        ]
      }).select('_id');
      const userIds = matchedUsers.map(u => u._id);

      const orConditions = [
        { notes: searchRegex },
        { requirement: { $in: reqIds } },
        { vendor: { $in: userIds } }
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(search) });
      }

      baseQuery.$and = [
        baseQuery.$and ? { $and: baseQuery.$and } : {},
        { $or: orConditions }
      ];
      if (Object.keys(baseQuery.$and[0]).length === 0) {
        baseQuery.$or = orConditions;
        delete baseQuery.$and;
      }
    }

    // Sort order
    let sort = { createdAt: -1 };
    if (sortBy) {
      if (sortBy === 'latest') sort = { createdAt: -1 };
      else if (sortBy === 'oldest') sort = { createdAt: 1 };
      else if (sortBy === 'price_low_high') sort = { price: 1 };
      else if (sortBy === 'price_high_low') sort = { price: -1 };
    }

    const total = await Quote.countDocuments(baseQuery);
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const quotes = await Quote.find(baseQuery)
      .populate('requirement')
      .populate('vendor', 'name profile_pic avatarUrl rating_avg rating_count vendorProfile businessName')
      .sort(sort)
      .skip(skip)
      .limit(parsedLimit)
      .lean();

    const formattedQuotes = quotes.map(q => ({
      ...q,
      id: q._id.toString(),
      requirement_id: q.requirement?._id?.toString(),
      created_at: q.createdAt
    }));

    return ApiResponse.paginated(res, 'Quotations retrieved successfully.', formattedQuotes, {
      page: parsedPage,
      limit: parsedLimit,
      total,
    });
  })
);

// ── Buyer Custom Posts ────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('customer', 'admin'),
  requirementValidation.create,
  validate,
  requirementController.create
);

// ── Vendor submits new quotation bid ───────────────────────
router.post(
  '/quotes',
  authenticate,
  authorize('vendor', 'admin'),
  requirementValidation.createQuote,
  validate,
  requirementController.createQuote
);

// ── Lead Details ──────────────────────────────────
router.get(
  '/:id',
  authenticate,
  requirementValidation.idParam,
  validate,
  requirementController.getRequirementDetails
);

router.put(
  '/:id',
  authenticate,
  authorize('customer', 'admin'),
  requirementValidation.update,
  validate,
  requirementController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('customer', 'admin'),
  requirementValidation.idParam,
  validate,
  requirementController.delete
);

// ── Bids for specific Requirement ─────────────────────────
router.get(
  '/:id/quotes',
  authenticate,
  requirementValidation.idParam,
  validate,
  requirementController.getQuotes
);

// ── Settle/Update Quote Status ────────────────────────────
router.patch(
  '/quotes/:quoteId',
  authenticate,
  authorize('customer', 'admin'),
  requirementValidation.quoteStatus,
  validate,
  requirementController.updateQuoteStatus
);

module.exports = router;
