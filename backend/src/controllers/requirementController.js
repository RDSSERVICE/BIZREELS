const requirementService = require('../services/requirement.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * RequirementController
 * Coordinates buyer posting actions, lead retrieval, bidding uploads, and acceptance settlements.
 */
class RequirementController {
  // ── Create Requirement ──────────────────────────────────
  create = asyncHandler(async (req, res) => {
    const {
      title, description, category, subcategory, requirementType, budget, budget_min, budget_max,
      quantity, deadline, lat, lng, address, city, state, pincode, district, targetDistance,
      otherConditions, photos, video, detailedSpecifications, expectedDeliveryDate,
      expectedDeliveryTime, productCondition, customProductCondition, serviceModel,
      customServiceModel, customCategory, customSubcategory
    } = req.body;

    const requirement = await requirementService.createRequirement({
      customerId: req.user._id,
      title,
      description,
      category,
      subcategory,
      requirementType,
      budget,
      budget_min,
      budget_max,
      quantity,
      deadline,
      lat,
      lng,
      address,
      city,
      state,
      pincode,
      district,
      targetDistance,
      otherConditions,
      photos,
      video,
      detailedSpecifications,
      expectedDeliveryDate,
      expectedDeliveryTime,
      productCondition,
      customProductCondition,
      serviceModel,
      customServiceModel,
      customCategory,
      customSubcategory,
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
    const { customerId, category, requirementType, status, lat, lng, distance, search, sortBy, page = 1, limit = 10 } = req.query;

    const userRoles = req.user?.roles || [];
    const activeRole = req.user?.current_role || req.user?.activeRole || 'customer';

    let targetCustomerId = customerId;
    let targetVendorId = undefined;

    // Only use vendor query mode if the active role is explicitly 'vendor'
    // and no customerId was explicitly requested
    if (activeRole === 'vendor' && !targetCustomerId) {
      targetVendorId = req.user._id;
    } else {
      // Default: customer mode — show user's own requirements
      if (!targetCustomerId) {
        targetCustomerId = req.user._id;
      }
    }

    const result = await requirementService.queryRequirements({
      customerId: targetCustomerId,
      vendorId: targetVendorId,
      category,
      requirementType,
      status,
      lat,
      lng,
      distance,
      search,
      sortBy,
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
    const userRoles = req.user?.roles || [];
    const activeRole = req.user?.current_role || req.user?.activeRole || 'customer';

    const requirement = await requirementService.getRequirementDetails(id, req.user._id, activeRole);
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

  // ── Delete Quote ──────────────────────────────────────────
  deleteQuote = asyncHandler(async (req, res) => {
    const { quoteId } = req.params;
    const result = await requirementService.deleteQuote(quoteId, req.user._id);
    return ApiResponse.ok(res, result.message || 'Bid deleted successfully.');
  });
}

module.exports = new RequirementController();