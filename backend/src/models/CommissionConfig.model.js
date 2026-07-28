const mongoose = require('mongoose');

/**
 * CommissionConfig Model
 * Stores commission rates for platform, categories, marketplace products/services, and creator listings.
 */
const commissionConfigSchema = new mongoose.Schema({
  config_type: {
    type: String,
    enum: ['global', 'category', 'marketplace', 'creator', 'campaign', 'reel', 'sponsored_post'],
    required: true,
    index: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true,
  },
  category_name: {
    type: String,
    default: null,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100, // percentage e.g. 10 for 10%
    default: 0,
  },
  min_rate: {
    type: Number,
    default: 0,
  },
  max_rate: {
    type: Number,
    default: 100,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    default: null,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Ensure uniqueness per type/category
commissionConfigSchema.index({ config_type: 1, category_id: 1 }, { unique: true });

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = registerOrReuse('CommissionConfig', commissionConfigSchema, 'commission_configs');
