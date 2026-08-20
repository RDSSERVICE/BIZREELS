const Joi = require('joi');

/**
 * Validator for category: 'quantity_based'
 */
const slabSchema = Joi.object({
  minQty: Joi.number().integer().min(1).required(),
  maxQty: Joi.number().integer().min(1).allow(null).default(null),
  discountPercent: Joi.number().min(0).max(100).required(),
});

const quantityBasedConfigSchema = Joi.object({
  slabs: Joi.array().items(slabSchema).min(1).required()
    .messages({ 'array.min': 'At least one quantity slab is required' }),
});

module.exports = quantityBasedConfigSchema;
