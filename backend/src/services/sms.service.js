const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class SmsService {
  /**
   * Send OTP SMS via MSG91, Exotel, or Mock logger
   */
  async sendOtpSms(phone, otp) {
    const formattedPhone = String(phone).replace(/\D/g, '');
    const provider = (config.sms.provider || 'mock').toLowerCase();

    if (provider === 'msg91') {
      return this._sendViaMsg91(formattedPhone, otp);
    }

    if (provider === 'exotel') {
      return this._sendViaExotel(formattedPhone, otp);
    }

    // Default mock / dev mode logger
    logger.info(`[SMS MOCK OTP] 📲 Phone: +91${formattedPhone} | OTP Code: ${otp}`, { service: 'sms' });
    return { success: true, provider: 'mock' };
  }

  async _sendViaMsg91(phone, otp) {
    if (!config.sms.msg91AuthKey || !config.sms.msg91TemplateId) {
      logger.warn(`[MSG91 CONFIG REQUIRED] ⚠️ Please set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID in backend/.env to deliver live SMS. 📲 Mock OTP for +91${phone}: ${otp}`);
      return { success: true, provider: 'mock_fallback', otp };
    }

    try {
      const response = await axios.post(
        'https://control.msg91.com/api/v5/otp',
        null,
        {
          params: {
            template_id: config.sms.msg91TemplateId,
            mobile: `91${phone}`,
            authkey: config.sms.msg91AuthKey,
            otp,
          },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      logger.info(`[MSG91 SMS SUCCESS] Delivered to +91${phone}`, { response: response.data });
      return { success: true, provider: 'msg91', data: response.data };
    } catch (err) {
      logger.error('MSG91 API failure:', err.response?.data || err.message);
      logger.info(`[MSG91 FALLBACK OTP] 📲 Phone: +91${phone} | OTP: ${otp}`);
      return { success: true, provider: 'mock_fallback', otp };
    }
  }

  async _sendViaExotel(phone, otp) {
    const { exotelAccountSid, exotelApiKey, exotelApiToken, exotelSubdomain } = config.sms;
    if (!exotelAccountSid || !exotelApiKey || !exotelApiToken) {
      throw new Error('Exotel is missing EXOTEL_ACCOUNT_SID, EXOTEL_API_KEY, or EXOTEL_API_TOKEN configuration.');
    }

    try {
      const authHeader = Buffer.from(`${exotelApiKey}:${exotelApiToken}`).toString('base64');
      const url = `https://${exotelSubdomain}/v1/Accounts/${exotelAccountSid}/Sms/send.json`;

      const params = new URLSearchParams();
      params.append('From', 'BIZREL');
      params.append('To', phone);
      params.append('Body', `Your BizReels verification OTP is ${otp}. Valid for 5 minutes.`);

      const response = await axios.post(url, params, {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      logger.info(`[EXOTEL SMS SUCCESS] Delivered to +91${phone}`, { response: response.data });
      return { success: true, provider: 'exotel', data: response.data };
    } catch (err) {
      logger.error('Exotel API failure:', err.response?.data || err.message);
      throw err;
    }
  }
}

module.exports = new SmsService();
