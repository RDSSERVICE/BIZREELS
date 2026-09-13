const express = require('express');
const { authenticate } = require('../middleware/auth');
const whatsappMetaService = require('../services/whatsapp-meta.service');
const { catchAsync } = require('../utils/helpers');
const logger = require('../utils/logger');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// WEBHOOK ENDPOINTS (Unauthenticated — verified via Meta signature)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/webhooks/whatsapp
 * Meta Webhook Verification Challenge
 * Called by Meta during webhook URL registration.
 */
router.get('/', catchAsync(async (req, res) => {
  const result = whatsappMetaService.handleVerificationChallenge(req.query);

  if (result.verified) {
    return res.status(200).send(result.challenge);
  }

  return res.status(403).json({ error: 'Verification failed' });
}));

/**
 * POST /api/v1/webhooks/whatsapp
 * Inbound WhatsApp Message Webhook from Meta Cloud API.
 * Signature is validated, then processed for lead tracking + billing.
 */
router.post('/', catchAsync(async (req, res) => {
  // Per Meta docs: always respond 200 quickly, even if processing fails
  // Meta retries on non-200 responses
  const signature = req.headers['x-hub-signature-256'];

  // Validate signature (rawBody is set via express.raw middleware or custom parser)
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const isValid = whatsappMetaService.verifyWebhookSignature(rawBody, signature);

  if (!isValid) {
    logger.warn('[WhatsApp Webhook] Invalid signature received', { service: 'whatsapp-meta' });
    return res.status(200).json({ received: true }); // Respond 200 to prevent Meta retries on bad sig
  }

  // Process asynchronously but respond immediately
  const payload = req.body;

  // Fire-and-forget processing (respond 200 immediately per Meta best practices)
  setImmediate(async () => {
    try {
      await whatsappMetaService.handleInboundWebhook(payload);
    } catch (err) {
      logger.error(`[WhatsApp Webhook] Processing error: ${err.message}`, { service: 'whatsapp-meta' });
    }
  });

  return res.status(200).json({ received: true });
}));


// ─────────────────────────────────────────────────────────────
// CUSTOMER ENDPOINTS (Authenticated)
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/whatsapp/click
 * Customer clicks WhatsApp button → generates tracking context + wa.me link.
 * 0 credits charged on click (billing happens on inbound message).
 */
router.post('/click', authenticate, catchAsync(async (req, res) => {
  const { vendorId, listingId, reelId } = req.body;
  const customerId = req.user._id.toString();
  const customerPhone = req.user.phone || req.user.mobileNumber || null;

  const result = await whatsappMetaService.generateClickContext({
    vendorId,
    customerId,
    customerPhone,
    listingId: listingId || null,
    reelId: reelId || null,
  });

  res.json({ success: true, data: result });
}));


// ─────────────────────────────────────────────────────────────
// VENDOR ENDPOINTS (Authenticated)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/whatsapp/vendor/status
 * Vendor's WhatsApp Business connection status and messaging tier.
 */
router.get('/vendor/status', authenticate, catchAsync(async (req, res) => {
  const vendorId = req.user._id.toString();
  const result = await whatsappMetaService.getVendorWhatsAppStatus(vendorId);
  res.json({ success: true, data: result });
}));

/**
 * POST /api/v1/whatsapp/vendor/connect
 * Initiate or update vendor WhatsApp Business connection.
 */
router.post('/vendor/connect', authenticate, catchAsync(async (req, res) => {
  const vendorId = req.user._id.toString();
  const { wabaId, phoneNumberId, status, messagingTier } = req.body;

  const result = await whatsappMetaService.updateVendorWhatsAppConnection({
    vendorId,
    wabaId,
    phoneNumberId,
    status: status || 'pending_verification',
    messagingTier,
  });

  res.json({ success: true, data: result });
}));

/**
 * POST /api/v1/whatsapp/vendor/embedded-signup-callback
 * Handles Meta Embedded Signup popup completion from frontend.
 */
router.post('/vendor/embedded-signup-callback', authenticate, catchAsync(async (req, res) => {
  const vendorId = req.user._id.toString();
  const { code, wabaId, phoneNumberId } = req.body;

  const result = await whatsappMetaService.handleEmbeddedSignupCallback({
    vendorId,
    code,
    wabaId,
    phoneNumberId,
  });

  res.json({ success: true, data: result });
}));

/**
 * GET /api/v1/whatsapp/vendor/leads
 * Paginated WhatsApp leads for vendor CRM dashboard.
 */
router.get('/vendor/leads', authenticate, catchAsync(async (req, res) => {
  const vendorId = req.user._id.toString();
  const { page = 1, limit = 20, status } = req.query;

  const result = await whatsappMetaService.getVendorLeads({
    vendorId,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    status: status || 'all',
  });

  res.json({ success: true, data: result });
}));


// ─────────────────────────────────────────────────────────────
// SANDBOX / DEV SIMULATION ENDPOINT
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/whatsapp/simulate-inbound
 * Simulates a Meta inbound webhook for testing (sandbox mode only).
 */
router.post('/simulate-inbound', authenticate, catchAsync(async (req, res) => {
  const { vendorId, customerPhone, customerName, messageText, listingId } = req.body;

  const result = await whatsappMetaService.simulateInbound({
    vendorId: vendorId || req.user._id.toString(),
    customerPhone,
    customerName,
    messageText,
    listingId,
  });

  res.json({ success: true, data: result });
}));


module.exports = router;
