const requirementService = require('../services/requirementService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * RequirementController
 * Coordinates buyer posting actions, lead retrieval, bidding uploads, and acceptance settlements.
 */
class RequirementController {
  // ── Create Requirement ──────────────────────────────────
  create = asyncHandler(async (req, res) => {
    const { title, description, category, budget, deadline, lat, lng, address } = req.body;
    
    const requirement = await requirementService.createRequirement({
      customerId: req.user._id,
      title,
      description,
      category,
      budget,
      deadline,
      lat,
      lng,
      address,
    }, req);

    return ApiResponse.created(res, 'Requirement posted successfully.', { requirement });
  });

  // ── Update Requirement ──────────────────────────────────
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await requirementService.updateRequirement(id, req.user._id, req.body, req);
    return ApiResponse.ok(res, 'Requirement updated successfully.', { requirement: updated });
  });

  // ── Delete Requirement ──────────────────────────────────
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await requirementService.deleteRequirement(id, req.user._id, req);
    return ApiResponse.ok(res, result.message);
  });

  // ── Query Requirements (Leads lists) ────────────────────
  getRequirements = asyncHandler(async (req, res) => {
    const { customerId, category, status, lat, lng, distance, page = 1, limit = 10 } = req.query;

    const result = await requirementService.queryRequirements({
      customerId,
      category,
      status,
      lat,
      lng,
      distance,
      page,
      limit,
    });

    return ApiResponse.paginated(res, 'Requirements retrieved.', result.requirements, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.total,
    });
  });

  // ── Get Single Requirement details ──────────────────────
  getRequirementDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const requirement = await requirementService.getRequirementDetails(id);
    return ApiResponse.ok(res, 'Requirement details retrieved.', { requirement });
  });

  // ── Create Bidding Quote ─────────────────────────────────
  createQuote = asyncHandler(async (req, res) => {
    const { requirementId, price, notes, estimatedDelivery } = req.body;

    const quote = await requirementService.createQuote({
      requirementId,
      vendorId: req.user._id,
      price,
      notes,
      estimatedDelivery,
    }, req);

    return ApiResponse.created(res, 'Bid quote submitted successfully.', { quote });
  });

  // ── Get Quotes for specific Requirement ──────────────────
  getQuotes = asyncHandler(async (req, res) => {
    const { id } = req.params; // Requirement ID
    const quotes = await requirementService.getQuotesForRequirement(id, req.user._id);
    return ApiResponse.ok(res, 'Quotations retrieved successfully.', { quotes });
  });

  // ── Settle/Update Quote Status ───────────────────────────
  updateQuoteStatus = asyncHandler(async (req, res) => {
    const { quoteId } = req.params;
    const { status } = req.body;

    const result = await requirementService.updateQuoteStatus(quoteId, status, req.user._id, req);
    return ApiResponse.ok(res, result.message || `Quote ${status} successfully.`, { quote: result.quote });
  });
}

module.exports = new RequirementController();
