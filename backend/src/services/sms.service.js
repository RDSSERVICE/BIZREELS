const config = require('../config');
const logger = require('../utils/logger');
const { normalizeIndianPhone } = require('../utils/otp.utils');

class SmsService {
  /**
   * Send OTP SMS via Twilio Messaging Service or Mock logger.
   * DLT Template ID: 1277178706040137501
   * DLT Header: BZREEL
   */
  async sendOtpSms(phone, otp) {
    const formattedPhone = normalizeIndianPhone(phone);
    const provider = (config.sms?.provider || process.env.SMS_PROVIDER || 'mock').toLowerCase();

    if (provider === 'fast2sms') {
      return this._sendViaFast2SMS(formattedPhone, otp);
    }
    if (provider === 'twilio') {
      return this._sendViaTwilio(formattedPhone, otp);
    }

    // Default mock / dev mode logger
    logger.info(`[SMS MOCK OTP] 📲 Phone: ${formattedPhone} | OTP Code: ${otp}`, { service: 'sms' });
    return { success: true, provider: 'mock', phone: formattedPhone, otp };
  }

  /**
   * Send Transactional / Alert SMS via Twilio Messaging Service
   */
  async sendTransactionalSms(phone, message) {
    const formattedPhone = normalizeIndianPhone(phone);
    const provider = (config.sms.provider || 'mock').toLowerCase();

    if (provider !== 'twilio') {
      logger.info(`[SMS MOCK TXN] 📲 Phone: ${formattedPhone} | Message: ${message}`, { service: 'sms' });
      return { success: true, provider: 'mock' };
    }

    const { accountSid, authToken, messagingServiceSid, senderId } = config.sms.twilio || {};
    if (!accountSid || !authToken) {
      logger.warn(`[TWILIO CONFIG REQUIRED] Missing credentials for transactional SMS to ${formattedPhone}`);
      return { success: true, provider: 'mock_fallback' };
    }

    try {
      const twilio = require('twilio');
      const twilioClient = twilio(accountSid, authToken);
      const payload = {
        to: formattedPhone,
        body: message,
      };

      if (messagingServiceSid) {
        payload.messagingServiceSid = messagingServiceSid;
      } else {
        payload.from = senderId || 'BZREEL';
      }

      const res = await twilioClient.messages.create(payload);
      return { success: true, provider: 'twilio', sid: res.sid, status: res.status };
    } catch (err) {
      logger.error('Twilio transactional SMS error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send SMS via Twilio Messaging Service / Programmable Messaging
   * Using Sender ID: "BZREEL" & DLT Template ID: 1277178706040137501
   *
   * DLT Approved Template:
   * "Your BizReels verification code is {#number#}. This OTP is valid for 10 minutes. Do not share it with anyone."
   */
  async _sendViaTwilio(phone, otp) {
    const { accountSid, authToken, messagingServiceSid, senderId, dltTemplateId } = config.sms.twilio || {};

    if (!accountSid || !authToken) {
      logger.warn(`[TWILIO CONFIG REQUIRED] ⚠️ Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in backend/.env to deliver live SMS. 📲 Mock OTP for ${phone}: ${otp}`);
      return { success: true, provider: 'mock_fallback', phone, otp };
    }

    const messageBody = `Your BizReels verification code is ${otp}. This OTP is valid for 10 minutes. Do not share it with anyone.`;
    const targetMobile = phone.startsWith('+') ? phone : `+91${phone}`;

    try {
      let twilioClient;
      try {
        const twilio = require('twilio');
        twilioClient = twilio(accountSid, authToken);
      } catch (loadErr) {
        logger.error('Twilio SDK initialization error:', loadErr.message);
        throw loadErr;
      }

      const payload = {
        to: targetMobile,
        body: messageBody,
      };

      if (messagingServiceSid) {
        payload.messagingServiceSid = messagingServiceSid;
      } else {
        payload.from = senderId || 'BZREEL';
      }

      logger.info(`[TWILIO DISPATCH] Sending SMS to ${targetMobile} via Messaging Service...`, {
        service: 'sms',
        dltTemplateId: dltTemplateId || '1277178706040137501',
        messagingServiceSid: messagingServiceSid || 'direct_sender',
      });

      const message = await twilioClient.messages.create(payload);

      logger.info(`[TWILIO SMS SUCCESS] Delivered message SID ${message.sid} to ${targetMobile}`, {
        service: 'sms',
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
      logger.error('Twilio SMS delivery failure:', {
        service: 'sms',
        error: err.message,
        code: err.code,
        moreInfo: err.moreInfo,
      });

      // In non-production or on carrier error, log fallback OTP to prevent developer lockout
      if (config.env !== 'production' || process.env.OTP_DEV_MODE === 'true' || config.otpDevMode) {
        logger.info(`[TWILIO FALLBACK MOCK OTP] 📲 Phone: ${targetMobile} | OTP: ${otp}`);
        return { success: true, provider: 'mock_fallback', phone: targetMobile, otp };
      }

      throw err;
    }
  }

  /**
   * Send OTP via Fast2SMS (Indian SMS Gateway)
   */
  async _sendViaFast2SMS(phone, otp) {
    const apiKey = process.env.FAST2SMS_API_KEY || config.sms?.fast2smsApiKey;
    const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');

    if (!apiKey) {
      logger.warn(`[FAST2SMS CONFIG REQUIRED] FAST2SMS_API_KEY missing in backend/.env. Mocking OTP for ${cleanPhone}: ${otp}`);
      return { success: true, provider: 'mock_fallback', phone: cleanPhone, otp };
    }

    try {
      const axios = require('axios');
      const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
        params: {
          authorization: apiKey,
          variables_values: otp,
          route: 'otp',
          numbers: cleanPhone,
        },
        headers: {
          'cache-control': 'no-cache',
        },
      });

      logger.info(`[FAST2SMS DISPATCH] Sent OTP to ${cleanPhone}:`, response.data);
      return { success: true, provider: 'fast2sms', data: response.data };
    } catch (err) {
      logger.error('Fast2SMS delivery error:', err.message);
      if (config.env !== 'production' || process.env.OTP_DEV_MODE === 'true') {
        return { success: true, provider: 'mock_fallback', phone: cleanPhone, otp };
      }
      throw err;
    }
  }
}

module.exports = new SmsService();



