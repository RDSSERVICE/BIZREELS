const Joi = require('joi');

/**
 * Validator for category: 'combo'
 */
const comboItemSchema = Joi.object({
  productId: Joi.string().allow(null, '').default(null),
  serviceId: Joi.string().allow(null, '').default(null),
  qty: Joi.number().integer().min(1).default(1),
});

const comboConfigSchema = Joi.object({
  items: Joi.array().items(comboItemSchema).min(2).required()
    .messages({ 'array.min': 'Combo must have at least 2 items' }),
  individualTotalPrice: Joi.number().min(0).required(),
  comboPrice: Joi.number().min(0).required(),
  customerSaving: Joi.number().min(0).allow(null).default(null),
  comboStock: Joi.number().integer().min(0).allow(null).default(null),
});

module.exports = comboConfigSchema;
