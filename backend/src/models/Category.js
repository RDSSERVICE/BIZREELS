const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon_url: { type: String, default: null },
  image: { type: String, default: null },
  description: { type: String, default: null },
  parent_id: { type: String, default: null, index: true },
  sort_order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

categorySchema.index({ is_deleted: 1 });

module.exports = mongoose.model('Category', categorySchema, 'categories');

