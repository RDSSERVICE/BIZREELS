const mongoose = require('mongoose');

/**
 * GSTConfig Model
 * Stores global tax rules, HSN codes, and active GST percentages.
 */
const gstConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'singleton',
  },
  gst_percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 18, // 18% GST default in India
  },
  hsn_codes: {
    type: [String],
    default: ['998314', '998313', '997331'], // Software, marketing, digital media services
  },
  tax_rules: {
    type: String,
    default: 'CGST (9%) + SGST (9%) applied on all digital invoice generation.',
  },
  description: {
    type: String,
    default: 'Global GST settings for invoices and top-ups',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = registerOrReuse('GSTConfig', gstConfigSchema, 'gst_configs');
