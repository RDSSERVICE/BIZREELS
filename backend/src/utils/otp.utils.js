const crypto = require('crypto');
const ApiError = require('./ApiError');

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 * Uses crypto.randomInt (100000 to 999999 inclusive).
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hash an OTP for secure storage using SHA-256.
 */
const hashOtp = (otp) => {
  if (!otp) return '';
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
};

/**
 * Constant-time comparison between candidate OTP hash and stored OTP hash.
 * Prevents timing attacks.
 */
const secureCompareOtp = (candidateOtp, storedHash) => {
  if (!candidateOtp || !storedHash) return false;
  const candidateHash = hashOtp(candidateOtp);
  const candidateBuf = Buffer.from(candidateHash, 'hex');
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (candidateBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, storedBuf);
};

/**
 * Normalize and validate Indian mobile phone numbers to E.164 format (+91XXXXXXXXXX).
 * Accepts: "9876543210", "+919876543210", "919876543210", "09876543210", "+91 98765 43210"
 * Returns: "+919876543210"
 */
const normalizeIndianPhone = (rawPhone) => {
  if (!rawPhone) {
    throw ApiError.badRequest('Phone number is required.');
  }

  let digits = String(rawPhone).replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw ApiError.badRequest('Invalid Indian mobile number. Please provide a valid 10-digit number starting with 6, 7, 8, or 9.');
  }

  return `+91${digits}`;
};

/**
 * Extract 10-digit mobile number from normalized E.164 phone.
 */
const extract10DigitPhone = (rawPhone) => {
  const normalized = normalizeIndianPhone(rawPhone);
  return normalized.replace(/^\+91/, '');
};

module.exports = {
  generateOtp,
  hashOtp,
  secureCompareOtp,
  normalizeIndianPhone,
  extract10DigitPhone,
};


