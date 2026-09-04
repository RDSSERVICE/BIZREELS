const config = require('../config');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const redisOtpService = require('./redis-otp.service');
const smsService = require('./sms.service');
const whatsappService = require('./whatsapp.service');
const emailService = require('./email.service');
const { generateOtp, normalizeIndianPhone } = require('../utils/otp.utils');

const VALID_CHANNELS = ['sms', 'whatsapp', 'email'];
const VALID_PURPOSES = [
  'login',
  'register',
  'signup',
  'phone_verification',
  'verify-phone',
  'password_reset',
  'forgot-password',
  'change_phone',
  'sensitive_action',
  'auth',
];

class OtpService {
  /**
   * Send OTP via specified channel (SMS, WhatsApp, or Email) for a specific purpose.
   */
  async sendOtp({ phone, email, identifier, channel = 'sms', purpose = 'login' }) {
    const rawTarget = phone || email || identifier;
    if (!rawTarget) {
      throw ApiError.badRequest('Phone number or email is required.');
    }

    const isEmail = String(rawTarget).includes('@');
    const cleanChannel = isEmail ? 'email' : (channel || 'sms').toLowerCase();

    if (!VALID_CHANNELS.includes(cleanChannel)) {
      throw ApiError.badRequest(`Unsupported OTP delivery channel "${channel}". Supported channels: sms, whatsapp, email.`);
    }

    const normalizedPurpose = (purpose || 'login').toLowerCase();
    const formattedIdentifier = isEmail
      ? String(rawTarget).trim().toLowerCase()
      : normalizeIndianPhone(rawTarget);

    // 1. Check 60s cooldown
    await redisOtpService.checkCooldown(formattedIdentifier, normalizedPurpose);

    // 2. Invalidate any existing OTP for this identifier + purpose
    await redisOtpService.deleteOtp(formattedIdentifier, normalizedPurpose).catch(() => {});

    // 3. Cryptographically generate 6-digit numeric OTP
    const otp = generateOtp();

    // 4. Save hashed OTP to Redis with 10-minute TTL
    await redisOtpService.saveOtp(formattedIdentifier, otp, cleanChannel, normalizedPurpose);

    // 5. Enforce 60-second resend cooldown
    await redisOtpService.setCooldown(formattedIdentifier, normalizedPurpose, config.otp.cooldownSeconds || 60);

    // 6. Dispatch through the chosen provider
    let dispatchResult;
    try {
      if (cleanChannel === 'sms') {
        dispatchResult = await smsService.sendOtpSms(formattedIdentifier, otp);
      } else if (cleanChannel === 'whatsapp') {
        dispatchResult = await whatsappService.sendOtpWhatsApp(formattedIdentifier, otp);
      } else if (cleanChannel === 'email') {
        dispatchResult = await emailService.sendOtpEmail({ to: formattedIdentifier, otp, purpose: normalizedPurpose });
      }
    } catch (deliveryError) {
      logger.error(`Failed to deliver OTP via ${cleanChannel} to ${formattedIdentifier}: ${deliveryError.message}`, {
        service: 'otp',
        channel: cleanChannel,
        error: deliveryError.message,
      });

      // Clear the OTP key so user is not stuck on a failed dispatch
      await redisOtpService.deleteOtp(formattedIdentifier, normalizedPurpose).catch(() => {});

      throw ApiError.internal(`Failed to send verification code via ${cleanChannel.toUpperCase()}. Please try again or use another channel.`);
    }

    const response = {
      success: true,
      message: `Verification code sent to ${formattedIdentifier} via ${cleanChannel.toUpperCase()}.`,
      channel: cleanChannel,
      purpose: normalizedPurpose,
      target: formattedIdentifier,
      phone: isEmail ? undefined : formattedIdentifier,
      email: isEmail ? formattedIdentifier : undefined,
      expiresInMinutes: config.otp.expiryMinutes || 10,
      cooldownSeconds: config.otp.cooldownSeconds || 60,
    };

    // Include OTP only when delivery provider is explicitly mock
    const isMock = (cleanChannel === 'sms' && (config.sms?.provider || 'mock') === 'mock') ||
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
  async resendOtp(params) {
    return this.sendOtp(params);
  }

  /**
   * Verify candidate OTP against stored hash
   */
  async verifyOtp({ phone, email, identifier, otp, channel = null, purpose = 'login' }) {
    if (!otp) {
      throw ApiError.badRequest('OTP code is required.');
    }

    const rawTarget = phone || email || identifier;
    if (!rawTarget) {
      throw ApiError.badRequest('Phone number or email is required to verify OTP.');
    }

    const isEmail = String(rawTarget).includes('@');
    const formattedIdentifier = isEmail
      ? String(rawTarget).trim().toLowerCase()
      : normalizeIndianPhone(rawTarget);
    const normalizedPurpose = (purpose || 'login').toLowerCase();
    const cleanChannel = channel ? channel.toLowerCase() : null;

    const verification = await redisOtpService.verifyOtp(
      formattedIdentifier,
      otp,
      cleanChannel,
      normalizedPurpose
    );

    return {
      success: true,
      target: formattedIdentifier,
      phone: isEmail ? undefined : formattedIdentifier,
      email: isEmail ? formattedIdentifier : undefined,
      channel: verification.channel,
      purpose: verification.purpose,
      verifiedAt: verification.verifiedAt,
    };
  }
}

module.exports = new OtpService();
