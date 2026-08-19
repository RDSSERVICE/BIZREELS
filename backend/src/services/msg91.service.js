const smsService = require('./sms.service');
const config = require('../config');

const isDevMode = () => (config.sms.provider || 'mock').toLowerCase() === 'mock';

const sendOtpSms = async (phone, otp) => {
  return smsService.sendOtpSms(phone, otp);
};

const sendTransactionalSms = async (phone, message) => {
  return smsService.sendTransactionalSms(phone, message);
};

module.exports = { isDevMode, sendOtpSms, sendTransactionalSms };

