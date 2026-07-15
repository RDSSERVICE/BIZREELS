const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const reportService = require('../services/report.service');
const { checkAndRecord } = require('../utils/rateLimit');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const requireAdmin = (req, res, next) => {
  const roles = req.user.roles || [];
  if (!roles.includes('admin')) {
    return next(ApiError.forbidden('Admin only'));
  }
  next();
};

router.post('/reports', requireAuth, catchAsync(async (req, res) => {
  const { target_type, target_id, reason, description } = req.body;
  if (!target_type || !target_id || !reason) {
    throw ApiError.badRequest('target_type, target_id and reason are required');
  }
  if (!['listing', 'user', 'review', 'message'].includes(target_type)) {
    throw ApiError.badRequest('Invalid target_type');
  }
  if (!['spam', 'offensive', 'scam', 'wrong_category', 'other'].includes(reason)) {
    throw ApiError.badRequest('Invalid reason');
  }

  // Rate limit: 10 reports per hour per user
  const userId = req.user._id.toString();
  const { allowed, remaining } = checkAndRecord(`report:${userId}`, 10, 3600);
  if (!allowed) {
    throw new ApiError(429, `Too many reports. Try again in ${remaining} seconds.`);
  }

  const result = await reportService.createReport(userId, {
    target_type,
    target_id,
    reason,
    description: description ? String(description).slice(0, 1000) : null,
  });

  res.json(result);
}));

router.get('/admin/reports', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { status, target_type, cursor } = req.query;
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 30, 10)));

  const result = await reportService.listReports(status || null, target_type || null, cursor || null, limit);
  res.json(result);
}));

router.post('/admin/reports/:rid/resolve', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { action = 'none', note } = req.body;
  if (!['takedown', 'warn', 'ban', 'none'].includes(action)) {
    throw ApiError.badRequest('Invalid action');
  }

  const result = await reportService.resolveReport(req.params.rid, req.user._id.toString(), action, note || null);
  res.json(result);
}));

router.post('/admin/reports/:rid/dismiss', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const reason = req.body?.reason || null;
  const result = await reportService.dismissReport(req.params.rid, req.user._id.toString(), reason);
  res.json(result);
}));

module.exports = router;
