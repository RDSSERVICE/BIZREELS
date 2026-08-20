const Joi = require('joi');

/**
 * Validator for category: 'location_based'
 */
const locationBasedConfigSchema = Joi.object({
  locationType: Joi.string().valid('radius', 'city', 'area', 'pincode').required(),
  distanceOrAreaValue: Joi.alternatives().conditional('locationType', {
    is: 'radius',
    then: Joi.number().min(0).required(),
    otherwise: Joi.string().required(),
  }),
  applicableCustomers: Joi.string().allow(null, '').default(null),
  offerValue: Joi.number().min(0).allow(null).default(null),
});

module.exports = locationBasedConfigSchema;
