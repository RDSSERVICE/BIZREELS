const Joi = require('joi');

/**
 * Validator for category: 'free_product'
 */
const freeProductConfigSchema = Joi.object({
  purchaseRequirementType: Joi.string().valid('min_amount', 'min_qty', 'specific_product').required(),
  purchaseRequirementValue: Joi.alternatives().conditional('purchaseRequirementType', {
    is: 'specific_product',
    then: Joi.string().required(),
    otherwise: Joi.number().min(0).required(),
  }),
  freeProductId: Joi.string().allow(null, '').default(null),
  freeQuantity: Joi.number().integer().min(1).default(1),
  giftValue: Joi.number().min(0).allow(null).default(null),
  giftStockLimit: Joi.number().integer().min(0).allow(null).default(null),
});

module.exports = freeProductConfigSchema;
