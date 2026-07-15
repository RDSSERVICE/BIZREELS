const mongoose = require('mongoose');

// Requirement
const reqLocationSchema = new mongoose.Schema({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  area: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: null },
  pincode: { type: String, required: true },
  geo: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const reqMediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
}, { _id: false });

const requirementSchema = new mongoose.Schema({
  customer_id: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  category_id: { type: String, required: true },
  sub_category_id: { type: String, default: null },
  budget_min: { type: Number, default: null },
  budget_max: { type: Number, default: null },
  photos: { type: [reqMediaSchema], default: [] },
  video: { type: reqMediaSchema, default: null },
  location: { type: reqLocationSchema, required: true },
  urgency: { type: String, enum: ['immediate', 'this_week', 'this_month', 'flexible'], default: 'flexible' },
  is_negotiable: { type: Boolean, default: true },
  expires_at: { type: String, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  status: { type: String, enum: ['open', 'closed', 'expired'], default: 'open', index: true },
  proposals_count: { type: Number, default: 0 },
  views_count: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

requirementSchema.index({ is_deleted: 1 });
requirementSchema.index({ 'location.geo': '2dsphere' });
requirementSchema.index({ title: 'text', description: 'text' }, { name: 'req_text' });

module.exports = mongoose.model('Requirement', requirementSchema, 'requirements');
