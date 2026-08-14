const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * CategoryRequest Model
 * Tracks customer requests for new categories/subcategories
 * that need admin approval before being added to the system.
 */
const categoryRequestSchema = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  requirement: {
    type: Schema.Types.ObjectId,
    ref: 'Requirement',
    default: null,
  },
  requirementType: {
    type: String,
    enum: ['product', 'service'],
    required: true,
  },
  requestedCategory: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  requestedSubcategory: {
    type: String,
    default: null,
    trim: true,
    maxlength: 100,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  adminNotes: {
    type: String,
    default: null,
    maxlength: 500,
  },
  approvedCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  processedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

categoryRequestSchema.index({ status: 1, createdAt: -1 });
categoryRequestSchema.index({ customer: 1, status: 1 });

module.exports = mongoose.models.CategoryRequest || mongoose.model('CategoryRequest', categoryRequestSchema);
