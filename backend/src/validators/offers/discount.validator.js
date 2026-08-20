const Joi = require('joi');

/**
 * Validator for category: 'discount'
 * Extra Menu: discountType, discountValue, applicableOn, minOrderAmount, maxDiscountLimit
 */
const discountConfigSchema = Joi.object({
  discountType: Joi.string().valid('fixed', 'percent', 'up_to').required()
    .messages({ 'any.required': 'Discount type is required' }),
  discountValue: Joi.number().min(0).required()
    .messages({ 'any.required': 'Discount value is required' }),
  applicableOn: Joi.string().valid('single_product', 'multiple_products', 'category', 'store').default('store'),
  minOrderAmount: Joi.number().min(0).default(0),
  maxDiscountLimit: Joi.number().min(0).allow(null).default(null),
});

module.exports = discountConfigSchema;
