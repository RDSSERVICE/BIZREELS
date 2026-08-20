const Joi = require('joi');

/**
 * Validator for category: 'service_offer'
 */
const serviceOfferConfigSchema = Joi.object({
  serviceId: Joi.string().allow(null, '').default(null),
  serviceDuration: Joi.string().allow(null, '').default(null),
  normalPrice: Joi.number().min(0).required(),
  offerPrice: Joi.number().min(0).required(),
  bookingRequirement: Joi.string().allow(null, '').default(null),
  appointmentRequired: Joi.boolean().default(false),
  availableDays: Joi.array().items(
    Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')
  ).default([]),
  availableTime: Joi.string().allow(null, '').default(null),
  customerCapacity: Joi.number().integer().min(1).allow(null).default(null),
});

module.exports = serviceOfferConfigSchema;
