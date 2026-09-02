const { normalizeIndianPhone, generateOtp, hashOtp, secureCompareOtp, extract10DigitPhone } = require('../src/utils/otp.utils');
const smsService = require('../src/services/sms.service');
const whatsappService = require('../src/services/whatsapp.service');
const otpService = require('../src/services/otp.service');
const redisOtpService = require('../src/services/redis-otp.service');

describe('Production OTP & Dual-Channel (SMS & WhatsApp) Test Suite', () => {
  describe('1. Indian Phone Number Normalization to E.164 (+91)', () => {
    it('should normalize standard 10-digit number to +91', () => {
      expect(normalizeIndianPhone('9876543210')).toBe('+919876543210');
    });

    it('should normalize +91 formatted numbers', () => {
      expect(normalizeIndianPhone('+919876543210')).toBe('+919876543210');
    });

    it('should normalize 91 prefixed 12-digit numbers', () => {
      expect(normalizeIndianPhone('919876543210')).toBe('+919876543210');
    });

    it('should normalize leading 0 prefixed 11-digit numbers', () => {
      expect(normalizeIndianPhone('09876543210')).toBe('+919876543210');
    });

    it('should handle spaced or hyphenated Indian numbers', () => {
      expect(normalizeIndianPhone('+91 98765 43210')).toBe('+919876543210');
      expect(normalizeIndianPhone('+91-98765-43210')).toBe('+919876543210');
    });

    it('should extract 10-digit number correctly', () => {
      expect(extract10DigitPhone('+919876543210')).toBe('9876543210');
      expect(extract10DigitPhone('9876543210')).toBe('9876543210');
    });

    it('should reject invalid numbers or numbers starting with invalid digits', () => {
      expect(() => normalizeIndianPhone('1234567890')).toThrow();
      expect(() => normalizeIndianPhone('5555555555')).toThrow();
      expect(() => normalizeIndianPhone('98765')).toThrow();
      expect(() => normalizeIndianPhone('')).toThrow();
      expect(() => normalizeIndianPhone(null)).toThrow();
    });
  });

  describe('2. Cryptographic OTP Generation & Timing-Safe Hashing', () => {
    it('should generate a 6-digit numerical string in [100000, 999999]', () => {
      for (let i = 0; i < 50; i++) {
        const otp = generateOtp();
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
        const num = parseInt(otp, 10);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThanOrEqual(999999);
      }
    });

    it('should produce SHA-256 hex hash of length 64', () => {
      const hash = hashOtp('123456');
      expect(hash).toHaveLength(64);
      expect(hashOtp('123456')).toBe(hash);
    });

    it('should perform timing-safe comparison correctly', () => {
      const storedHash = hashOtp('582910');
      expect(secureCompareOtp('582910', storedHash)).toBe(true);
      expect(secureCompareOtp('000000', storedHash)).toBe(false);
      expect(secureCompareOtp('58291', storedHash)).toBe(false);
      expect(secureCompareOtp('', storedHash)).toBe(false);
    });
  });

  describe('3. Twilio SMS & WhatsApp Provider Dispatching', () => {
    it('should dispatch SMS successfully with formatted phone and OTP', async () => {
      const res = await smsService.sendOtpSms('9876543210', '849201');
      expect(res.success).toBe(true);
      expect(res.phone).toBe('+919876543210');
    });

    it('should dispatch WhatsApp successfully with formatted phone and OTP', async () => {
      const res = await whatsappService.sendOtpWhatsApp('9876543210', '849201');
      expect(res.success).toBe(true);
      expect(res.phone).toBe('+919876543210');
    });
  });

  describe('4. Unified OTP Service (SMS Channel)', () => {
    const testPhone = '9876543210';

    beforeEach(async () => {
      await redisOtpService.deleteOtp(testPhone, 'login');
      await redisOtpService.deleteCooldown(testPhone, 'login');
    });

    it('should send SMS OTP successfully and record in store', async () => {
      const result = await otpService.sendOtp({
        phone: testPhone,
        channel: 'sms',
        purpose: 'login',
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe('sms');
      expect(result.phone).toBe('+919876543210');
      expect(result.expiresInMinutes).toBeGreaterThan(0);
      expect(result.cooldownSeconds).toBe(60);
    });

    it('should reject resend during active 60s cooldown', async () => {
      await otpService.sendOtp({ phone: testPhone, channel: 'sms', purpose: 'login' });

      await expect(
        otpService.sendOtp({ phone: testPhone, channel: 'sms', purpose: 'login' })
      ).rejects.toThrow(/Please wait/i);
    });

    it('should verify correct OTP and invalidate key to prevent reuse', async () => {
      const sent = await otpService.sendOtp({ phone: testPhone, channel: 'sms', purpose: 'login' });
      const generatedOtp = sent.otp;

      const verified = await otpService.verifyOtp({
        phone: testPhone,
        otp: generatedOtp,
        channel: 'sms',
        purpose: 'login',
      });

      expect(verified.success).toBe(true);
      expect(verified.phone).toBe('+919876543210');

      // Attempting to verify the same OTP again must fail (single-use)
      await expect(
        otpService.verifyOtp({
          phone: testPhone,
          otp: generatedOtp,
          channel: 'sms',
          purpose: 'login',
        })
      ).rejects.toThrow(/OTP expired or not found/i);
    });

    it('should track incorrect OTP attempts and decrement remaining attempts', async () => {
      const sent = await otpService.sendOtp({ phone: testPhone, channel: 'sms', purpose: 'login' });

      await expect(
        otpService.verifyOtp({
          phone: testPhone,
          otp: '000000',
          channel: 'sms',
          purpose: 'login',
        })
      ).rejects.toThrow(/4 attempts remaining/i);
    });

    it('should block and invalidate OTP after max failed attempts (5 attempts)', async () => {
      await otpService.sendOtp({ phone: testPhone, channel: 'sms', purpose: 'login' });

      for (let i = 0; i < 4; i++) {
        try {
          await otpService.verifyOtp({ phone: testPhone, otp: '000000', channel: 'sms', purpose: 'login' });
        } catch {}
      }

      // 5th attempt should exceed max attempts
      await expect(
        otpService.verifyOtp({ phone: testPhone, otp: '000000', channel: 'sms', purpose: 'login' })
      ).rejects.toThrow(/Maximum OTP verification attempts exceeded/i);
    });
  });

  describe('5. Unified OTP Service (WhatsApp Channel)', () => {
    const testPhone = '9876543211';

    beforeEach(async () => {
      await redisOtpService.deleteOtp(testPhone, 'login');
      await redisOtpService.deleteCooldown(testPhone, 'login');
    });

    it('should send WhatsApp OTP and verify correctly', async () => {
      const sent = await otpService.sendOtp({
        phone: testPhone,
        channel: 'whatsapp',
        purpose: 'login',
      });

      expect(sent.success).toBe(true);
      expect(sent.channel).toBe('whatsapp');

      const verified = await otpService.verifyOtp({
        phone: testPhone,
        otp: sent.otp,
        channel: 'whatsapp',
        purpose: 'login',
      });

      expect(verified.success).toBe(true);
      expect(verified.channel).toBe('whatsapp');
    });

    it('should reject invalid or unsupported channels', async () => {
      await expect(
        otpService.sendOtp({
          phone: testPhone,
          channel: 'telegram',
          purpose: 'login',
        })
      ).rejects.toThrow(/Unsupported OTP delivery channel/i);
    });
  });

  describe('6. Purpose Segregation & Security', () => {
    const testPhone = '9876543212';

    beforeEach(async () => {
      await redisOtpService.deleteOtp(testPhone, 'register');
      await redisOtpService.deleteOtp(testPhone, 'login');
      await redisOtpService.deleteCooldown(testPhone, 'register');
      await redisOtpService.deleteCooldown(testPhone, 'login');
    });

    it('should not allow an OTP generated for registration to verify a login purpose', async () => {
      const sent = await otpService.sendOtp({
        phone: testPhone,
        channel: 'sms',
        purpose: 'register',
      });

      await expect(
        otpService.verifyOtp({
          phone: testPhone,
          otp: sent.otp,
          channel: 'sms',
          purpose: 'login', // mismatched purpose
        })
      ).rejects.toThrow(/OTP expired or not found/i);
    });
  });
});
