const Joi = require('joi');

/**
 * Validator for category: 'special_price'
 */
const specialPriceConfigSchema = Joi.object({
  regularPrice: Joi.number().min(0).required(),
  offerPrice: Joi.number().min(0).required(),
  customerEligibility: Joi.string().allow(null, '').default(null),
  validityDays: Joi.number().integer().min(1).allow(null).default(null),
  quantityLimit: Joi.number().integer().min(1).allow(null).default(null),
});

module.exports = specialPriceConfigSchema;
