const { getStore } = require('../config/redis');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const getKey = (phone) => `otp:phone:${phone.replace(/\D/g, '')}`;

class RedisOtpService {
  /**
   * Save OTP in Redis with 5-minute expiry (300 seconds)
   * Key: otp:phone:{phone}
   * Payload: { otp, attempts: 0, createdAt: timestamp }
   */
  async saveOtp(phone, otp) {
    const store = getStore();
    const key = getKey(phone);
    const ttlSeconds = (config.otp.expiryMinutes || 5) * 60;

    const payload = JSON.stringify({
      otp: String(otp),
      attempts: 0,
      createdAt: Date.now(),
    });

    await store.set(key, payload, 'EX', ttlSeconds);
    logger.info(`OTP stored in Redis for ${phone} with ${ttlSeconds}s TTL`, { service: 'otp' });
  }

  /**
   * Get raw OTP payload from Redis
   */
  async getOtpData(phone) {
    const store = getStore();
    const key = getKey(phone);
    const raw = await store.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Verify provided OTP against Redis stored value
   */
  async verifyOtp(phone, inputOtp) {
    const store = getStore();
    const key = getKey(phone);
    const otpData = await this.getOtpData(phone);

    if (!otpData) {
      throw ApiError.badRequest('OTP expired or not found. Please request a new OTP.');
    }

    if (otpData.attempts >= (config.otp.maxAttempts || 5)) {
      await store.del(key);
      throw ApiError.tooMany('Maximum OTP verification attempts reached. Please request a new OTP.');
    }

    if (String(otpData.otp).trim() !== String(inputOtp).trim()) {
      // Increment attempts
      otpData.attempts += 1;
      const ttl = await store.ttl(key);
      const remainingTtl = ttl > 0 ? ttl : 300;
      await store.set(key, JSON.stringify(otpData), 'EX', remainingTtl);

      const remainingAttempts = config.otp.maxAttempts - otpData.attempts;
      throw ApiError.badRequest(`Invalid OTP. ${remainingAttempts} attempts remaining.`);
    }

    // OTP matches cleanly -> consume key immediately to prevent replay attacks
    await store.del(key);
    return true;
  }

  /**
   * Remove stored OTP from Redis
   */
  async deleteOtp(phone) {
    const store = getStore();
    const key = getKey(phone);
    await store.del(key);
  }
}

module.exports = new RedisOtpService();
