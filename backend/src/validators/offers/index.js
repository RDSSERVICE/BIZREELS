/**
 * Offer Validator Dispatcher
 * Returns the Joi schema for a given offer category's config.
 */
const { CATEGORY_KEYS } = require('../../constants/offerCategories');

const validators = {
  discount: require('./discount.validator'),
  buy_x_get_y: require('./buy_x_get_y.validator'),
  free_product: require('./free_product.validator'),
  combo: require('./combo.validator'),
  coupon: require('./coupon.validator'),
  first_order: require('./first_order.validator'),
  repeat_customer: require('./repeat_customer.validator'),
  festival_seasonal: require('./festival_seasonal.validator'),
  flash_sale: require('./flash_sale.validator'),
  quantity_based: require('./quantity_based.validator'),
  free_delivery: require('./free_delivery.validator'),
  service_offer: require('./service_offer.validator'),
  package_offer: require('./package_offer.validator'),
  cashback: require('./cashback.validator'),
  referral: require('./referral.validator'),
  customer_specific: require('./customer_specific.validator'),
  location_based: require('./location_based.validator'),
  minimum_order: require('./minimum_order.validator'),
  special_price: require('./special_price.validator'),
};

/**
 * Get the Joi validator schema for a given category.
 * @param {string} category - One of the 19 category keys
 * @returns {import('joi').ObjectSchema|null} - Joi schema or null if unknown
 */
function getValidatorForCategory(category) {
  return validators[category] || null;
}

/**
 * Validate an offer's config against its category schema.
 * @param {string} category - Offer category key
 * @param {object} config - The config object to validate
 * @returns {{ valid: boolean, value?: object, error?: string }}
 */
function validateOfferConfig(category, config) {
  if (!CATEGORY_KEYS.includes(category)) {
    return { valid: false, error: `Unknown offer category: ${category}` };
  }

  const schema = getValidatorForCategory(category);
  if (!schema) {
    return { valid: false, error: `No validator found for category: ${category}` };
  }

  const { error, value } = schema.validate(config || {}, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map(d => d.message).join('; ');
    return { valid: false, error: messages };
  }

  return { valid: true, value };
}

module.exports = {
  getValidatorForCategory,
  validateOfferConfig,
};
