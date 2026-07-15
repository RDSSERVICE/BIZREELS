const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const requirementService = require('../services/requirement.service');
const proposalService = require('../services/proposal.service');
const identityService = require('../services/identity.service');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// ============================================================ REQUIREMENTS
router.post('/requirements', requireAuth, catchAsync(async (req, res) => {
  const result = await requirementService.create(req.user._id.toString(), req.body);
  res.json(result);
}));

router.get('/requirements', catchAsync(async (req, res) => {
  const filters = {
    category_id: req.query.category_id || null,
    city: req.query.city || null,
    urgency: req.query.urgency || null,
    budget_max: req.query.budget_max ? parseFloat(req.query.budget_max) : null,
    q: req.query.q || null,
  };
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || 20, 10)));
  const cursor = req.query.cursor || null;

  const result = await requirementService.listRequirements(filters, limit, cursor);
  res.json(result);
}));

router.get('/requirements/me/posted', requireAuth, catchAsync(async (req, res) => {
  const items = await requirementService.myPosted(req.user._id.toString());
  res.json({ items });
}));

router.get('/requirements/:req_id', catchAsync(async (req, res) => {
  const { req_id } = req.params;
  const r = await requirementService.getById(req_id);

  // Background/asynchronous task: views increment
  requirementService.incrementViews(req_id).catch(() => {});

  res.json(r);
}));

router.patch('/requirements/:req_id', requireAuth, catchAsync(async (req, res) => {
  const result = await requirementService.update(req.params.req_id, req.user._id.toString(), req.body);
  res.json(result);
}));

router.delete('/requirements/:req_id', requireAuth, catchAsync(async (req, res) => {
  await requirementService.softDelete(req.params.req_id, req.user._id.toString());
  res.json({ success: true });
}));

router.post('/requirements/:req_id/close', requireAuth, catchAsync(async (req, res) => {
  const result = await requirementService.closeRequirement(req.params.req_id, req.user._id.toString());
  res.json(result);
}));

router.get('/requirements/:req_id/proposals', requireAuth, catchAsync(async (req, res) => {
  const items = await proposalService.listByRequirement(req.params.req_id, req.user._id.toString());
  res.json({ items });
}));

// ============================================================ PROPOSALS
router.post('/proposals', requireAuth, catchAsync(async (req, res) => {
  const roles = req.user.roles || [];
  if (!roles.includes('vendor')) {
    throw ApiError.forbidden('Vendor role required');
  }

  // Phase 7e: vendor must have >=1 verified identity doc to send offers
  await identityService.requireVerifiedIdentity(req.user._id.toString());

  const result = await proposalService.create(req.user._id.toString(), req.body);
  res.json(result);
}));

router.get('/proposals/me/sent', requireAuth, catchAsync(async (req, res) => {
  const items = await proposalService.mySent(req.user._id.toString());
  res.json({ items });
}));

router.post('/proposals/:pid/shortlist', requireAuth, catchAsync(async (req, res) => {
  const result = await proposalService.shortlist(req.params.pid, req.user._id.toString());
  res.json(result);
}));

router.post('/proposals/:pid/reject', requireAuth, catchAsync(async (req, res) => {
  const result = await proposalService.reject(req.params.pid, req.user._id.toString());
  res.json(result);
}));

router.post('/proposals/:pid/accept', requireAuth, catchAsync(async (req, res) => {
  const result = await proposalService.accept(req.params.pid, req.user._id.toString());
  res.json(result);
}));

module.exports = router;
