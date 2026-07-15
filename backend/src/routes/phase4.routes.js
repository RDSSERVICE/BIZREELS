const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const reviewService = require('../services/review.service');
const walletService = require('../services/wallet.service');
const notificationService = require('../services/notification.service');
const paymentService = require('../services/payment.service');
const razorpayService = require('../services/razorpay.service');
const subscriptionService = require('../services/subscription.service');
const kycService = require('../services/kyc.service');
const trustService = require('../services/trust.service');
const Payment = require('../models/Phase4').Payment;
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

const PLAN_PAISE = {
  verified_monthly: 29900,
  verified_yearly: 299900,
};

// ============================================================ REVIEWS
router.post('/reviews', requireAuth, catchAsync(async (req, res) => {
  const result = await reviewService.createReview(req.user._id.toString(), req.body);
  res.json(result);
}));

router.get('/reviews', catchAsync(async (req, res) => {
  const { target_type, target_id, sort = 'recent', cursor } = req.query;
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || 20, 10)));
  if (!target_type || !target_id) {
    throw ApiError.badRequest('target_type and target_id are required');
  }

  const result = await reviewService.listReviews(target_type, target_id, sort, cursor, limit);
  res.json(result);
}));

router.patch('/reviews/:rid', requireAuth, catchAsync(async (req, res) => {
  const result = await reviewService.updateReview(req.params.rid, req.user._id.toString(), req.body);
  res.json(result);
}));

router.delete('/reviews/:rid', requireAuth, catchAsync(async (req, res) => {
  const is_admin = req.user.roles && req.user.roles.includes('admin');
  await reviewService.softDeleteReview(req.params.rid, req.user._id.toString(), is_admin);
  res.json({ ok: true });
}));

router.post('/reviews/:rid/reply', requireAuth, catchAsync(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    throw ApiError.badRequest('text is required');
  }
  const result = await reviewService.replyToReview(req.params.rid, req.user._id.toString(), text);
  res.json(result);
}));

router.post('/reviews/:rid/helpful', requireAuth, catchAsync(async (req, res) => {
  const result = await reviewService.toggleHelpful(req.params.rid, req.user._id.toString());
  res.json(result);
}));

router.get('/reviews/vendor/:vendor_id/summary', catchAsync(async (req, res) => {
  const result = await reviewService.summary('vendor', req.params.vendor_id);
  res.json(result);
}));

// ============================================================ NOTIFICATIONS
router.get('/notifications/me', requireAuth, catchAsync(async (req, res) => {
  const isRead = req.query.is_read !== undefined ? req.query.is_read === 'true' : null;
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 30, 10)));

  const result = await notificationService.listMine(req.user._id.toString(), isRead, req.query.cursor || null, limit);
  res.json(result);
}));

router.get('/notifications/me/unread-count', requireAuth, catchAsync(async (req, res) => {
  const count = await notificationService.unreadCount(req.user._id.toString());
  res.json({ count });
}));

router.post('/notifications/:nid/read', requireAuth, catchAsync(async (req, res) => {
  await notificationService.markRead(req.params.nid, req.user._id.toString());
  res.json({ ok: true });
}));

router.post('/notifications/me/read-all', requireAuth, catchAsync(async (req, res) => {
  await notificationService.markAllRead(req.user._id.toString());
  res.json({ ok: true });
}));

router.delete('/notifications/:nid', requireAuth, catchAsync(async (req, res) => {
  await notificationService.dismiss(req.params.nid, req.user._id.toString());
  res.json({ ok: true });
}));

// ============================================================ WALLET
router.get('/wallet/me', requireAuth, catchAsync(async (req, res) => {
  const w = await walletService.getOrCreate(req.user._id.toString());
  const txns = await walletService.listTransactions(req.user._id.toString(), 20);
  res.json({ wallet: w, transactions: txns });
}));

