const crypto = require('crypto');
const mongoose = require('mongoose');
const config = require('../config');
const WhatsAppLead = require('../models/WhatsAppLead');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppTrackingContext = require('../models/WhatsAppTrackingContext');
const User = require('../models/User');
const actionChargeService = require('./action-charge.service');
const { Wallet } = require('../models/Phase4');
const { emitToUser } = require('../sockets');
const logger = require('../utils/logger');

/**
 * WhatsApp Meta Cloud API Service (Production v2)
 *
 * Implements the unified wallet charging model for WhatsApp leads:
 * 1. Click → generateClickContext() → tracking token + wa.me link (0 credits)
 * 2. Inbound webhook → handleInboundWebhook() → dedup + wallet deduction (2.50 credits)
 * 3. Idempotency via provider_message_id on WhatsAppMessage
 * 4. 24-hour dedup via ActionDedup
 * 5. Zero-wallet safeguard: lead captured as unbilled_insufficient_balance
 */
class WhatsAppMetaService {

  /**
   * Generate a short-lived tracking context token when customer clicks WhatsApp.
   * Returns a wa.me deep link with the reference token embedded.
   * Per spec Section 6: NO credits are charged on click.
   */
  async generateClickContext({ vendorId, customerId, customerPhone, listingId, reelId }) {
    if (!vendorId) {
      throw new Error('vendorId is required');
    }

    const vId = vendorId.toString();

    // Resolve vendor's WhatsApp number
    const vendor = await User.findById(vId)
      .select('vendorProfile phone mobileNumber name')
      .lean();

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const vendorPhone = vendor.vendorProfile?.whatsappNumber
      || vendor.vendorProfile?.whatsapp
      || vendor.vendorProfile?.mobileNumber
      || vendor.phone
      || vendor.mobileNumber;

    if (!vendorPhone) {
      throw new Error('Vendor WhatsApp number not configured');
    }

    // Clean phone to digits only (Indian format without +91 for wa.me)
    const cleanPhone = vendorPhone.replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    // Generate unique tracking token
    const contextToken = `BZR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create tracking context (TTL: 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await WhatsAppTrackingContext.create({
      context_token: contextToken,
      vendor_id: vId,
      customer_id: customerId || null,
      customer_phone: customerPhone || null,
      listing_id: listingId || null,
      reel_id: reelId || null,
      vendor_phone: waPhone,
      expires_at: expiresAt,
    });

    // Build pre-filled message for wa.me
    let listing = null;
    if (listingId) {
      try {
        const Listing = mongoose.model('Listing');
        listing = await Listing.findById(listingId).select('title price').lean();
      } catch (e) {}
    }

    const vendorName = vendor.name || 'there';
    let messageText = `Hello ${vendorName}!`;
    if (listing) {
      messageText += `\nI found your listing "${listing.title}" on BizReels`;
      if (listing.price) {
        messageText += ` (₹${Number(listing.price).toLocaleString('en-IN')})`;
      }
      messageText += '.';
    }
    messageText += `\nI would like to inquire about details/availability.`;
    messageText += `\n[Ref: ${contextToken}]`;

    const encodedText = encodeURIComponent(messageText);
    const waLink = `https://wa.me/${waPhone}?text=${encodedText}`;

    logger.info(`[WhatsApp Meta] Click context created: ${contextToken} for vendor ${vId}`, { service: 'whatsapp-meta' });

    return {
      success: true,
      context_token: contextToken,
      wa_link: waLink,
      vendor_phone: waPhone,
      expires_at: expiresAt,
    };
  }

  /**
   * Verify Meta webhook signature using HMAC-SHA256.
   * Per Meta Cloud API documentation.
   */
  verifyWebhookSignature(rawBody, signature) {
    const appSecret = config.metaWhatsApp?.appSecret;
    if (!appSecret) {
      logger.warn('[WhatsApp Meta] META_APP_SECRET not configured, skipping signature validation');
      return config.metaWhatsApp?.webhookMode === 'sandbox';
    }

    if (!signature) return false;

    const sigHash = signature.replace('sha256=', '');
    const expectedHash = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(sigHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  }

  /**
   * Handle Meta webhook verification challenge (GET request).
   */
  handleVerificationChallenge(query) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const expectedToken = config.metaWhatsApp?.verifyToken || 'bizreels_whatsapp_verify_2026';

    if (mode === 'subscribe' && token === expectedToken) {
      logger.info('[WhatsApp Meta] Webhook verification successful', { service: 'whatsapp-meta' });
      return { verified: true, challenge };
    }

    logger.warn('[WhatsApp Meta] Webhook verification FAILED', { service: 'whatsapp-meta' });
    return { verified: false };
  }

