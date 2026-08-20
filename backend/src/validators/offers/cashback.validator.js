const Joi = require('joi');

/**
 * Validator for category: 'cashback'
 * NOTE: Cashback settlement method flagged for product decision.
 */
const cashbackConfigSchema = Joi.object({
  cashbackType: Joi.string().valid('fixed', 'percent').required(),
  cashbackValue: Joi.number().min(0).required(),
  minPurchase: Joi.number().min(0).default(0),
  maxCashback: Joi.number().min(0).allow(null).default(null),
  settlementMethod: Joi.string().allow(null, '').default(null),
});

module.exports = cashbackConfigSchema;
