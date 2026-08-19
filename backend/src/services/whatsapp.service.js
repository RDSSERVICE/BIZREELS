const config = require('../config');
const logger = require('../utils/logger');
const { normalizeIndianPhone } = require('../utils/otp.utils');

class WhatsAppService {
  /**
   * Send OTP via Twilio WhatsApp API.
   * Supports Twilio Content API template (contentSid) or direct message text fallback.
   */
  async sendOtpWhatsApp(phone, otp) {
    const formattedPhone = normalizeIndianPhone(phone);
    const provider = (config.whatsapp?.provider || config.sms?.provider || 'mock').toLowerCase();

    if (provider === 'twilio') {
      return this._sendViaTwilioWhatsApp(formattedPhone, otp);
    }

    // Default mock / dev mode logger
    logger.info(`[WHATSAPP MOCK OTP] 💬 WhatsApp To: whatsapp:${formattedPhone} | OTP Code: ${otp}`, { service: 'whatsapp' });
    return { success: true, provider: 'mock', phone: formattedPhone, otp };
  }

  /**
   * Send Transactional / Alert WhatsApp message via Twilio
   */
  async sendTransactionalWhatsApp(phone, message) {
    const formattedPhone = normalizeIndianPhone(phone);
    const provider = (config.whatsapp?.provider || config.sms?.provider || 'mock').toLowerCase();

    if (provider !== 'twilio') {
      logger.info(`[WHATSAPP MOCK TXN] 💬 WhatsApp To: whatsapp:${formattedPhone} | Message: ${message}`, { service: 'whatsapp' });
      return { success: true, provider: 'mock' };
    }

    const { accountSid, authToken, from } = config.whatsapp?.twilio || {};
    const effectiveAccountSid = accountSid || config.sms?.twilio?.accountSid;
    const effectiveAuthToken = authToken || config.sms?.twilio?.authToken;

    if (!effectiveAccountSid || !effectiveAuthToken || !from) {
      logger.warn(`[TWILIO WHATSAPP CONFIG REQUIRED] Missing credentials or TWILIO_WHATSAPP_FROM for message to whatsapp:${formattedPhone}`);
      return { success: true, provider: 'mock_fallback' };
    }

    try {
      const twilio = require('twilio');
      const twilioClient = twilio(effectiveAccountSid, effectiveAuthToken);
      const fromNumber = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
      const toNumber = formattedPhone.startsWith('whatsapp:') ? formattedPhone : `whatsapp:${formattedPhone}`;

      const res = await twilioClient.messages.create({
        from: fromNumber,
        to: toNumber,
        body: message,
      });

      return { success: true, provider: 'twilio', sid: res.sid, status: res.status };
    } catch (err) {
      logger.error('Twilio transactional WhatsApp error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Internal dispatcher for Twilio WhatsApp OTP
   */
  async _sendViaTwilioWhatsApp(phone, otp) {
    const { accountSid, authToken, from, contentSid } = config.whatsapp?.twilio || {};
    const effectiveAccountSid = accountSid || config.sms?.twilio?.accountSid;
    const effectiveAuthToken = authToken || config.sms?.twilio?.authToken;

    if (!effectiveAccountSid || !effectiveAuthToken || !from) {
      logger.warn(`[TWILIO WHATSAPP CONFIG REQUIRED] ⚠️ Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM in backend/.env to deliver live WhatsApp OTP. 💬 Mock OTP for ${phone}: ${otp}`);
      return { success: true, provider: 'mock_fallback', phone, otp };
    }

    const fromNumber = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
    const targetWhatsApp = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;

    try {
      let twilioClient;
      try {
        const twilio = require('twilio');
        twilioClient = twilio(effectiveAccountSid, effectiveAuthToken);
      } catch (loadErr) {
        logger.error('Twilio SDK initialization error for WhatsApp:', loadErr.message);
        throw loadErr;
      }

      const payload = {
        from: fromNumber,
        to: targetWhatsApp,
      };

      // If a pre-approved Twilio WhatsApp Content Template is configured, use Content API
      if (contentSid) {
        payload.contentSid = contentSid;
        payload.contentVariables = JSON.stringify({
          '1': String(otp),
        });
      } else {
        // Direct template text
        payload.body = `Your BizReels verification code is ${otp}. This OTP is valid for 10 minutes. Do not share it with anyone.`;
      }

      logger.info(`[TWILIO WHATSAPP DISPATCH] Sending WhatsApp OTP to ${targetWhatsApp}...`, {
        service: 'whatsapp',
        hasContentSid: Boolean(contentSid),
      });

      const message = await twilioClient.messages.create(payload);

      logger.info(`[TWILIO WHATSAPP SUCCESS] Delivered message SID ${message.sid} to ${targetWhatsApp}`, {
        service: 'whatsapp',
        status: message.status,
        sid: message.sid,
      });

      return {
        success: true,
        provider: 'twilio',
        sid: message.sid,
        status: message.status,
      };
    } catch (err) {
      logger.error('Twilio WhatsApp delivery failure:', {
        service: 'whatsapp',
        error: err.message,
        code: err.code,
        moreInfo: err.moreInfo,
      });

      if (config.env !== 'production') {
        logger.info(`[TWILIO WHATSAPP FALLBACK OTP] 💬 Phone: ${targetWhatsApp} | OTP: ${otp}`);
      }

      throw err;
    }
  }
}

module.exports = new WhatsAppService();
