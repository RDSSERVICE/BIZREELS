const Joi = require('joi');

/**
 * Validator for category: 'repeat_customer'
 */
const repeatCustomerConfigSchema = Joi.object({
  requiredPreviousOrders: Joi.number().integer().min(1).default(1),
  requiredPreviousPurchaseAmount: Joi.number().min(0).allow(null).default(null),
  discountType: Joi.string().valid('fixed', 'percent').required(),
  discountValue: Joi.number().min(0).required(),
  validityAfterPreviousOrderDays: Joi.number().integer().min(1).allow(null).default(null),
});

module.exports = repeatCustomerConfigSchema;
