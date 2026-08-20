const Joi = require('joi');

/**
 * Validator for category: 'first_order'
 */
const firstOrderConfigSchema = Joi.object({
  discountType: Joi.string().valid('fixed', 'percent').required(),
  discountValue: Joi.number().min(0).required(),
  minOrderAmount: Joi.number().min(0).default(0),
  maxBenefit: Joi.number().min(0).allow(null).default(null),
  newCustomerDefinitionDays: Joi.number().integer().min(1).default(30),
});

module.exports = firstOrderConfigSchema;
