const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

const isDevMode = () => config.msg91DevMode || !config.msg91AuthKey;

const sendOtpSms = async (phone, otp) => {
  if (isDevMode()) {
    logger.info(`[MSG91 DEV MODE] OTP for ${phone}: ${otp}`);
    return;
  }

  if (!config.msg91AuthKey || !config.msg91TemplateId) {
    throw new Error('MSG91 not configured');
  }

  try {
    await axios.post('https://control.msg91.com/api/v5/otp', null, {
      params: {
        template_id: config.msg91TemplateId,
        mobile: `91${phone}`,
        authkey: config.msg91AuthKey,
        otp,
      },
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    logger.error('MSG91 API error:', err.response?.data || err.message);
    throw err;
  }
};

const sendTransactionalSms = async (phone, message) => {
  if (isDevMode()) {
    logger.info(`[SMS DEV] Send SMS to ${phone}: ${message}`);
    return;
  }
  logger.info(`[MSG91] Send SMS to ${phone}: ${message}`);
  // In a real MSG91 setup, you'd use their flow or template API for transactional texts
};

module.exports = { isDevMode, sendOtpSms, sendTransactionalSms };
