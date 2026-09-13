const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { authenticate } = require('../middleware/auth');
const callService = require('../services/call.service');
const { catchAsync } = require('../utils/helpers');
const ApiResponse = require('../utils/ApiResponse');

const router = express.Router();

/**
 * Check if a vendor is available to take voice calls
 */
router.post('/check-availability', catchAsync(async (req, res) => {
  const { vendorId } = req.body;
  const result = await callService.checkCallAvailability(vendorId);
  res.json({ success: true, data: result });
}));

/**
 * Customer initiates a call to a vendor
 */
router.post('/initiate', authenticate, catchAsync(async (req, res) => {
  const { vendorId, listingId } = req.body;
  const customerId = req.user._id.toString();

  const result = await callService.initiateCall({
    customerId,
    vendorId,
    listingId: listingId || null,
  });

  res.json({ success: result.success, data: result });
}));

/**
 * Vendor retrieves their call history and customer leads
 */
router.get('/vendor-history', authenticate, catchAsync(async (req, res) => {
  const vendorId = req.user._id.toString();
  const { page = 1, limit = 20 } = req.query;

  const result = await callService.getVendorCallHistory({
    vendorId,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  res.json({ success: true, data: result });
}));

/**
 * Exotel Webhook (called by Exotel or simulated in dev)
 */
router.post('/webhook', catchAsync(async (req, res) => {
  const payload = { ...req.body, ...req.query };
  const result = await callService.handleExotelWebhook(payload);
  res.json({ success: true, data: result });
}));

module.exports = router;
