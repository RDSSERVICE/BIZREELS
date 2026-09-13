const mongoose = require('mongoose');
const CallRecord = require('../models/CallRecord');
const { Wallet } = require('../models/Phase4');
const User = require('../models/User');
const actionChargeService = require('./action-charge.service');
const { emitToUser } = require('../sockets');
const logger = require('../utils/logger');
const axios = require('axios');

class CallService {
  /**
   * Check if a vendor has sufficient credits to receive customer calls (≥ 2.50 Credits)
   */
  async checkCallAvailability(vendorId) {
    if (!vendorId) return { available: false, reason: 'invalid_vendor' };
    const vId = vendorId.toString();

    const rates = await actionChargeService.getRates();
    const callCost = rates.callConnected || 2.50;

    const wallet = await Wallet.findOne({ user_id: vId });
    const credits = wallet?.credits || 0;

    if (!wallet || wallet.is_frozen || credits < callCost) {
      return {
        available: false,
        fallbackToWhatsApp: true,
        reason: 'INSUFFICIENT_VENDOR_BALANCE',
        requiredCredits: callCost,
        availableCredits: credits,
        message: 'Vendor is currently unavailable for direct phone calls. Please connect via WhatsApp or Chat.',
      };
    }

    return {
      available: true,
      requiredCredits: callCost,
      availableCredits: credits,
    };
  }

  /**
   * Initiate customer-to-vendor voice call via Exotel
   */
  async initiateCall({ customerId, vendorId, listingId = null }) {
    const cId = customerId.toString();
    const vId = vendorId.toString();

    // 1. Availability check
    const availability = await this.checkCallAvailability(vId);
    if (!availability.available) {
      return {
        success: false,
        ...availability,
      };
    }

    // 2. Fetch phone numbers
    const [customer, vendor] = await Promise.all([
      User.findById(cId).lean(),
      User.findById(vId).lean(),
    ]);

    if (!vendor) {
      return { success: false, reason: 'vendor_not_found', message: 'Vendor account not found' };
    }

    const customerPhone = customer?.phone || customer?.mobile || customer?.vendorProfile?.mobileNumber || '+919876543210';
    const vendorPhone =
      vendor?.vendorProfile?.mobileNumber ||
      vendor?.phone ||
      vendor?.vendorProfile?.phone ||
      '+919876543210';

    // 3. Create Call Record in database
    const callRecord = await CallRecord.create({
      vendor_id: vId,
      customer_id: cId,
      listing_id: listingId ? new mongoose.Types.ObjectId(listingId) : null,
      customer_phone: customerPhone,
      vendor_phone: vendorPhone,
      status: 'initiated',
      is_charged: false,
      credits_deducted: 0,
      start_time: new Date(),
    });

    // 4. Exotel API Integration
    const exotelSid = process.env.EXOTEL_SID;
    const exotelApiKey = process.env.EXOTEL_API_KEY;
    const exotelApiToken = process.env.EXOTEL_API_TOKEN;
    const exotelPhone = process.env.EXOTEL_PHONE;

    let exotelCallSid = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (exotelSid && exotelApiKey && exotelApiToken && exotelPhone) {
      try {
        const callbackUrl = `${process.env.APP_URL || 'http://localhost:5000'}/api/v1/webhooks/exotel/call`;
        const exotelUrl = `https://api.exotel.com/v1/Accounts/${exotelSid}/Calls/connect.json`;

        const authHeader = 'Basic ' + Buffer.from(`${exotelApiKey}:${exotelApiToken}`).toString('base64');
        const res = await axios.post(
          exotelUrl,
          new URLSearchParams({
            From: customerPhone,
            To: vendorPhone,
            CallerId: exotelPhone,
            StatusCallback: callbackUrl,
            'StatusCallbackEvents[0]': 'terminal',
          }),
          {
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 10000,
          }
        );

        if (res.data?.Call?.Sid) {
          exotelCallSid = res.data.Call.Sid;
        }
      } catch (err) {
        logger.error('Exotel API call connection error:', err.message);
      }
    } else {
      logger.info(`[Exotel Sandbox] Call initiated between ${customerPhone} and ${vendorPhone} (SID: ${exotelCallSid})`);
    }

    callRecord.exotel_call_sid = exotelCallSid;
    await callRecord.save();

    // 5. Notify vendor of incoming lead
    try {
      emitToUser(vId, 'vendor:incoming_call', {
        callId: callRecord._id,
        customerName: customer?.name || 'Customer',
        listingId,
      });
    } catch (e) {}

    return {
      success: true,
      callId: callRecord._id,
      exotelCallSid,
      status: 'initiated',
      directPhone: vendorPhone,
      message: 'Call initiated successfully.',
    };
  }

