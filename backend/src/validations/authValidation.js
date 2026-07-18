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

  requestOtp: [
    body('identifier')
      .trim()
      .notEmpty().withMessage('Email or phone number is required.'),
    body('identifierType')
      .notEmpty().withMessage('Identifier type is required.')
      .isIn(['email', 'phone']).withMessage('Identifier type must be "email" or "phone".'),
  ],

  verifyOtp: [
    body('identifier')
      .trim()
      .notEmpty().withMessage('Email or phone number is required.'),
    body('identifierType')
      .notEmpty().withMessage('Identifier type is required.')
      .isIn(['email', 'phone']).withMessage('Identifier type must be "email" or "phone".'),
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