  /**
   * Handle inbound webhook from Meta WhatsApp Cloud API.
   * This is the billing trigger per spec Section 6 & 16.
   *
   * Flow:
   * 1. Extract message from Meta payload
   * 2. Check idempotency via provider_message_id
   * 3. Resolve vendor via phone_number_id
   * 4. Extract tracking context token from message body
   * 5. Evaluate 24-hour deduplication
   * 6. Check vendor wallet and deduct 2.50 credits (or mark unbilled)
   * 7. Save WhatsAppLead and WhatsAppMessage
   */
  async handleInboundWebhook(payload) {
    const results = [];

    // Meta sends a nested structure: entry[].changes[].value.messages[]
    const entries = payload?.entry || [];

    for (const entry of entries) {
      const changes = entry?.changes || [];

      for (const change of changes) {
        if (change?.field !== 'messages') continue;

        const value = change?.value || {};
        const messages = value?.messages || [];
        const contacts = value?.contacts || [];
        const metaPhoneNumberId = value?.metadata?.phone_number_id;

        for (const msg of messages) {
          try {
            const result = await this._processInboundMessage({
              msg,
              contacts,
              metaPhoneNumberId,
              rawPayload: payload,
            });
            results.push(result);
          } catch (err) {
            logger.error(`[WhatsApp Meta] Error processing message: ${err.message}`, { service: 'whatsapp-meta' });
            results.push({ error: err.message, message_id: msg?.id });
          }
        }
      }
    }

    return { processed: results.length, results };
  }