router.get('/wallet/me/transactions', requireAuth, catchAsync(async (req, res) => {
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit || 50, 10)));
  const txns = await walletService.listTransactions(req.user._id.toString(), limit);
  res.json({ items: txns });
}));

router.post('/wallet/me/topup', requireAuth, catchAsync(async (req, res) => {
  const { amount_paise } = req.body;
  if (!amount_paise || amount_paise < 100) {
    throw ApiError.badRequest('amount_paise must be at least 100');
  }

  const order = await paymentService.createPaymentOrder(req.user._id.toString(), 'wallet_topup', amount_paise);
  res.json(order);
}));

// ============================================================ PAYMENTS
router.post('/payments/order', requireAuth, catchAsync(async (req, res) => {
  const { purpose, amount_paise, ref_id } = req.body;
  if (!purpose) {
    throw ApiError.badRequest('purpose is required');
  }

  let amt = amount_paise;
  if (purpose.startsWith('verified_badge')) {
    const planSuffix = purpose.split('_').pop(); // monthly / yearly
    amt = PLAN_PAISE[`verified_${planSuffix}`] || amt;
  }

  if (!amt || amt <= 0) {
    throw ApiError.badRequest('amount required');
  }

  const order = await paymentService.createPaymentOrder(req.user._id.toString(), purpose, amt, ref_id || null);
  res.json(order);
}));

router.post('/payments/verify', requireAuth, catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw ApiError.badRequest('Missing Razorpay verification tokens');
  }

  const result = await paymentService.verifyAndCapture(
    req.user._id.toString(),
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );
  res.json(result);
}));

router.post('/payments/dev/simulate-success', requireAuth, catchAsync(async (req, res) => {
  const { payment_id } = req.body;
  if (!payment_id) {
    throw ApiError.badRequest('payment_id is required');
  }

  const result = await paymentService.devSimulateSuccess(payment_id, req.user._id.toString());
  res.json(result);
}));

router.get('/payments/me', requireAuth, catchAsync(async (req, res) => {
  const items = await paymentService.myPayments(req.user._id.toString());
  res.json({ items });
}));

router.post('/payments/webhook', catchAsync(async (req, res) => {
  const rawBody = req.rawBody; // Assumes raw body parser handles signature
  const sig = req.headers['x-razorpay-signature'] || '';
  if (!rawBody || !razorpayService.verifyWebhookSignature(rawBody, sig)) {
    throw ApiError.badRequest('Invalid webhook signature');
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf-8'));
  } catch (err) {
    throw ApiError.badRequest('Bad payload');
  }

  const event = payload.event;
  const payEntity = payload.payload?.payment?.entity || {};
  const orderId = payEntity.order_id;

  if (event === 'payment.captured' && orderId) {
    const pdoc = await Payment.findOne({ razorpay_order_id: orderId });
    if (pdoc && pdoc.status !== 'captured') {
      await paymentService.applySuccess(pdoc, payEntity.id, sig);
    }
  }

  res.json({ ok: true });
}));

// ============================================================ SUBSCRIPTIONS
router.post('/subscriptions/subscribe', requireAuth, catchAsync(async (req, res) => {
  const { plan } = req.body;
  if (!['verified_monthly', 'verified_yearly'].includes(plan)) {
    throw ApiError.badRequest('Invalid plan');
  }

  const result = await subscriptionService.createSubOrder(req.user._id.toString(), plan);
  res.json(result);
}));

router.get('/subscriptions/me', requireAuth, catchAsync(async (req, res) => {
  const items = await subscriptionService.mySubs(req.user._id.toString());
  res.json({ items });
}));

router.post('/subscriptions/:sid/cancel', requireAuth, catchAsync(async (req, res) => {
  const result = await subscriptionService.cancelSub(req.params.sid, req.user._id.toString());
  res.json(result);
}));

// ============================================================ KYC
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

// ============================================================ ADMIN KYC
router.get('/admin/kyc', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const items = await kycService.kycQueue();
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
