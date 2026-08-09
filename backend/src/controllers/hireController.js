const hireService = require('../services/hireService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * HireController
 * Coordinates collaboration proposals submissions, pricing release escrow payouts, and updates.
 */
class HireController {
  create = asyncHandler(async (req, res) => {
    const campaign = await hireService.createRequest({
      ...req.body,
      vendorId: req.user._id,
    }, req);
    return ApiResponse.created(res, 'Collaboration proposal sent successfully.', { campaign });
  });

  getRequests = asyncHandler(async (req, res) => {
    const { role } = req.query; // creator | vendor
    let list = [];
    if (role === 'creator') {
      list = await hireService.getCreatorRequests(req.user._id);
    } else {
      list = await hireService.getVendorRequests(req.user._id);
    }
    return ApiResponse.ok(res, 'Hire requests and campaigns retrieved.', { hireRequests: list });
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await hireService.updateRequestStatus(id, status, req.user._id);
    return ApiResponse.ok(res, `Campaign updated to ${status} successfully.`, { campaign: result });
  });

  edit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const campaign = await hireService.editRequest(id, req.body, req.user._id);
    return ApiResponse.ok(res, 'Campaign proposal edited successfully.', { campaign });
  });

  cancel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const campaign = await hireService.cancelRequest(id, req.user._id);
    return ApiResponse.ok(res, 'Campaign proposal cancelled.', { campaign });
  });

  submitDeliverable = asyncHandler(async (req, res) => {
    const { id } = req.params; // campaignId
    const { url, type, caption, milestoneId } = req.body;
    const campaign = await hireService.submitDeliverable(id, url, type, caption, req.user._id, milestoneId);
    return ApiResponse.ok(res, 'Deliverable uploaded successfully.', { campaign });
  });

  approveMilestone = asyncHandler(async (req, res) => {
    const { id, milestoneId } = req.params; // campaignId, milestoneId
    const campaign = await hireService.approveMilestone(id, milestoneId, req.user._id);
    return ApiResponse.ok(res, 'Milestone approved successfully.', { campaign });
  });
}

module.exports = new HireController();