  /**
   * Process a single inbound WhatsApp message.
   * @private
   */
  async _processInboundMessage({ msg, contacts, metaPhoneNumberId, rawPayload }) {
    const providerMessageId = msg?.id;
    const fromPhone = msg?.from; // Customer phone (e.g., '919876543210')
    const messageBody = msg?.text?.body || msg?.caption || '';
    const messageType = msg?.type || 'text';
    const timestamp = msg?.timestamp ? new Date(parseInt(msg.timestamp, 10) * 1000) : new Date();

    // Contact info from Meta
    const contactInfo = contacts?.[0] || {};
    const customerName = contactInfo?.profile?.name || 'WhatsApp Buyer';

    if (!providerMessageId || !fromPhone) {
      return { skipped: true, reason: 'missing_message_id_or_phone' };
    }

    // ── Step 1: Idempotency Check (Section 14) ──
    const existingMessage = await WhatsAppMessage.findOne({ provider_message_id: providerMessageId }).lean();
    if (existingMessage) {
      logger.info(`[WhatsApp Meta] Duplicate message ignored: ${providerMessageId}`, { service: 'whatsapp-meta' });
      return { skipped: true, reason: 'duplicate_provider_message', provider_message_id: providerMessageId };
    }

    // ── Step 2: Resolve Vendor via phone_number_id ──
    let vendor = null;
    if (metaPhoneNumberId) {
      vendor = await User.findOne({ whatsapp_phone_number_id: metaPhoneNumberId })
        .select('_id name vendorProfile wallet_credits walletBalance')
        .lean();
    }

    // Fallback: try to match tracking context
    let trackingContext = null;

    // ── Step 3: Extract Tracking Context Token ──
    const tokenMatch = messageBody.match(/\[Ref:\s*(BZR-[A-F0-9]+)\]/i);
    if (tokenMatch) {
      trackingContext = await WhatsAppTrackingContext.findOne({
        context_token: tokenMatch[1],
        expires_at: { $gt: new Date() },
      }).lean();
    }

    // If no vendor from phone_number_id, resolve from tracking context
    if (!vendor && trackingContext) {
      vendor = await User.findById(trackingContext.vendor_id)
        .select('_id name vendorProfile wallet_credits walletBalance')
        .lean();
    }

    // If still no vendor, try most recent tracking context for this phone
    if (!vendor) {
      const recentContext = await WhatsAppTrackingContext.findOne({
        customer_phone: fromPhone,
        expires_at: { $gt: new Date() },
      }).sort({ created_at: -1 }).lean();

      if (recentContext) {
        trackingContext = recentContext;
        vendor = await User.findById(recentContext.vendor_id)
          .select('_id name vendorProfile wallet_credits walletBalance')
          .lean();
      }
    }

    if (!vendor) {
      // Cannot attribute this message to any vendor, log and skip
      logger.warn(`[WhatsApp Meta] No vendor found for message from ${fromPhone} (phoneNumberId: ${metaPhoneNumberId})`, { service: 'whatsapp-meta' });
      return { skipped: true, reason: 'vendor_not_found', from: fromPhone };
    }

    const vendorId = vendor._id.toString();
    const listingId = trackingContext?.listing_id?.toString() || null;
    const reelId = trackingContext?.reel_id?.toString() || null;

    // Try to find existing customer user
    let customerId = trackingContext?.customer_id?.toString() || null;
    if (!customerId) {
      const customerUser = await User.findOne({
        $or: [
          { phone: fromPhone },
          { mobileNumber: fromPhone },
          { phone: fromPhone.replace(/^91/, '') },
          { mobileNumber: fromPhone.replace(/^91/, '') },
        ],
      }).select('_id').lean();
      customerId = customerUser?._id?.toString() || null;
    }

    // ── Step 4: Check for Existing Lead (increment message count) ──
    const existingLead = await WhatsAppLead.findOne({
      vendor_id: vendorId,
      customer_phone: fromPhone,
      listing_id: listingId || null,
      charge_window_expires_at: { $gt: new Date() },
    });

    // Save message (idempotent via unique provider_message_id)
    const savedMessage = await WhatsAppMessage.create({
      lead_id: existingLead?._id || null,
      vendor_id: vendorId,
      provider_message_id: providerMessageId,
      from_phone: fromPhone,
      to_phone: metaPhoneNumberId || null,
      direction: 'inbound',
      message_type: messageType,
      message_body: messageBody,
      timestamp,
      raw_payload: rawPayload,
    });

    if (existingLead) {
      // Update existing lead (within 24h window — no additional charge)
      existingLead.message_count += 1;
      existingLead.last_message_time = new Date();
      if (customerName && existingLead.customer_name === 'WhatsApp Buyer') {
        existingLead.customer_name = customerName;
      }
      await existingLead.save();

      // Update message with lead reference
      await WhatsAppMessage.updateOne({ _id: savedMessage._id }, { lead_id: existingLead._id });

      logger.info(`[WhatsApp Meta] Existing lead updated (no charge): ${existingLead._id}`, { service: 'whatsapp-meta' });
      return {
        success: true,
        lead_id: existingLead._id,
        status: existingLead.status,
        charged: false,
        reason: 'existing_lead_within_window',
        message_count: existingLead.message_count,
      };
    }

    // ── Step 5: Deduplication Check via ActionDedup (Section 7 & 8) ──
    // Use the existing action-charge service which handles dedup internally
    const deductionResult = await actionChargeService.deductAction({
      vendorId,
      customerId: customerId || `wa_${fromPhone}`, // Use phone as fallback customer ID
      targetId: listingId || `whatsapp_${fromPhone}`,
      actionType: 'whatsapp',
      metadata: {
        source: 'meta_webhook',
        provider_message_id: providerMessageId,
        customer_name: customerName,
        customer_phone: fromPhone,
        tracking_token: trackingContext?.context_token || null,
      },
    });

    // ── Step 6: Create WhatsAppLead Record ──
    const rates = await actionChargeService.getRates();
    const dedupWindowHours = rates.dedupWindowHours || 24;
    const chargeWindowExpiresAt = new Date(Date.now() + dedupWindowHours * 60 * 60 * 1000);

    let leadStatus;
    let amountCharged = 0;

    if (deductionResult.charged) {
      leadStatus = 'billed';
      amountCharged = deductionResult.deductedAmount || rates.whatsapp || 2.50;
    } else if (deductionResult.reason === 'duplicate_within_charge_window') {
      leadStatus = 'duplicate_window';
    } else if (deductionResult.reason === 'insufficient_vendor_credits') {
      leadStatus = 'unbilled_insufficient_balance';
    } else {
      leadStatus = 'pending';
    }

    const lead = await WhatsAppLead.create({
      vendor_id: vendorId,
      customer_id: customerId || null,
      customer_phone: fromPhone,
      customer_name: customerName,
      listing_id: listingId || null,
      reel_id: reelId || null,
      first_message_id: providerMessageId,
      first_message_time: timestamp,
      last_message_time: timestamp,
      charge_window_expires_at: chargeWindowExpiresAt,
      is_charged: deductionResult.charged || false,
      amount_charged: amountCharged,
      status: leadStatus,
      message_count: 1,
      tracking_context_token: trackingContext?.context_token || null,
      wallet_transaction_id: deductionResult.referenceId || null,
      metadata: {
        deduction_result: deductionResult,
        customer_name: customerName,
      },
    });

    // Update message with lead reference
    await WhatsAppMessage.updateOne({ _id: savedMessage._id }, { lead_id: lead._id });

    // ── Step 7: Real-time Notifications ──
    try {
      emitToUser(vendorId, 'whatsapp:new_lead', {
        lead_id: lead._id,
        customer_name: customerName,
        customer_phone: fromPhone,
        listing_id: listingId,
        status: leadStatus,
        charged: deductionResult.charged || false,
        amount: amountCharged,
        message_preview: messageBody.substring(0, 100),
      });
    } catch (e) {}

    // If insufficient balance, also emit wallet alert
    if (leadStatus === 'unbilled_insufficient_balance') {
      try {
        emitToUser(vendorId, 'wallet:low_balance_alert', {
          reason: 'whatsapp_lead_unbilled',
          required: rates.whatsapp || 2.50,
          available: deductionResult.available || 0,
          message: 'A WhatsApp lead was received but not billed due to low credit balance. Recharge to capture future leads.',
        });
      } catch (e) {}
    }

    logger.info(`[WhatsApp Meta] New lead created: ${lead._id} | Status: ${leadStatus} | Charged: ${amountCharged}`, { service: 'whatsapp-meta' });

    return {
      success: true,
      lead_id: lead._id,
      status: leadStatus,
      charged: deductionResult.charged || false,
      amount_charged: amountCharged,
      new_balance: deductionResult.newBalance,
      deduction_details: deductionResult,
    };
  }

