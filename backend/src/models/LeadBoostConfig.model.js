const mongoose = require('mongoose');

/**
 * LeadBoostConfig Model
 * Configuration for lead acquisition, featured listing, reel boosting, and AI promotions.
 */
const leadBoostConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'singleton',
  },
  lead_cost_credits: {
    type: Number,
    required: true,
    default: 10, // credits per lead
  },
  featured_listing_credits: {
    type: Number,
    required: true,
    default: 50, // credits per week
  },
  reel_boost_credits: {
    type: Number,
    required: true,
    default: 25, // credits per boost campaign
  },
  ai_promotion_credits: {
    type: Number,
    required: true,
    default: 15, // credits per AI campaign
  },
  ad_charge_credits: {
    type: Number,
    required: true,
    default: 100, // custom ad credits
  },
  description: {
    type: String,
    default: 'Lead & Boost pricing configuration settings',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = registerOrReuse('LeadBoostConfig', leadBoostConfigSchema, 'lead_boost_configs');
