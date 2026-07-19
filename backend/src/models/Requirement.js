const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  customer_id: { type: String, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, default: null },
  category_id: { type: String, default: 'General' },
  category: { type: String, default: 'General' },
  requirementType: { type: String, enum: ['product', 'service'], default: 'product' },
  type: { type: String, enum: ['product', 'service'], default: 'product' },
  sub_category_id: { type: String, default: null },
  budget: { type: Number, default: 0 },
  budget_min: { type: Number, default: null },
  budget_max: { type: Number, default: null },
  deadline: { type: Date, default: null },
  photos: { type: [mongoose.Schema.Types.Mixed], default: [] },
  video: { type: mongoose.Schema.Types.Mixed, default: null },
  location: { type: mongoose.Schema.Types.Mixed, default: () => ({ area: 'Local', city: 'Delhi', pincode: '110001' }) },
  urgency: { type: String, default: 'flexible' },
  is_negotiable: { type: Boolean, default: true },
  expires_at: { type: String, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  status: { type: String, default: 'open', index: true },
  proposals_count: { type: Number, default: 0 },
  quotesCount: { type: Number, default: 0 },
  views_count: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

requirementSchema.index({ is_deleted: 1, isDeleted: 1 });
requirementSchema.index({ customer_id: 1, customer: 1 });
requirementSchema.index({ title: 'text', description: 'text' }, { name: 'req_text' });

module.exports = mongoose.model('Requirement', requirementSchema, 'requirements');
