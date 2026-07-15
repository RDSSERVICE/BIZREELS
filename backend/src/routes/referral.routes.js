const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const referralService = require('../services/referral.service');
const { catchAsync } = require('../utils/helpers');

const router = express.Router();

router.get('/', requireAuth, catchAsync(async (req, res) => {
  const userId = req.user._id.toString();
  const code = await referralService.ensureCode(userId);
  const lst = await referralService.listMyReferrals(userId);
  res.json({ referral_code: code, ...lst });
}));

module.exports = router;
