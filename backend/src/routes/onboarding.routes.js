const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const onboardingService = require('../services/onboarding.service');
const { catchAsync } = require('../utils/helpers');

const router = express.Router();

router.get('/', requireAuth, catchAsync(async (req, res) => {
  const result = await onboardingService.maybeGrantBonus(req.user._id.toString());
  res.json(result);
}));

module.exports = router;
