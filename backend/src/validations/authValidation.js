const { body } = require('express-validator');

/**
 * Auth Validation Rules
 * Express-validator chains for all auth endpoints.
 */
const authValidation = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required.')
      .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please provide a valid email.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character.'),
  ],

  loginEmail: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please provide a valid email.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.'),
  ],

  sendOtp: [
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required.')
      .custom((value) => {
        const digits = String(value).replace(/\D/g, '');
        const valid = (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) ||
                      (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) ||
                      (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1)));
        if (!valid) {
          throw new Error('Please provide a valid Indian mobile number starting with 6, 7, 8, or 9.');
        }
        return true;
      }),
    body('channel')
      .optional()
      .trim()
      .toLowerCase()
      .isIn(['sms', 'whatsapp']).withMessage('Channel must be "sms" or "whatsapp".'),
    body('purpose')
      .optional()
      .trim()
      .toLowerCase()
      .isIn(['login', 'register', 'phone_verification', 'verify-phone', 'password_reset', 'forgot-password', 'change_phone', 'sensitive_action'])
      .withMessage('Invalid OTP purpose.'),
  ],

  resendOtp: [
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required.')
      .custom((value) => {
        const digits = String(value).replace(/\D/g, '');
        const valid = (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) ||
                      (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) ||
                      (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1)));
        if (!valid) {
          throw new Error('Please provide a valid Indian mobile number starting with 6, 7, 8, or 9.');
        }
        return true;
      }),
    body('channel')
      .optional()
      .trim()
      .toLowerCase()
      .isIn(['sms', 'whatsapp']).withMessage('Channel must be "sms" or "whatsapp".'),
    body('purpose')
      .optional()
      .trim()
      .toLowerCase(),
  ],

  requestOtp: [
    body('identifier')
      .optional()
      .trim(),
    body('phone')
      .optional()
      .trim(),
    body('channel')
      .optional()
      .trim()
      .toLowerCase()
      .isIn(['sms', 'whatsapp']).withMessage('Channel must be "sms" or "whatsapp".'),
    body('purpose')
      .optional()
      .trim(),
  ],

  verifyOtp: [
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required.')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.')
      .isNumeric().withMessage('OTP must contain only numbers.'),
    body('phone')
      .optional()
      .trim(),
    body('channel')
      .optional()
      .trim()
      .toLowerCase()
      .isIn(['sms', 'whatsapp']).withMessage('Channel must be "sms" or "whatsapp".'),
    body('purpose')
      .optional()
      .trim(),
  ],

  sendPhoneOtp: [
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required.')
      .custom((value) => {
        const digits = String(value).replace(/\D/g, '');
        const valid = (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) ||
                      (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) ||
                      (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1)));
        if (!valid) {
          throw new Error('Please provide a valid Indian mobile number starting with 6, 7, 8, or 9.');
        }
        return true;
      }),
  ],

  verifyPhoneOtp: [
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required.'),
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required.')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.')
      .isNumeric().withMessage('OTP must contain only numbers.'),
  ],

  forgotPassword: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please provide a valid email.')
      .normalizeEmail(),
  ],

  resetPassword: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please provide a valid email.')
      .normalizeEmail(),
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required.')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.'),
    body('newPassword')
      .notEmpty().withMessage('New password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character.'),
  ],

  switchRole: [
    body('role')
      .notEmpty().withMessage('Role is required.')
      .isIn(['customer', 'vendor', 'creator']).withMessage('Role must be customer, vendor, or creator.'),
  ],

  addRole: [
    body('role')
      .notEmpty().withMessage('Role is required.')
      .isIn(['vendor', 'creator']).withMessage('Role must be vendor or creator.'),
  ],
};

module.exports = authValidation;
