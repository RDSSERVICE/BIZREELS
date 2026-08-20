const Joi = require('joi');

/**
 * Validator for category: 'package_offer'
 */
const packageItemSchema = Joi.object({
  serviceId: Joi.string().required(),
  count: Joi.number().integer().min(1).default(1),
});

const packageOfferConfigSchema = Joi.object({
  packageItems: Joi.array().items(packageItemSchema).min(1).required()
    .messages({ 'array.min': 'At least one service is required in the package' }),
  numberOfServices: Joi.number().integer().min(1).allow(null).default(null),
  packagePrice: Joi.number().min(0).required(),
  validityDays: Joi.number().integer().min(1).required(),
  usageLimit: Joi.number().integer().min(1).allow(null).default(null),
  transferable: Joi.boolean().default(false),
});

module.exports = packageOfferConfigSchema;
