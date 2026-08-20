const Joi = require('joi');

/**
 * Validator for category: 'referral'
 */
const referralConfigSchema = Joi.object({
  referralRequirement: Joi.string().default('referred customer completes first order'),
  referrerBenefitType: Joi.string().valid('wallet', 'coupon').default('coupon'),
  referrerBenefitValue: Joi.number().min(0).required()
    .messages({ 'any.required': 'Referrer benefit value is required' }),
  newCustomerBenefitType: Joi.string().valid('wallet', 'coupon').default('coupon'),
  newCustomerBenefitValue: Joi.number().min(0).required()
    .messages({ 'any.required': 'New customer benefit value is required' }),
  minPurchaseAmount: Joi.number().min(0).default(0),
  referralLimitPerCustomer: Joi.number().integer().min(1).default(10),
  validityDays: Joi.number().integer().min(1).default(30),
});

module.exports = referralConfigSchema;
