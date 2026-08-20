const Joi = require('joi');

/**
 * Validator for category: 'coupon'
 */
const couponConfigSchema = Joi.object({
  couponCode: Joi.string().uppercase().trim().min(3).max(20).required()
    .messages({ 'any.required': 'Coupon code is required' }),
  couponType: Joi.string().valid('fixed', 'percent').required(),
  minOrderAmount: Joi.number().min(0).default(0),
  maxDiscountLimit: Joi.number().min(0).allow(null).default(null),
  usagePerCustomer: Joi.number().integer().min(1).default(1),
  totalUsageLimit: Joi.number().integer().min(1).allow(null).default(null),
  applicableProducts: Joi.array().items(Joi.string()).default([]),
  visibility: Joi.string().valid('public', 'private', 'selected_customers').default('public'),
  selectedCustomerIds: Joi.array().items(Joi.string()).default([]),
});

module.exports = couponConfigSchema;
