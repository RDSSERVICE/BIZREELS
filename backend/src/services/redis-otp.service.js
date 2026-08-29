const { getStore } = require('../config/redis');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { normalizeIndianPhone, hashOtp, secureCompareOtp } = require('../utils/otp.utils');

const formatIdentifierKey = (rawIdentifier) => {
  if (!rawIdentifier) throw ApiError.badRequest('Phone number or email is required.');
  const str = String(rawIdentifier).trim();
  if (str.includes('@')) {
    return `email:${str.toLowerCase()}`;
  }
  const clean = normalizeIndianPhone(str);
  return `phone:${clean}`;
};

const getOtpKey = (identifier, purpose = 'login') => {
  const formatted = formatIdentifierKey(identifier);
  return `otp:${formatted}:${purpose}`;
};

const getCooldownKey = (identifier, purpose = 'login') => {
  const formatted = formatIdentifierKey(identifier);
  return `otp:cooldown:${formatted}:${purpose}`;
};

class RedisOtpService {
  /**
   * Check if a phone number is currently in the 60s cooldown window.
   * Throws ApiError (429) if cooldown is active.
   */
  async checkCooldown(phone, purpose = 'login') {
    const store = getStore();
    const cooldownKey = getCooldownKey(phone, purpose);
    const inCooldown = await store.get(cooldownKey);

    if (inCooldown) {
      const ttl = await store.ttl(cooldownKey);
      const remainingSeconds = ttl > 0 ? ttl : (config.otp.cooldownSeconds || 60);
      throw ApiError.tooMany(`Please wait ${remainingSeconds} seconds before requesting a new OTP.`);
    }
  }

  /**
   * Set cooldown timer in Redis (default: 60s).
   */
  async setCooldown(phone, purpose = 'login', seconds = (config.otp.cooldownSeconds || 60)) {
    const store = getStore();
    const cooldownKey = getCooldownKey(phone, purpose);
    await store.set(cooldownKey, '1', 'EX', seconds);
  }

  /**
   * Save OTP in Redis with SHA-256 hashing and 10-minute expiry (600 seconds)
   * Key: otp:phone:{e164Phone}:{purpose}
   * Payload: { otpHash, channel, purpose, attempts: 0, createdAt: timestamp, expiresAt: timestamp }
   */
  async saveOtp(phone, otp, channel = 'sms', purpose = 'login') {
    const store = getStore();
    const key = getOtpKey(phone, purpose);
    const ttlSeconds = (config.otp.expiryMinutes || 10) * 60;
    const now = Date.now();

    const payload = JSON.stringify({
      otpHash: hashOtp(otp),
      channel,
      purpose,
      attempts: 0,
      maxAttempts: config.otp.maxAttempts || 5,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
    });

    await store.set(key, payload, 'EX', ttlSeconds);
    logger.info(`Secure hashed OTP stored for ${phone} [${channel} / ${purpose}] with ${ttlSeconds}s TTL`, { service: 'otp' });
  }

  /**
   * Get raw OTP payload from Redis
   */
  async getOtpData(phone, purpose = 'login') {
    const store = getStore();
    const key = getOtpKey(phone, purpose);
    const raw = await store.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Verify provided OTP against Redis stored value using constant-time hash comparison
   */
  async verifyOtp(phone, inputOtp, expectedChannel = null, purpose = 'login') {
    const store = getStore();
    const key = getOtpKey(phone, purpose);
    const otpData = await this.getOtpData(phone, purpose);

    if (!otpData) {
      throw ApiError.badRequest('OTP expired or not found. Please request a new OTP.');
    }

    // Purpose validation
    if (otpData.purpose && otpData.purpose !== purpose) {
      throw ApiError.badRequest('OTP was issued for a different purpose.');
    }

    // Channel validation if specified
    if (expectedChannel && otpData.channel && otpData.channel !== expectedChannel) {
      throw ApiError.badRequest(`OTP was requested via ${otpData.channel.toUpperCase()}, please verify on the correct channel.`);
    }

    const maxAttempts = otpData.maxAttempts || config.otp.maxAttempts || 5;
    if (otpData.attempts >= maxAttempts) {
      await store.del(key);
      throw ApiError.tooMany('Maximum OTP verification attempts reached. Please request a new OTP.');
    }

    // Timing-safe comparison of SHA-256 hashes
    const isMatch = secureCompareOtp(inputOtp, otpData.otpHash);

    if (!isMatch) {
      // Increment attempts
      otpData.attempts += 1;
      const ttl = await store.ttl(key);
      const remainingTtl = ttl > 0 ? ttl : (config.otp.expiryMinutes || 10) * 60;
      await store.set(key, JSON.stringify(otpData), 'EX', remainingTtl);

      const remainingAttempts = maxAttempts - otpData.attempts;
      if (remainingAttempts <= 0) {
        await store.del(key);
        throw ApiError.tooMany('Maximum OTP verification attempts exceeded. This code is now invalid. Please request a new OTP.');
      }
      throw ApiError.badRequest(`Invalid OTP. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`);
    }

    // OTP matches cleanly -> consume key immediately to prevent replay attacks
    await store.del(key);

    // Clear cooldown on successful verification
    const cooldownKey = getCooldownKey(phone, purpose);
    await store.del(cooldownKey).catch(() => {});

    return {
      success: true,
      channel: otpData.channel,
      purpose: otpData.purpose,
      verifiedAt: new Date(),
    };
  }

  /**
   * Remove stored OTP from Redis
   */
  async deleteOtp(phone, purpose = 'login') {
    const store = getStore();
    const key = getOtpKey(phone, purpose);
    await store.del(key);
  }
}

module.exports = new RedisOtpService();


