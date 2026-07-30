const referralService = require('../services/referral.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * ReferralController
 * Vendor-facing referral endpoints.
 */
class ReferralController {

  // ── Get My Referral Dashboard ───────────────────────────
  getDashboard = asyncHandler(async (req, res) => {
    const dashboard = await referralService.getVendorDashboard(req.user._id);
    return ApiResponse.ok(res, 'Referral dashboard loaded.', dashboard);
  });

  // ── Get My Referral Link ────────────────────────────────
  getLink = asyncHandler(async (req, res) => {
    const link = await referralService.getReferralLink(req.user._id);
    return ApiResponse.ok(res, 'Referral link generated.', link);
  });

  // ── Get My Referrals List ───────────────────────────────
  getMyReferrals = asyncHandler(async (req, res) => {
    const result = await referralService.listMyReferrals(req.user._id);
    return ApiResponse.ok(res, 'Referrals loaded.', result);
  });

  // ── Get My Referral Code ────────────────────────────────
  getCode = asyncHandler(async (req, res) => {
    const code = await referralService.ensureCode(req.user._id);
    return ApiResponse.ok(res, 'Referral code loaded.', { referral_code: code });
  });

  // ── Admin: Get Referral Analytics ───────────────────────
  adminGetAnalytics = asyncHandler(async (req, res) => {
    const adminService = require('../services/referral/referral.admin.service');
    const analytics = await adminService.getReferralAnalytics();
    return ApiResponse.ok(res, 'Referral analytics loaded.', analytics);
  });

  // ── Admin: List All Referrals ───────────────────────────
  adminListReferrals = asyncHandler(async (req, res) => {
    const adminService = require('../services/referral/referral.admin.service');
    const { page, limit, status, search, from_date, to_date } = req.query;
    const result = await adminService.listAllReferrals({ page, limit, status, search, from_date, to_date });
    return ApiResponse.paginated(res, 'All referrals loaded.', result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  });

  // ── Admin: Update Referral Status ───────────────────────
  adminUpdateStatus = asyncHandler(async (req, res) => {
    const adminService = require('../services/referral/referral.admin.service');
    const { referralId, status, remarks } = req.body;
    if (!referralId || !status) {
      throw require('../utils/ApiError').badRequest('referralId and status are required');
    }
    const result = await adminService.updateReferralStatus(referralId, status, remarks);
    return ApiResponse.ok(res, 'Referral status updated successfully.', result);
  });

  // ── Admin: Get Referral Config ──────────────────────────
  adminGetConfig = asyncHandler(async (req, res) => {
    const adminService = require('../services/referral/referral.admin.service');
    const config = await adminService.getReferralConfig();
    return ApiResponse.ok(res, 'Referral configuration loaded.', config);
  });

  // ── Admin: Update Referral Config ───────────────────────
  adminUpdateConfig = asyncHandler(async (req, res) => {
    const adminService = require('../services/referral/referral.admin.service');
    const config = await adminService.updateReferralConfig(req.body);
    return ApiResponse.ok(res, 'Referral configuration updated successfully.', config);
  });
}

module.exports = new ReferralController();
