const Joi = require('joi');

/**
 * Validator for category: 'buy_x_get_y'
 */
const buyXGetYConfigSchema = Joi.object({
  buyQuantity: Joi.number().integer().min(1).required()
    .messages({ 'any.required': 'Buy quantity is required' }),
  getQuantity: Joi.number().integer().min(1).required()
    .messages({ 'any.required': 'Get quantity is required' }),
  freeItemType: Joi.string().valid('same_product', 'different_product').default('same_product'),
  freeProductId: Joi.string().allow(null, '').default(null),
  maxRedemptionsPerCustomer: Joi.number().integer().min(1).allow(null).default(null),
});

module.exports = buyXGetYConfigSchema;
