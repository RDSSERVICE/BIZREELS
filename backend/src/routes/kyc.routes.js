const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const kycService = require('../services/kyc.service');
const trustService = require('../services/trust.service');
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

// ============================================================ KYC (self-serve)
router.post('/kyc/me/submit', requireAuth, catchAsync(async (req, res) => {
  const { doc_type, doc_number, doc_url, selfie_url } = req.body;
  if (!['aadhaar', 'pan', 'driving_license', 'passport'].includes(doc_type)) {
    throw ApiError.badRequest('Invalid doc_type');
  }
  if (!doc_number || doc_number.length < 4 || doc_number.length > 32) {
    throw ApiError.badRequest('Invalid doc_number');
  }
  if (!doc_url) {
    throw ApiError.badRequest('doc_url is required');
  }

  const result = await kycService.kycSubmit(req.user._id.toString(), {
    doc_type,
    doc_number,
    doc_url,
    selfie_url: selfie_url || null,
  });
  res.json(result);
}));

router.get('/kyc/me', requireAuth, catchAsync(async (req, res) => {
  const result = await kycService.myKyc(req.user._id.toString());
  res.json(result || { status: 'unverified' });
}));

// ============================================================ ADMIN KYC QUEUE
router.get('/admin/kyc', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const items = await kycService.kycQueue(req.query.status || null);
  res.json({ items });
}));

router.post('/admin/kyc/:kid/approve', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await kycService.kycReview(req.params.kid, req.user._id.toString(), true);
  res.json(result);
}));

router.post('/admin/kyc/:kid/reject', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const reason = req.body?.reason || req.query.reason || null;
  const result = await kycService.kycReview(req.params.kid, req.user._id.toString(), false, reason);
  res.json(result);
}));

// ============================================================ TRUST SCORE
router.get('/users/:user_id/trust-score', catchAsync(async (req, res) => {
  const result = await trustService.getTrustScore(req.params.user_id);
  res.json(result);
}));

module.exports = router;
