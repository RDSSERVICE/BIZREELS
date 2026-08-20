const Joi = require('joi');

/**
 * Validator for category: 'customer_specific'
 */
const customerSpecificConfigSchema = Joi.object({
  customerSelectionIds: Joi.array().items(Joi.string()).default([]),
  customerGroup: Joi.string().allow(null, '').default(null),
  eligibility: Joi.string().allow(null, '').default(null),
  specialPrice: Joi.number().min(0).allow(null).default(null),
  usageLimit: Joi.number().integer().min(1).allow(null).default(null),
  hiddenFromPublicFeed: Joi.boolean().default(true),
});

module.exports = customerSpecificConfigSchema;
