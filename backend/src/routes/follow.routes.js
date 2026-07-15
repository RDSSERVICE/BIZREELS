const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const followService = require('../services/follow.service');
const { catchAsync } = require('../utils/helpers');

const router = express.Router();

router.post('/:user_id', requireAuth, catchAsync(async (req, res) => {
  const result = await followService.follow(req.user._id.toString(), req.params.user_id);
  res.json(result);
}));

router.delete('/:user_id', requireAuth, catchAsync(async (req, res) => {
  const result = await followService.unfollow(req.user._id.toString(), req.params.user_id);
  res.json(result);
}));

router.get('/me/following', requireAuth, catchAsync(async (req, res) => {
  const items = await followService.myFollowing(req.user._id.toString());
  res.json({ items, count: items.length });
}));

module.exports = router;
