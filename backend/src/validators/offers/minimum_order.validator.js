const Joi = require('joi');

/**
 * Validator for category: 'minimum_order'
 */
const minimumOrderConfigSchema = Joi.object({
  minOrderValue: Joi.number().min(0).required()
    .messages({ 'any.required': 'Minimum order value is required' }),
  discountValue: Joi.number().min(0).required(),
  maxDiscountLimit: Joi.number().min(0).allow(null).default(null),
  applicableProducts: Joi.array().items(Joi.string()).default([]),
});

module.exports = minimumOrderConfigSchema;
