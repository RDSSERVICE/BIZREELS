const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const identityService = require('../services/identity.service');
const trustPlusService = require('../services/trust-plus.service');
const { checkAndRecord } = require('../utils/rateLimit');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const AADHAAR_RE = /^\d{12}$/;
const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
const GST_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9][Z][A-Z0-9]$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const enforceKycRateLimit = (userId, docType) => {
  const { allowed, remaining } = checkAndRecord(`kyc:${docType}:${userId}`, 5, 86400);
  if (!allowed) {
    throw new ApiError(429, `Too many ${docType} submissions today. Try again in ${remaining}s`);
  }
};

const maybeAwardTrustPlus = async (userId) => {
  try {
    await trustPlusService.maybeAwardBonus(userId);
  } catch (err) {
    // Non-fatal
  }
};

router.post('/aadhaar/verify', requireAuth, catchAsync(async (req, res) => {
  const { aadhaar_number, doc_url } = req.body;
  if (!aadhaar_number || !AADHAAR_RE.test(aadhaar_number)) {
    throw ApiError.badRequest('Invalid Aadhaar format (12 digits)');
  }
  if (!doc_url) {
    throw ApiError.badRequest('doc_url is required');
  }

  const userId = req.user._id.toString();
  enforceKycRateLimit(userId, 'aadhaar');

  const doc = await identityService.submitDocument({
    userId,
    docType: 'aadhaar',
    docNumber: aadhaar_number,
    docUrl: doc_url,
  });

  await maybeAwardTrustPlus(userId);
  res.json(doc);
}));

router.post('/pan/verify', requireAuth, catchAsync(async (req, res) => {
  const { pan_number, doc_url } = req.body;
  if (!pan_number || !PAN_RE.test(pan_number.toUpperCase())) {
    throw ApiError.badRequest('Invalid PAN format (e.g. ABCDE1234F)');
  }
  if (!doc_url) {
    throw ApiError.badRequest('doc_url is required');
  }

  const userId = req.user._id.toString();
  enforceKycRateLimit(userId, 'pan');

  const doc = await identityService.submitDocument({
    userId,
    docType: 'pan',
    docNumber: pan_number.toUpperCase(),
    docUrl: doc_url,
  });

  await maybeAwardTrustPlus(userId);
  res.json(doc);
}));

router.post('/gst/verify', requireAuth, catchAsync(async (req, res) => {
  const { gst_number, doc_url } = req.body;
  if (!gst_number || !GST_RE.test(gst_number.toUpperCase())) {
    throw ApiError.badRequest('Invalid GST format (15 chars)');
  }
  if (!doc_url) {
    throw ApiError.badRequest('doc_url is required');
  }

  const userId = req.user._id.toString();
  enforceKycRateLimit(userId, 'gst');

  const doc = await identityService.submitDocument({
    userId,
    docType: 'gst',
    docNumber: gst_number.toUpperCase(),
    docUrl: doc_url,
  });

  await maybeAwardTrustPlus(userId);
  res.json(doc);
}));

router.post('/bank/verify', requireAuth, catchAsync(async (req, res) => {
  const { account_number, ifsc, holder_name, bank_name, doc_url } = req.body;
  if (!ifsc || !IFSC_RE.test(ifsc.toUpperCase())) {
    throw ApiError.badRequest('Invalid IFSC format');
  }
  if (!account_number || account_number.length < 6 || account_number.length > 32) {
    throw ApiError.badRequest('Account number must be between 6 and 32 characters');
  }
  if (!holder_name || holder_name.length < 2 || holder_name.length > 120) {
    throw ApiError.badRequest('Holder name must be between 2 and 120 characters');
  }
  if (!doc_url) {
    throw ApiError.badRequest('doc_url is required');
  }

  const userId = req.user._id.toString();
  enforceKycRateLimit(userId, 'bank');

  const doc = await identityService.submitDocument({
    userId,
    docType: 'bank',
    docNumber: account_number,
    docUrl: doc_url,
    additionalData: {
      ifsc: ifsc.toUpperCase(),
      account_number,
      holder_name: String(holder_name).trim(),
      bank_name: bank_name ? String(bank_name).trim() : null,
    },
  });

  await maybeAwardTrustPlus(userId);
  res.json(doc);
}));

router.get('/trust-plus/me', requireAuth, catchAsync(async (req, res) => {
  const status = await trustPlusService.computeStatus(req.user._id.toString());
  res.json(status);
}));

router.get('/me/status', requireAuth, catchAsync(async (req, res) => {
  const summary = await identityService.getStatusSummary(req.user._id.toString());
  res.json(summary);
}));

router.get('/me/docs', requireAuth, catchAsync(async (req, res) => {
  const items = await identityService.listDocuments(req.user._id.toString());
  res.json({ items });
}));

router.delete('/docs/:doc_id', requireAuth, catchAsync(async (req, res) => {
  const result = await identityService.deleteDocument(req.user._id.toString(), req.params.doc_id);
  res.json(result);
}));

module.exports = router;
