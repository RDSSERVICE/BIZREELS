const Joi = require('joi');

/**
 * Validator for category: 'free_delivery'
 */
const freeDeliveryConfigSchema = Joi.object({
  minOrderValue: Joi.number().min(0).default(0),
  deliveryArea: Joi.string().allow(null, '').default(null),
  maxDeliveryDistanceKm: Joi.number().min(0).allow(null).default(null),
  applicableProducts: Joi.array().items(Joi.string()).default([]),
  deliveryType: Joi.string().valid('local', 'standard', 'express').default('local'),
});

module.exports = freeDeliveryConfigSchema;
