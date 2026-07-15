const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const chatService = require('../services/chat.service');
const dealService = require('../services/deal.service');
const socketService = require('../services/socket.service');
const User = require('../models/User');
const Listing = require('../models/Listing');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// ============================================================ CHAT THREADS
router.post('/chat/threads', requireAuth, catchAsync(async (req, res) => {
  const { peer_user_id, context_type = 'direct', context_id } = req.body;
  if (!peer_user_id) {
    throw ApiError.badRequest('peer_user_id is required');
  }

  const result = await chatService.getOrCreateThread(
    req.user._id.toString(),
    peer_user_id,
    context_id || null,
    context_type
  );
  res.json(result);
}));

router.get('/chat/threads/me', requireAuth, catchAsync(async (req, res) => {
  const items = await chatService.listMyThreads(req.user._id.toString());
  const totalUnread = items.reduce((sum, t) => sum + parseInt(t.my_unread || 0, 10), 0);
  res.json({ items, unread_total: totalUnread });
}));

router.get('/chat/threads/:thread_id', requireAuth, catchAsync(async (req, res) => {
  const result = await chatService.getThread(req.params.thread_id, req.user._id.toString());
  res.json(result);
}));

router.get('/chat/threads/:thread_id/messages', requireAuth, catchAsync(async (req, res) => {
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 50, 10)));
  const result = await chatService.listMessages(
    req.params.thread_id,
    req.user._id.toString(),
    req.query.cursor || null,
    limit
  );
  res.json(result);
}));

router.post('/chat/threads/:thread_id/messages', requireAuth, catchAsync(async (req, res) => {
  const result = await chatService.sendMessage(
    req.params.thread_id,
    req.user._id.toString(),
    req.body
  );
  res.json(result);
}));

router.post('/chat/threads/:thread_id/read', requireAuth, catchAsync(async (req, res) => {
  const result = await chatService.markRead(req.params.thread_id, req.user._id.toString());
  res.json(result);
}));

router.post('/chat/threads/:thread_id/archive', requireAuth, catchAsync(async (req, res) => {
  const result = await chatService.toggleArchive(req.params.thread_id, req.user._id.toString());
  res.json(result);
}));

router.get('/chat/presence/:user_id', catchAsync(async (req, res) => {
  const { user_id } = req.params;
  res.json({ user_id, online: socketService.isOnline(user_id) });
}));

router.get('/chat/unread-total', requireAuth, catchAsync(async (req, res) => {
  const count = await chatService.unreadTotal(req.user._id.toString());
  res.json({ unread_total: count });
}));

// ============================================================ DEALS
router.post('/deals', requireAuth, catchAsync(async (req, res) => {
  const result = await dealService.createDeal(req.user._id.toString(), req.body);
  res.json(result);
}));

router.get('/deals/me', requireAuth, catchAsync(async (req, res) => {
  const result = await dealService.myDeals(req.user._id.toString(), req.query.status || null);
  res.json(result);
}));

router.get('/deals/:deal_id', requireAuth, catchAsync(async (req, res) => {
  const result = await dealService.getById(req.params.deal_id, req.user._id.toString());
  res.json(result);
}));

router.post('/deals/:deal_id/counter', requireAuth, catchAsync(async (req, res) => {
  const { amount, note } = req.body;
  if (amount === undefined) {
    throw ApiError.badRequest('amount is required');
  }

  const result = await dealService.counter(req.params.deal_id, req.user._id.toString(), amount, note || null);
  res.json(result);
}));

router.post('/deals/:deal_id/accept', requireAuth, catchAsync(async (req, res) => {
  const result = await dealService.accept(req.params.deal_id, req.user._id.toString());
  res.json(result);
}));

router.post('/deals/:deal_id/reject', requireAuth, catchAsync(async (req, res) => {
  const result = await dealService.reject(req.params.deal_id, req.user._id.toString());
  res.json(result);
}));

router.post('/deals/:deal_id/cancel', requireAuth, catchAsync(async (req, res) => {
  const result = await dealService.cancel(req.params.deal_id, req.user._id.toString());
  res.json(result);
}));

router.post('/deals/:deal_id/complete', requireAuth, catchAsync(async (req, res) => {
  const result = await dealService.complete(req.params.deal_id, req.user._id.toString());
  res.json(result);
}));

// ============================================================ WHATSAPP LINK HELPER
router.get('/utils/whatsapp-link', catchAsync(async (req, res) => {
  const { vendor_id, listing_id } = req.query;
  if (!vendor_id || !mongoose.Types.ObjectId.isValid(vendor_id)) {
    throw ApiError.badRequest('Invalid vendor id');
  }

  const v = await User.findById(vendor_id);
  if (!v || !v.phone) {
    throw ApiError.notFound('Vendor has no phone');
  }

  let text = `Hi ${v.name || ''}, I'm interested in your`;
  let listing = null;
  if (listing_id && mongoose.Types.ObjectId.isValid(listing_id)) {
    listing = await Listing.findById(listing_id);
  }
  if (listing) {
    text += ` listing "${listing.title}"`;
  }
  text += ' on Emergent.';

  if (listing) {
    const protocol = req.protocol;
    const host = req.get('host');
    text += ` ${protocol}://${host}/listing/${listing.slug}`;
  }

  res.json({
    wa_url: `https://wa.me/91${v.phone}?text=${encodeURIComponent(text)}`,
    phone: v.phone,
  });
}));

module.exports = router;
