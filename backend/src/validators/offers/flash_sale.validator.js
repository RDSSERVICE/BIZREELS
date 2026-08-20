const Joi = require('joi');

/**
 * Validator for category: 'flash_sale'
 */
const flashSaleConfigSchema = Joi.object({
  startTime: Joi.date().allow(null).default(null),
  endTime: Joi.date().allow(null).default(null),
  discountValue: Joi.number().min(0).required(),
  limitedQuantity: Joi.number().integer().min(1).allow(null).default(null),
  perCustomerLimit: Joi.number().integer().min(1).allow(null).default(null),
  countdownTimerEnabled: Joi.boolean().default(true),
});

module.exports = flashSaleConfigSchema;
