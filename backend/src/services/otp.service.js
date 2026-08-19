const config = require('../config');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const redisOtpService = require('./redis-otp.service');
const smsService = require('./sms.service');
const whatsappService = require('./whatsapp.service');
const emailService = require('./email.service');
const { generateOtp, normalizeIndianPhone } = require('../utils/otp.utils');

const VALID_CHANNELS = ['sms', 'whatsapp'];
const VALID_PURPOSES = [
  'login',
  'register',
  'phone_verification',
  'verify-phone',
  'password_reset',
  'forgot-password',
  'change_phone',
  'sensitive_action',
];

class OtpService {
  /**
   * Send OTP via specified channel (SMS or WhatsApp) for a specific purpose.
   */
  async sendOtp({ phone, channel = 'sms', purpose = 'login' }) {
    const cleanChannel = (channel || 'sms').toLowerCase();
    if (!VALID_CHANNELS.includes(cleanChannel)) {
      throw ApiError.badRequest(`Unsupported OTP delivery channel "${channel}". Supported channels: sms, whatsapp.`);
    }

    const normalizedPurpose = (purpose || 'login').toLowerCase();
    const formattedPhone = normalizeIndianPhone(phone);

    // 1. Check 60s cooldown
    await redisOtpService.checkCooldown(formattedPhone, normalizedPurpose);

    // 2. Invalidate any existing OTP for this phone + purpose
    await redisOtpService.deleteOtp(formattedPhone, normalizedPurpose).catch(() => {});

    // 3. Cryptographically generate 6-digit numeric OTP
    const otp = generateOtp();

    // 4. Save hashed OTP to Redis with 10-minute TTL
    await redisOtpService.saveOtp(formattedPhone, otp, cleanChannel, normalizedPurpose);

    // 5. Enforce 60-second resend cooldown
    await redisOtpService.setCooldown(formattedPhone, normalizedPurpose, config.otp.cooldownSeconds || 60);

    // 6. Dispatch through the chosen provider
    let dispatchResult;
    try {
      if (cleanChannel === 'sms') {
        dispatchResult = await smsService.sendOtpSms(formattedPhone, otp);
      } else if (cleanChannel === 'whatsapp') {
        dispatchResult = await whatsappService.sendOtpWhatsApp(formattedPhone, otp);
      }
    } catch (deliveryError) {
      logger.error(`Failed to deliver OTP via ${cleanChannel} to ${formattedPhone}: ${deliveryError.message}`, {
        service: 'otp',
        channel: cleanChannel,
        error: deliveryError.message,
      });

      // Clear the OTP key so user is not stuck on a failed dispatch
      await redisOtpService.deleteOtp(formattedPhone, normalizedPurpose).catch(() => {});

      throw ApiError.internal(`Failed to send verification code via ${cleanChannel.toUpperCase()}. Please try again or use another channel.`);
    }

    const response = {
      success: true,
      message: `Verification code sent to ${formattedPhone} via ${cleanChannel.toUpperCase()}.`,
      channel: cleanChannel,
      purpose: normalizedPurpose,
      phone: formattedPhone,
      expiresInMinutes: config.otp.expiryMinutes || 10,
      cooldownSeconds: config.otp.cooldownSeconds || 60,
    };

    // Include OTP in dev/mock environment for ease of testing
    const isMock = config.env === 'development' ||
      (cleanChannel === 'sms' && (config.sms?.provider || 'mock') === 'mock') ||
      (cleanChannel === 'whatsapp' && (config.whatsapp?.provider || 'mock') === 'mock');

    if (isMock) {
      response.otp = otp;
    }

    if (dispatchResult?.sid) {
      response.messageSid = dispatchResult.sid;
    }

    return response;
  }

  /**
   * Resend OTP with cooldown enforcement
   */
  async resendOtp({ phone, channel = 'sms', purpose = 'login' }) {
    return this.sendOtp({ phone, channel, purpose });
  }

  /**
   * Verify candidate OTP against stored hash
   */
  async verifyOtp({ phone, otp, channel = null, purpose = 'login' }) {
    if (!otp) {
      throw ApiError.badRequest('OTP code is required.');
    }

    const formattedPhone = normalizeIndianPhone(phone);
    const normalizedPurpose = (purpose || 'login').toLowerCase();
    const cleanChannel = channel ? channel.toLowerCase() : null;

    const verification = await redisOtpService.verifyOtp(
      formattedPhone,
      otp,
      cleanChannel,
      normalizedPurpose
    );

    return {
      success: true,
      phone: formattedPhone,
      channel: verification.channel,
      purpose: verification.purpose,
      verifiedAt: verification.verifiedAt,
    };
  }
}

module.exports = new OtpService();
