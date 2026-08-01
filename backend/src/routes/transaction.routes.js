const express = require('express');
const { authenticate } = require('../middleware/auth');
const { roleMiddleware } = require('../middleware/role');
const walletService = require('../services/wallet.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * Role-Isolated Transaction Routes — /api/v1/transactions
 * Vendor and Creator transaction ledgers are completely separated.
 */

// GET /api/v1/transactions/vendor — Vendor-only transaction history
router.get('/vendor', authenticate, roleMiddleware('vendor'), asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || 1, 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 20, 10)));

  const result = await walletService.getRoleTransactions(req.user._id, 'vendor', page, limit);

  return ApiResponse.paginated(res, 'Vendor transactions loaded.', result.items, {
    page,
    limit,
    total: result.total,
  });
}));

// GET /api/v1/transactions/creator — Creator-only transaction history
router.get('/creator', authenticate, roleMiddleware('creator'), asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || 1, 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 20, 10)));

  const result = await walletService.getRoleTransactions(req.user._id, 'creator', page, limit);

  return ApiResponse.paginated(res, 'Creator transactions loaded.', result.items, {
    page,
    limit,
    total: result.total,
  });
}));

module.exports = router;
