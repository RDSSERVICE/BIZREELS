const Joi = require('joi');

/**
 * Validator for category: 'festival_seasonal'
 */
const festivalSeasonalConfigSchema = Joi.object({
  festivalName: Joi.string().required(),
  offerPeriodStart: Joi.date().allow(null).default(null),
  offerPeriodEnd: Joi.date().allow(null).default(null),
  specialDiscount: Joi.number().min(0).allow(null).default(null),
  applicableProducts: Joi.array().items(Joi.string()).default([]),
  specialBannerUrl: Joi.string().uri().allow(null, '').default(null),
  dailyLimit: Joi.number().integer().min(0).allow(null).default(null),
  totalLimit: Joi.number().integer().min(0).allow(null).default(null),
  campaignType: Joi.string().valid('discount', 'combo', 'coupon').allow(null).default(null),
});

module.exports = festivalSeasonalConfigSchema;