  /**
   * Get vendor's WhatsApp leads (paginated, for CRM dashboard).
   */
  async getVendorLeads({ vendorId, page = 1, limit = 20, status }) {
    const query = { vendor_id: vendorId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      WhatsAppLead.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('listing_id', 'title images price')
        .lean(),
      WhatsAppLead.countDocuments(query),
    ]);

    // Compute summary stats
    const [stats] = await WhatsAppLead.aggregate([
      { $match: { vendor_id: new mongoose.Types.ObjectId(vendorId) } },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          billedLeads: { $sum: { $cond: [{ $eq: ['$status', 'billed'] }, 1, 0] } },
          unbilledLeads: { $sum: { $cond: [{ $eq: ['$status', 'unbilled_insufficient_balance'] }, 1, 0] } },
          duplicateLeads: { $sum: { $cond: [{ $eq: ['$status', 'duplicate_window'] }, 1, 0] } },
          totalCharged: { $sum: '$amount_charged' },
          totalMessages: { $sum: '$message_count' },
        },
      },
    ]);

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats || {
        totalLeads: 0,
        billedLeads: 0,
        unbilledLeads: 0,
        duplicateLeads: 0,
        totalCharged: 0,
        totalMessages: 0,
      },
    };
  }

  /**
   * Get vendor's WhatsApp connection status.
   */
  async getVendorWhatsAppStatus(vendorId) {
    const vendor = await User.findById(vendorId)
      .select('vendorProfile whatsapp_phone_number_id')
      .lean();

    if (!vendor) {
      return { connected: false, status: 'not_found' };
    }

    const waBiz = vendor.vendorProfile?.whatsapp_business || {};

    return {
      connected: waBiz.connection_status === 'connected',
      connection_status: waBiz.connection_status || 'not_connected',
      waba_id: waBiz.waba_id || null,
      phone_number_id: vendor.whatsapp_phone_number_id || waBiz.phone_number_id || null,
      messaging_tier: waBiz.messaging_tier || 'Tier 1 — 250 conversations/day',
      tier_last_upgraded_at: waBiz.tier_last_upgraded_at || null,
      whatsapp_number: vendor.vendorProfile?.whatsappNumber || vendor.vendorProfile?.whatsapp || null,
    };
  }

  /**
   * Handle Meta Embedded Signup callback from frontend.
   * Exchanges authorization code with Meta Graph API,
   * registers the phone number, subscribes webhook, and marks connection as connected or pending_verification.
   */
  async handleEmbeddedSignupCallback({ vendorId, code, wabaId, phoneNumberId }) {
    if (!vendorId) throw new Error('vendorId is required');

    let resolvedWabaId = wabaId;
    let resolvedPhoneNumberId = phoneNumberId;
    let connectionStatus = 'connected';

    const appId = config.metaWhatsApp?.appId || process.env.META_APP_ID;
    const appSecret = config.metaWhatsApp?.appSecret || process.env.META_APP_SECRET;

    // If Meta app credentials and code exist, exchange code for system token
    if (code && appId && appSecret) {
      try {
        const axios = require('axios');
        const tokenRes = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
          params: {
            client_id: appId,
            client_secret: appSecret,
            code,
          },
          timeout: 10000,
        });

        const userAccessToken = tokenRes.data?.access_token;
        if (userAccessToken && resolvedWabaId) {
          // Subscribe BizReels webhook to the vendor's WABA
          try {
            await axios.post(
              `https://graph.facebook.com/v20.0/${resolvedWabaId}/subscribed_apps`,
              {},
              { headers: { Authorization: `Bearer ${userAccessToken}` }, timeout: 10000 }
            );
            logger.info(`[WhatsApp Meta] Successfully subscribed WABA ${resolvedWabaId} to BizReels webhook`);
          } catch (subErr) {
            logger.warn(`[WhatsApp Meta] Webhook auto-subscription returned: ${subErr.message}`);
          }
        }
      } catch (tokenErr) {
        logger.warn(`[WhatsApp Meta] Code exchange failed: ${tokenErr.message}. Storing session IDs directly.`);
        connectionStatus = 'pending_verification';
      }
    }

    // Update vendor's WhatsApp connection details
    await this.updateVendorWhatsAppConnection({
      vendorId,
      wabaId: resolvedWabaId,
      phoneNumberId: resolvedPhoneNumberId,
      status: connectionStatus,
      messagingTier: 'Tier 1 — 250 conversations/day',
    });

    return {
      success: true,
      status: connectionStatus,
      waba_id: resolvedWabaId,
      phone_number_id: resolvedPhoneNumberId,
      message: connectionStatus === 'connected'
        ? 'WhatsApp Business connected successfully! You are now eligible to receive billable leads.'
        : 'WhatsApp Business signup submitted. Awaiting Meta verification.',
    };
  }

  /**
   * Update vendor WhatsApp Business connection details.
   * Called during onboarding or Meta Embedded Signup callback.
   */
  async updateVendorWhatsAppConnection({ vendorId, wabaId, phoneNumberId, status, messagingTier }) {
    const updateData = {};

    if (phoneNumberId) {
      updateData.whatsapp_phone_number_id = phoneNumberId;
    }

    const waBizUpdate = {};
    if (wabaId) waBizUpdate['vendorProfile.whatsapp_business.waba_id'] = wabaId;
    if (phoneNumberId) waBizUpdate['vendorProfile.whatsapp_business.phone_number_id'] = phoneNumberId;
    if (status) waBizUpdate['vendorProfile.whatsapp_business.connection_status'] = status;
    if (messagingTier) {
      waBizUpdate['vendorProfile.whatsapp_business.messaging_tier'] = messagingTier;
      waBizUpdate['vendorProfile.whatsapp_business.tier_last_upgraded_at'] = new Date();
    }

    await User.updateOne(
      { _id: vendorId },
      { $set: { ...updateData, ...waBizUpdate } }
    );

    logger.info(`[WhatsApp Meta] Vendor ${vendorId} connection updated: status=${status}`, { service: 'whatsapp-meta' });

    return { success: true, status: status || 'updated' };
  }

  /**
   * Simulate an inbound webhook message (for sandbox/development testing).
   * Generates a fake Meta-format webhook payload and processes it.
   */
  async simulateInbound({ vendorId, customerPhone, customerName, messageText, listingId }) {
    if (config.env === 'production' && config.metaWhatsApp?.webhookMode !== 'sandbox') {
      throw new Error('Simulation not allowed in production live mode');
    }

    const vendor = await User.findById(vendorId)
      .select('vendorProfile phone whatsapp_phone_number_id')
      .lean();

    if (!vendor) throw new Error('Vendor not found');

    const vendorPhoneNumberId = vendor.whatsapp_phone_number_id
      || vendor.vendorProfile?.whatsapp_business?.phone_number_id
      || `sim_${vendorId}`;

    const fakeMessageId = `wamid.sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const simulatedPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: vendor.vendorProfile?.whatsapp_business?.waba_id || `sim_waba_${vendorId}`,
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: vendor.vendorProfile?.whatsappNumber || vendor.phone || '919999999999',
              phone_number_id: vendorPhoneNumberId,
            },
            contacts: [{
              profile: { name: customerName || 'Test Buyer' },
              wa_id: customerPhone || '918888888888',
            }],
            messages: [{
              from: customerPhone || '918888888888',
              id: fakeMessageId,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              text: { body: messageText || 'Hello, I want to inquire about your listing. [Ref: BZR-TEST0001]' },
              type: 'text',
            }],
          },
        }],
      }],
    };

    return await this.handleInboundWebhook(simulatedPayload);
  }
}

module.exports = new WhatsAppMetaService();