  /**
   * Handle Exotel Webhook Callback (Deducts 2.50 Credits ONLY if successfully connected)
   */
  async handleExotelWebhook(payload) {
    const callSid = payload.CallSid || payload.call_sid || payload.Sid;
    const statusRaw = (payload.Status || payload.status || payload.CallStatus || '').toLowerCase();
    const duration = parseInt(payload.Duration || payload.Legs?.[0]?.Duration || 0, 10);
    const recordingUrl = payload.RecordingUrl || payload.recording_url || null;

    if (!callSid) {
      return { success: false, reason: 'missing_call_sid' };
    }

    const callRecord = await CallRecord.findOne({ exotel_call_sid: callSid });
    if (!callRecord) {
      logger.warn(`CallRecord not found for Exotel SID: ${callSid}`);
      return { success: false, reason: 'call_record_not_found' };
    }

    // ── Idempotency Check: Prevent duplicate webhook charges ──
    if (callRecord.is_charged) {
      logger.info(`Call ${callSid} already charged. Skipping duplicate deduction.`);
      return { success: true, alreadyCharged: true };
    }

    // Determine normalized status
    let normalizedStatus = 'failed';
    if (statusRaw === 'completed' || statusRaw === 'connected') {
      normalizedStatus = 'completed';
    } else if (statusRaw.includes('busy')) {
      normalizedStatus = 'busy';
    } else if (statusRaw.includes('no-answer') || statusRaw.includes('noanswer')) {
      normalizedStatus = 'no-answer';
    } else if (statusRaw.includes('cancel')) {
      normalizedStatus = 'canceled';
    }

    callRecord.status = normalizedStatus;
    callRecord.duration = duration;
    callRecord.end_time = new Date();
    if (recordingUrl) callRecord.recording_url = recordingUrl;

    // ── ONLY successfully connected calls consume wallet credits (2.50 Credits) ──
    if (normalizedStatus === 'completed') {
      const chargeResult = await actionChargeService.deductAction({
        vendorId: callRecord.vendor_id,
        customerId: callRecord.customer_id,
        targetId: callRecord.listing_id || 'general',
        actionType: 'call',
        metadata: {
          callSid,
          duration,
        },
      });

      if (chargeResult.charged) {
        callRecord.is_charged = true;
        callRecord.credits_deducted = chargeResult.creditsDeducted;
        callRecord.charged_at = new Date();
        callRecord.wallet_transaction_id = chargeResult.referenceId;
      }
    } else {
      // Unconnected, busy, failed -> 0 credits deducted
      callRecord.is_charged = false;
      callRecord.credits_deducted = 0;
    }

    await callRecord.save();

    // Real-time update to vendor
    try {
      emitToUser(callRecord.vendor_id.toString(), 'call:status_update', {
        callId: callRecord._id,
        status: normalizedStatus,
        duration,
        creditsDeducted: callRecord.credits_deducted,
      });
    } catch (e) {}

    return {
      success: true,
      callId: callRecord._id,
      status: normalizedStatus,
      isCharged: callRecord.is_charged,
      charged: callRecord.is_charged,
      creditsDeducted: callRecord.credits_deducted,
    };
  }

  /**
   * Get paginated call history for a vendor
   */
  async getVendorCallHistory({ vendorId, page = 1, limit = 20 }) {
    const vId = vendorId.toString();
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const [items, total] = await Promise.all([
      CallRecord.find({ vendor_id: vId })
        .populate('customer_id', 'name phone avatar')
        .populate('listing_id', 'title price images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      CallRecord.countDocuments({ vendor_id: vId }),
    ]);

    const formatted = items.map((r) => {
      const customer = r.customer_id || {};
      const listing = r.listing_id || {};
      const rawPhone = customer.phone || r.customer_phone || '';
      // Number masking (e.g. +91 98765 ***10)
      const maskedPhone = rawPhone.length >= 8
        ? `${rawPhone.slice(0, 5)} **** ${rawPhone.slice(-2)}`
        : rawPhone;

      return {
        id: r._id.toString(),
        customerName: customer.name || 'Customer',
        customerPhone: maskedPhone,
        customerAvatar: customer.avatar || null,
        productTitle: listing.title || 'Direct Vendor Line',
        productPrice: listing.price || 0,
        status: r.status,
        durationSeconds: r.duration || 0,
        isCharged: r.is_charged,
        creditsDeducted: r.credits_deducted || 0,
        createdAt: r.createdAt || r.start_time,
      };
    });

    return {
      items: formatted,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit) || 1,
      },
    };
  }
}

module.exports = new CallService();
