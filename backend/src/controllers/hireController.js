const hireService = require('../services/hireService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * HireController
 * Coordinates collaboration proposals submissions, pricing release escrow payouts, and updates.
 */
class HireController {
  create = asyncHandler(async (req, res) => {
    const { creatorId, title, description, budget, deliveryDays } = req.body;
    const request = await hireService.createRequest({
      vendorId: req.user._id,
      creatorId,
      title,
      description,
      budget,
      deliveryDays,
    }, req);
    return ApiResponse.created(res, 'Collaboration proposal sent successfully.', { hireRequest: request });
  });

  getRequests = asyncHandler(async (req, res) => {
    const { role } = req.query; // creator | vendor
    let list = [];
    if (role === 'creator') {
      list = await hireService.getCreatorRequests(req.user._id);
    } else {
      list = await hireService.getVendorRequests(req.user._id);
    }
    return ApiResponse.ok(res, 'Hire requests retrieved.', { hireRequests: list });
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await hireService.updateRequestStatus(id, status, req.user._id);
    return ApiResponse.ok(res, `Request updated to ${status} successfully.`, { hireRequest: result });
  });
}

module.exports = new HireController();
