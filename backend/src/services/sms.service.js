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
    const provider = (config.sms.provider || 'mock').toLowerCase();

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
      if (config.env !== 'production') {
        logger.info(`[TWILIO FALLBACK OTP] 📲 Phone: ${targetMobile} | OTP: ${otp}`);
      }

      throw err;
    }
  }
}

module.exports = new SmsService();



